-- Agrega la columna nickname a user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS nickname text;
