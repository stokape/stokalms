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
// - main.ts (src/main.ts) es quien inicia la aplicacion A PARTIR de este
//   modulo (NestFactory.create(AppModule)).
// - ConfigModule lee las variables de entorno a traves de
//   src/config/configuration.ts (que a su vez documenta cada variable en
//   ".env.example", en la raiz del repo).
// - "configure()" (al final del archivo) es donde se activa el middleware
//   de resolucion de tenant (ver src/common/tenant/) para TODAS las rutas.
// ============================================================================

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { TenantDomainModule } from './modules/tenant-domain/tenant-domain.module';
import { PlatformTenantsModule } from './modules/platform-tenants/platform-tenants.module';
import { TenantSettingsModule } from './modules/tenant/tenant-settings.module';
import { UserManagementModule } from './modules/user-management/user-management.module';
import { ProfileModule } from './modules/profile/profile.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { StudentNotesModule } from './modules/student-notes/student-notes.module';
import { AcademicProgressModule } from './modules/academic-progress/academic-progress.module';
import { DomainCheckModule } from './modules/domain-check/domain-check.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportsModule } from './modules/reports/reports.module';
import { CohortModule } from './modules/cohort/cohort.module';
import { MailModule } from './common/mail/mail.module';
import { AutomationsModule } from './modules/automations/automations.module';
import { AuditModule } from './common/audit/audit.module';
import { SecurityModule } from './modules/security/security.module';
import { AiModule } from './common/ai/ai.module';

@Module({
  imports: [
    // ConfigModule.forRoot() con "isGlobal: true" carga las variables de
    // entorno UNA vez al iniciar y las deja disponibles (via ConfigService)
    // en cualquier modulo, sin tener que re-importar ConfigModule cada vez.
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration], // Ver src/config/configuration.ts.
    }),

    // Limite de peticiones por IP (Rate Limiting). Tope GLOBAL: 60 por
    // minuto — cubre el caso general que pide la auditoria de seguridad
    // ("listados de cursos/matriculas/etc. no deben poder saturarse"), sin
    // ser tan bajo como para molestar a alguien navegando la plataforma
    // normalmente. Los pocos endpoints PUBLICOS sin login (registro de
    // institucion, verificacion de certificado) usan un tope mucho mas
    // estricto puesto a mano con @Throttle(...) en su propio controller
    // (ver verify.controller.ts y tenant-registration.controller.ts) — son
    // los unicos que un atacante podria golpear sin siquiera tener una
    // cuenta. Guardado en MEMORIA del propio proceso (no Redis): esta app
    // corre como UN solo proceso Node persistente (ver docker-compose.yml),
    // no como funciones serverless efimeras — no hace falta almacenamiento
    // compartido entre instancias todavia. Si el dia de mañana se escala a
    // varias instancias del API, ThrottlerModule soporta un "storage"
    // (ej. Redis, ya hay un contenedor "stoka-redis" corriendo sin uso
    // asignado todavia) sin cambiar el resto de este archivo.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 60 }]),

    // Habilita "@Cron(...)" en cualquier provider de la app (ver
    // automations.service.ts, "sendTermEndingReminders") — sin registrar
    // esto una vez aca, en el modulo raiz, el decorador no hace nada.
    ScheduleModule.forRoot(),

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

    // "¿este dominio es de verdad de la plataforma?" — lo usa el proxy
    // reverso de produccion antes de emitir un certificado TLS nuevo (ver
    // domain-check.controller.ts y Caddyfile).
    DomainCheckModule,
    AnalyticsModule,

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
    TenantDomainModule,

    // Gestion de CUALQUIER institucion desde el panel de plataforma:
    // activar/desactivar, dominios, miembros y roles (ver
    // src/modules/platform-tenants/). Version "cross-tenant" de
    // TenantDomainModule/UserManagementModule, protegida con
    // PlatformAdminGuard en vez de permisos por tenant.
    PlatformTenantsModule,

    // Datos del tenant activo (nombre, marca) y su version publica para
    // el home de cada institucion (ver src/modules/tenant/).
    TenantSettingsModule,

    // Panel de administracion: ver miembros del tenant y asignarles/quitarles
    // roles (ver src/modules/user-management/).
    UserManagementModule,

    // "Mi perfil": ver datos personales, actualizar solo la foto (ver
    // src/modules/profile/).
    ProfileModule,

    // Asistencia de alumnos por sección (ver src/modules/attendance/).
    AttendanceModule,

    // Anotaciones de desempeño por alumno (ver src/modules/student-notes/).
    StudentNotesModule,

    // "Avance" de un alumno: lecciones vistas, evaluaciones rendidas,
    // asistencia y nota parcial (ver src/modules/academic-progress/).
    AcademicProgressModule,

    // Panel de administracion: numeros agregados sobre datos que ya
    // existen (ver src/modules/dashboard/).
    DashboardModule,

    // Reportes de asistencia, notas y avance de matricula, con
    // exportacion a CSV (ver src/modules/reports/).
    ReportsModule,

    // Cohortes: agrupar alumnos para matricular/reportar en bloque (ver
    // src/modules/cohort/).
    CohortModule,

    // Envio de correo saliente (ver common/mail/) — @Global(), se importa
    // aca por claridad de lectura del arbol de dependencias.
    MailModule,

    // Automatizaciones: emision automatica de certificado + recordatorio
    // de fin de periodo + alertas de inactividad + resumen semanal de
    // alumnos en riesgo (ver src/modules/automations/).
    AutomationsModule,

    // Registro de auditoria (ver common/audit/) — @Global(), se importa
    // aca por claridad de lectura del arbol de dependencias.
    AuditModule,

    // "Seguridad avanzada": exigir 2FA vía Keycloak + consulta/exportacion
    // del registro de auditoria (ver src/modules/security/).
    SecurityModule,

    // Generacion de contenido asistida por IA (banco de preguntas a partir
    // de una lección) — @Global(), apagada por defecto sin AI_API_KEY (ver
    // common/ai/).
    AiModule,
  ],
  providers: [
    // APP_GUARD lo registra como guard GLOBAL (todas las rutas de todos los
    // controllers, sin tener que poner @UseGuards(ThrottlerGuard) en cada
    // uno) — se ejecuta ANTES que JwtAuthGuard/PermissionsGuard de cada
    // ruta, asi que ni siquiera hace falta estar autenticado para que el
    // limite aplique (justamente el caso que importa: alguien SIN cuenta
    // mandando rafagas).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
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
