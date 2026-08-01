// ============================================================================
// casbin.service.ts — Motor de permisos en memoria (ver ADR-005-rbac-engine.md).
//
// RESPONSABILIDAD de esta clase: mantener un "Enforcer" de Casbin (el objeto
// que sabe responder "¿puede fulano hacer esto?") sincronizado con las
// tablas ROLE / PERMISSION / ROLE_PERMISSION / USER_ROLE de nuestra base de
// datos (ver schema.prisma), que son la FUENTE DE VERDAD real — Casbin es
// solo una copia en memoria optimizada para responder rapido, no donde se
// guardan los datos.
//
// COMO SE MANTIENE SINCRONIZADO (simplificacion deliberada de esta primera
// version): "loadPolicies()" se llama una vez al arrancar la aplicacion
// (onModuleInit) y se puede volver a llamar manualmente (por ahora, vía
// "reload()") despues de que un Admin de entidad cambie roles/permisos desde
// el panel. Una version mas avanzada (fase posterior, ver
// docs/architecture/06-roadmap.md) usaria un "watcher" sobre Redis para
// recargar automaticamente en todas las replicas del backend en cuanto algo
// cambia — no se implementa todavia porque, con una sola instancia del
// backend corriendo (como en desarrollo y en el MVP), no hace falta esa
// complejidad adicional.
//
// Relacion con el resto del proyecto:
// - Usa PrismaService para leer las tablas de RBAC (ver src/prisma/).
// - permissions.guard.ts llama a "can(...)" en cada request protegido.
// ============================================================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { newEnforcer, newModelFromString, Enforcer } from 'casbin';
import { PrismaService } from '../prisma/prisma.service';
import { CASBIN_MODEL_TEXT } from './casbin-model';

@Injectable()
export class CasbinService implements OnModuleInit {
  private readonly logger = new Logger(CasbinService.name);
  private enforcer: Enforcer;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const model = newModelFromString(CASBIN_MODEL_TEXT);
    // Sin adaptador (segundo argumento omitido): el enforcer queda en
    // memoria, sin intentar leer/guardar politicas por su cuenta — nosotros
    // se las cargamos a mano en loadPolicies(), abajo.
    this.enforcer = await newEnforcer(model);
    await this.loadPolicies();
  }

  // Vuelve a leer TODO desde la base de datos y reconstruye las politicas
  // en memoria desde cero. Se expone publico para poder llamarlo despues de
  // operaciones administrativas (ej. un futuro endpoint "reasignar rol").
  async reload(): Promise<void> {
    await this.loadPolicies();
  }

  private async loadPolicies(): Promise<void> {
    this.enforcer.clearPolicy();

    // --- Politicas (p): que puede hacer cada ROL ---
    // Se usa DATABASE_URL (a traves de PrismaService.$queryRaw... en
    // realidad usamos el cliente normal) sin pasar por "withTenant": estas
    // tablas (roles, permissions, role_permissions) NO tienen Row-Level
    // Security (ver el principio de rls-policies.sql) porque son catalogo
    // compartido, no datos de negocio de un tenant especifico.
    const rolePermissions = await this.prisma.rolePermission.findMany({
      include: { permission: true },
    });
    for (const rp of rolePermissions) {
      // dominio "*": el permiso de un rol es el mismo sin importar en que
      // tenant/curso este asignado (ver la explicacion en casbin-model.ts).
      await this.enforcer.addPolicy(rp.roleId, '*', rp.permission.resource, rp.permission.action);
    }

    // --- Relaciones (g): que ROL tiene cada usuario, en que dominio ---
    // "user_roles" SI tiene Row-Level Security (ver rls-policies.sql), y
    // PrismaService se conecta con el rol restringido "stoka_app" (ver
    // RUNTIME_DATABASE_URL) — es DELIBERADO no tener, en ningun lugar del
    // codigo de aplicacion, un atajo que se salte RLS para "leer de todos
    // los tenants de una": eso reabriria exactamente el problema que
    // ADR-001-multi-tenancy.md busca evitar. En cambio, se recorre tenant
    // por tenant, usando withTenant(...) para cada uno (tenants.findMany
    // SI se puede leer sin restriccion: esa tabla no tiene RLS, ver el
    // principio de rls-policies.sql — es el "indice" de tenants, no datos
    // de un tenant especifico).
    const tenants = await this.prisma.tenant.findMany({ select: { id: true } });

    let totalUserRoles = 0;
    for (const tenant of tenants) {
      const userRoles = await this.prisma.withTenant(tenant.id, (tx) =>
        tx.userRole.findMany({ include: { userTenant: true } }),
      );
      totalUserRoles += userRoles.length;

      for (const ur of userRoles) {
        const domain = ur.scopeCourseId
          ? `course:${ur.scopeCourseId}`
          : `tenant:${ur.tenantId}`;
        await this.enforcer.addGroupingPolicy(ur.userTenant.userId, ur.roleId, domain);
      }
    }

    this.logger.log(
      `Politicas RBAC cargadas: ${rolePermissions.length} permisos de rol, ${totalUserRoles} asignaciones de usuario (${tenants.length} tenants).`,
    );
  }

  // ---------------------------------------------------------------------
  // can: pregunta real que hace permissions.guard.ts.
  //
  // Revisa DOS dominios porque un rol puede estar asignado a nivel de todo
  // el tenant (ej. Administrador de entidad) o acotado a un curso especifico
  // (ej. Docente en SU curso) — ver docs/architecture/03-rbac.md, seccion
  // 3.2 y el ejemplo del profesor que tambien es estudiante. Si CUALQUIERA
  // de los dos dominios concede el permiso, se permite la accion.
  // ---------------------------------------------------------------------
  async can(
    userId: string,
    tenantId: string,
    resource: string,
    action: string,
    courseId?: string,
  ): Promise<boolean> {
    if (courseId) {
      const allowedInCourse = await this.enforcer.enforce(
        userId,
        `course:${courseId}`,
        resource,
        action,
      );
      if (allowedInCourse) {
        return true;
      }
    }

    return this.enforcer.enforce(userId, `tenant:${tenantId}`, resource, action);
  }
}
