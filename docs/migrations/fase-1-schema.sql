-- ============================================================
-- FASE 1 — Cambios de esquema requeridos
-- Ejecutar en orden en el editor SQL de Supabase.
-- Revisar cada bloque antes de correr. No ejecutar de forma autónoma.
-- ============================================================

-- 1. Agregar valor 'vendedor' al enum rol_usuario
ALTER TYPE rol_usuario ADD VALUE IF NOT EXISTS 'vendedor';


-- 2. Agregar columnas de autorización y origen a agentes
--    (faltaban — solo existía 'activo')
ALTER TABLE agentes
  ADD COLUMN IF NOT EXISTS estatus_autorizacion text NOT NULL DEFAULT 'pendiente'
    CHECK (estatus_autorizacion IN ('pendiente', 'autorizado', 'rechazado')),
  ADD COLUMN IF NOT EXISTS motivo_rechazo text,
  ADD COLUMN IF NOT EXISTS origen text NOT NULL DEFAULT 'app'
    CHECK (origen IN ('app', 'crm'));

-- Marcar agentes ya existentes (creados desde CRM) como autorizados
UPDATE agentes SET estatus_autorizacion = 'autorizado', origen = 'crm';


-- 3. Nueva tabla: vendedores con cuenta propia en la App
--    (distinta de la tabla 'vendedores' del CRM que no tiene usuario_id)
CREATE TABLE IF NOT EXISTS vendedores_cuenta (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id            uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  activo                boolean NOT NULL DEFAULT true,
  estatus_autorizacion  text NOT NULL DEFAULT 'pendiente'
    CHECK (estatus_autorizacion IN ('pendiente', 'autorizado', 'rechazado')),
  motivo_rechazo        text,
  origen                text NOT NULL DEFAULT 'app'
    CHECK (origen IN ('app', 'crm')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vendedores_cuenta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all"  ON vendedores_cuenta FOR ALL     USING (current_rol() = 'admin');
CREATE POLICY "own_select" ON vendedores_cuenta FOR SELECT  USING (usuario_id = auth.uid());
CREATE POLICY "own_insert" ON vendedores_cuenta FOR INSERT  WITH CHECK (usuario_id = auth.uid());


-- 4. Nueva tabla: documentos KYC ligados a usuario_id (no a un rol)
CREATE TABLE IF NOT EXISTS kyc_documentos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo        text NOT NULL,
  -- Valores esperados: 'ine_frente', 'ine_reverso', 'pasaporte', 'selfie',
  --                    'constancia_fiscal', 'acta_nacimiento'
  url         text NOT NULL,
  estatus     text NOT NULL DEFAULT 'pendiente'
    CHECK (estatus IN ('pendiente', 'aprobado', 'rechazado')),
  notas       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE kyc_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all"  ON kyc_documentos FOR ALL    USING (current_rol() = 'admin');
CREATE POLICY "own_all"    ON kyc_documentos FOR ALL    USING (usuario_id = auth.uid());


-- 5. Trigger: crear fila en 'usuarios' automáticamente al registrarse vía Supabase Auth
--    El nombre viene de raw_user_meta_data (se pasa en signUp options.data)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuarios (id, nombre, email, rol)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(
        COALESCE(NEW.raw_user_meta_data->>'nombre', '') ||
        CASE WHEN NEW.raw_user_meta_data->>'apellido' IS NOT NULL
             THEN ' ' || (NEW.raw_user_meta_data->>'apellido')
             ELSE '' END
      ), ''),
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    'cliente'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
