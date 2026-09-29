-- ============================================================
-- Fase 4 — RLS adicional + función tomar_cita actualizada
-- Ejecutar DESPUÉS de fase-4-schema.sql
-- ============================================================

-- 1. Política SELECT: asesores pueden ver solicitudes abiertas (agente_id IS NULL)
--    Sin esto, la bandeja de disponibles siempre estaría vacía porque la
--    política existente solo cubre citas donde agente_id = current_agente_id().
CREATE POLICY "agentes_select_citas_abiertas"
ON citas FOR SELECT
TO authenticated
USING (
  agente_id IS NULL
  AND EXISTS (SELECT 1 FROM agentes WHERE usuario_id = auth.uid())
);

-- 2. Función tomar_cita actualizada (reemplaza la versión anterior).
--    Agrega: al tomar la cita, asigna también el contacto al asesor si aún
--    no tiene asesor asignado. Esto cumple la política de contactos existente
--    ("agente dueño del contacto") y permite que el asesor lea los datos del
--    comprador en "Mis citas" inmediatamente después de tomar la solicitud.
CREATE OR REPLACE FUNCTION tomar_cita(p_cita_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_agente_id   uuid;
  v_contacto_id uuid;
  v_rows_affected integer;
BEGIN
  -- Verificar que el usuario actual tiene una cuenta de asesor autorizada
  SELECT id INTO v_agente_id
  FROM agentes
  WHERE usuario_id = auth.uid()
    AND estatus_autorizacion = 'autorizado'
    AND activo = true;

  IF v_agente_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'no_autorizado');
  END IF;

  -- Obtener el contacto_id antes de hacer el UPDATE
  SELECT contacto_id INTO v_contacto_id
  FROM citas
  WHERE id = p_cita_id AND agente_id IS NULL;

  -- Tomar la cita de forma atómica
  UPDATE citas
  SET
    agente_id  = v_agente_id,
    estatus    = 'confirmada',
    updated_at = now()
  WHERE id        = p_cita_id
    AND agente_id IS NULL;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  IF v_rows_affected = 0 THEN
    RETURN json_build_object('success', false, 'error', 'ya_tomada');
  END IF;

  -- Asignar el contacto al asesor (solo si aún no tiene asesor asignado).
  -- Esto permite que el asesor lea los datos del comprador en "Mis citas".
  UPDATE contactos
  SET
    agente_id  = v_agente_id,
    updated_at = now()
  WHERE id       = v_contacto_id
    AND agente_id IS NULL;

  RETURN json_build_object('success', true);
END;
$$;
