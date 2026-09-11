-- "termId" pasa a ser opcional: exigir un periodo academico antes de poder
-- crear el primer curso bloqueaba a cualquier institucion nueva sin ninguno
-- todavia creado (ver create-course.dto.ts). La llave foranea sigue igual
-- (ON DELETE RESTRICT) -- un valor NULL simplemente queda exento de esa
-- restriccion, no hace falta recrearla.
ALTER TABLE "courses" ALTER COLUMN "term_id" DROP NOT NULL;
