-- ============================================================
-- Fase 5 — Flujo vendedor + tabla requerimientos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Nueva columna en propiedades: asocia una propiedad a un vendedor con cuenta App
ALTER TABLE propiedades
ADD COLUMN IF NOT EXISTS vendedor_cuenta_id uuid REFERENCES vendedores_cuenta(id);

-- ============================================================
-- 2. Tabla requerimientos (nueva)
-- ============================================================
CREATE TABLE IF NOT EXISTS requerimientos (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  asesor_id         uuid        NOT NULL REFERENCES agentes(id) ON DELETE CASCADE,
  tipo_operacion    text        NOT NULL CHECK (tipo_operacion IN ('compra', 'renta')),
  tipo_propiedad_id uuid        REFERENCES tipos_propiedad(id),
  precio_min        numeric,
  precio_max        numeric,
  zona              text,
  notas             text,
  activo            boolean     NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE requerimientos ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede ver requerimientos activos
CREATE POLICY "requerimientos_select_authenticated"
ON requerimientos FOR SELECT
TO authenticated
USING (activo = true);

-- Solo el asesor dueño puede crear
CREATE POLICY "requerimientos_insert_own"
ON requerimientos FOR INSERT
TO authenticated
WITH CHECK (
  asesor_id = (SELECT id FROM agentes WHERE usuario_id = auth.uid())
);

-- Solo el asesor dueño puede editar
CREATE POLICY "requerimientos_update_own"
ON requerimientos FOR UPDATE
TO authenticated
USING  (asesor_id = (SELECT id FROM agentes WHERE usuario_id = auth.uid()))
WITH CHECK (asesor_id = (SELECT id FROM agentes WHERE usuario_id = auth.uid()));

-- Solo el asesor dueño puede desactivar/borrar
CREATE POLICY "requerimientos_delete_own"
ON requerimientos FOR DELETE
TO authenticated
USING (asesor_id = (SELECT id FROM agentes WHERE usuario_id = auth.uid()));

-- ============================================================
-- 3. RLS propiedades — vendedor con cuenta App
-- ============================================================

-- Vendedor puede publicar propiedades propias
CREATE POLICY "vendedor_cuenta_insert_propiedad"
ON propiedades FOR INSERT
TO authenticated
WITH CHECK (
  vendedor_cuenta_id = (SELECT id FROM vendedores_cuenta WHERE usuario_id = auth.uid())
);

-- Vendedor puede leer sus propias propiedades (incluyendo pendiente_verificacion)
CREATE POLICY "vendedor_cuenta_select_propiedad"
ON propiedades FOR SELECT
TO authenticated
USING (
  vendedor_cuenta_id = (SELECT id FROM vendedores_cuenta WHERE usuario_id = auth.uid())
);

-- ============================================================
-- 4. RLS citas — vendedor puede leer citas de sus propiedades
--    (solo para conteo de visitas; no expone datos del contacto)
-- ============================================================
CREATE POLICY "vendedor_cuenta_select_citas_propiedad"
ON citas FOR SELECT
TO authenticated
USING (
  propiedad_id IN (
    SELECT id FROM propiedades
    WHERE vendedor_cuenta_id = (SELECT id FROM vendedores_cuenta WHERE usuario_id = auth.uid())
  )
);
