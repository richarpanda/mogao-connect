-- ============================================================
-- Fase 4 — Flujo del asesor: bandeja de solicitudes
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Función atómica para que un asesor tome una cita.
-- Garantiza que solo un asesor puede tomar cada cita:
--   - Verifica autorización del asesor en DB (no solo en UI)
--   - El UPDATE solo afecta la fila si agente_id sigue siendo NULL
--   - Retorna { success: true } o { success: false, error: "ya_tomada" | "no_autorizado" }

CREATE OR REPLACE FUNCTION tomar_cita(p_cita_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_agente_id uuid;
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

  -- Tomar la cita de forma atómica.
  -- Si otro asesor ya la tomó, agente_id ya no será NULL y el UPDATE afectará 0 filas.
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

  RETURN json_build_object('success', true);
END;
$$;
