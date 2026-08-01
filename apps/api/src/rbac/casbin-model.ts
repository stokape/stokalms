// ============================================================================
// casbin-model.ts — La "gramatica" de reglas que usa el motor de permisos.
//
// Este texto es exactamente el "model.conf" documentado en
// docs/architecture/03-rbac.md, seccion 3.4 ("Motor de evaluacion: Casbin
// con modelo RBAC + dominios") y en docs/architecture/adr/ADR-005-rbac-engine.md.
// Traducido a lenguaje simple, define 4 conceptos:
//
//   r (request):  "¿puede el usuario X, en el dominio Y, hacer la accion Z
//                  sobre el recurso W?" — esto es lo que se pregunta en
//                  tiempo real (ver casbin.service.ts, metodo "can").
//   p (policy):   "el rol X tiene permiso para hacer Z sobre W" — sale de
//                  las tablas ROLE_PERMISSIONS (ver schema.prisma).
//   g (grouping): "el usuario X tiene el rol Y, en el dominio Z" — sale de
//                  la tabla USER_ROLES.
//   m (matcher):  la formula que combina todo lo anterior para decidir
//                  ALLOW o DENY.
//
// QUE ES EL "DOMINIO" (dom) AQUI: en nuestro modelo de datos, un permiso
// (RolePermission) esta fijo por rol, SIN variar segun el tenant o curso —
// lo que SI varia por dominio es DONDE esta asignado ese rol a una persona
// (ver UserRole.scopeCourseId en schema.prisma: null = todo el tenant,
// con valor = un curso especifico). Por eso las politicas "p" siempre usan
// el dominio comodin "*" (el permiso de un rol aplica en cualquier dominio
// donde ese rol este asignado), mientras que las relaciones "g" SI usan el
// dominio real ("tenant:<id>" o "course:<id>") — ver casbin.service.ts.
// ============================================================================

export const CASBIN_MODEL_TEXT = `
[request_definition]
r = sub, dom, obj, act

[policy_definition]
p = sub, dom, obj, act

[role_definition]
g = _, _, _

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = g(r.sub, p.sub, r.dom) && (p.dom == "*" || r.dom == p.dom) && r.obj == p.obj && r.act == p.act
`;
