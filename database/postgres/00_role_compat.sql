-- =================================================================
-- Ejecutado ANTES que el schema de Pagila  (por orden alfabetico).
-- Garantiza que el rol 'postgres' exista si se usa un usuario
-- Sin este script (o sin PG_USER=postgres), el contenedor va a fallar.
-- =================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres'
  ) THEN
    CREATE ROLE postgres SUPERUSER LOGIN PASSWORD 'postgres';
    RAISE NOTICE '[BD Pagila] Rol postgres creado para Pagila schema.';
  ELSE
    RAISE NOTICE '[BD Pagila] Rol postgres ya existe, sin cambios.';
  END IF;
END
$$;