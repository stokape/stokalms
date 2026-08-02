// ============================================================================
// app.module.ts — Modulo raiz de la aplicacion NestJS.
//
// Aqui se declara la lista de TODOS los modulos que componen el backend.
// A medida que se construyan los modulos de negocio de las proximas fases
// (Academico, Matricula, Evaluaciones/Gradebook, Certificados, RBAC...) cada
// uno se agrega a la lista "imports" de abajo — este archivo es literalmente
// el "indice" de que partes tiene el backend en un momento dado.
//
// Relacion con el resto del proyecto:
// - main.ts (src/main.ts) es quien arranca la aplicacion A PARTIR de este
//   modulo (NestFactory.create(AppModule)).
// - ConfigModule lee las variables de entorno a traves de
//   src/config/configuration.ts (que a su vez documenta cada variable en
//   ".env.example", en la raiz del repo).
// - "configure()" (al final del archivo) es donde se activa el middleware
//   de resolucion de tenant (ver src/common/tenant/) para TODAS las rutas.
// ============================================================================

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './common/tenant/tenant.module';
import { TenantContextMiddleware } from './common/tenant/tenant-context.middleware';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './auth/auth.module';
import { RbacModule } from './rbac/rbac.module';
import { StorageModule } from './common/storage/storage.module';
import { AcademicModule } from './modules/academic/academic.module';
import { ContentModule } from './modules/content/content.module';
import { EnrollmentModule } from './modules/enrollment/enrollment.module';
import { GradebookModule } from './modules/gradebook/gradebook.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { TenantRegistrationModule } from './modules/tenant-registration/tenant-registration.module';
import { TenantSettingsModule } from './modules/tenant/tenant-settings.module';
import { UserManagementModule } from './modules/user-management/user-management.module';

@Module({
  imports: [
    // ConfigModule.forRoot() con "isGlobal: true" carga las variables de
    // entorno UNA vez al arrancar y las deja disponibles (via ConfigService)
    // en cualquier modulo, sin tener que re-importar ConfigModule cada vez.
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration], // Ver src/config/configuration.ts.
    }),

    // Acceso a la base de datos (ver src/prisma/prisma.module.ts). Es
    // @Global(), pero igual se importa aqui explicitamente en el modulo raiz
    // por claridad de lectura del arbol de dependencias.
    PrismaModule,

    // Resolucion del tenant activo por request (ver src/common/tenant/).
    TenantModule,

    // Cliente de almacenamiento de archivos (MinIO/S3), usado por
    // Certificados hoy y por cualquier modulo futuro que suba archivos
    // (ver src/common/storage/).
    StorageModule,

    // Autenticacion contra Keycloak + aprovisionamiento JIT (ver src/auth/).
    AuthModule,

    // Motor de permisos Casbin (ver src/rbac/ y ADR-005-rbac-engine.md).
    RbacModule,

    // Endpoint de salud.
    HealthModule,

    // Estructura academica: periodos, cursos, secciones (ver
    // src/modules/academic/ y docs/architecture/06-roadmap.md, Fase 1).
    // Los siguientes modulos de negocio (Evaluaciones, Certificados) se
    // agregaran aqui en los proximos pasos.
    AcademicModule,

    // Contenido de cada curso: modulos, lecciones y recursos (video, PDF,
    // paquetes SCORM, enlaces externos) — ver src/modules/content/.
    ContentModule,

    // Matricula individual (ver src/modules/enrollment/).
    EnrollmentModule,

    // Evaluaciones, calificaciones y notas finales (ver src/modules/gradebook/).
    GradebookModule,

    // Plantillas, emision, revocacion y verificacion publica de
    // certificados (ver src/modules/certificates/).
    CertificatesModule,

    // Alta de instituciones nuevas: formulario publico + aprobacion por un
    // administrador de PLATAFORMA (ver src/modules/tenant-registration/).
    TenantRegistrationModule,

    // Datos del tenant activo (nombre, marca) y su version publica para
    // el home de cada institucion (ver src/modules/tenant/).
    TenantSettingsModule,

    // Panel de administracion: ver miembros del tenant y asignarles/quitarles
    // roles (ver src/modules/user-management/).
    UserManagementModule,
  ],
})
export class AppModule implements NestModule {
  // "configure" es un metodo especial que NestJS llama automaticamente al
  // armar la aplicacion, pensado exactamente para registrar middlewares.
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantContextMiddleware)
      // ".forRoutes('*')" aplica el middleware a TODAS las rutas, sin
      // excepcion: la resolucion de tenant debe pasar siempre primero,
      // incluso para rutas que luego decidan no requerir un tenant (como
      // /health o la futura /verify/:codigo publica).
      .forRoutes('*');
  }
}
