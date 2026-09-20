-- ============================================================
-- FASE 3 / FASE 4 — Cambios de esquema requeridos
-- Ejecutar en Supabase ANTES de probar el flujo del comprador.
-- ============================================================

-- 1. Hacer nullable citas.agente_id
--    Requerido: las solicitudes de cita nacen sin asesor asignado.
--    El asesor las toma después (Fase 4).
ALTER TABLE citas ALTER COLUMN agente_id DROP NOT NULL;

-- 2. Hacer nullable contactos.agente_id
--    Requerido: un comprador que se registra solo (sin asesor asignado)
--    necesita una fila en contactos para poder crear citas.
ALTER TABLE contactos ALTER COLUMN agente_id DROP NOT NULL;

-- 3. Agregar valor 'pendiente_verificacion' al enum estatus_propiedad
--    Requerido para Fase 5 (vendedores publicando propiedades),
--    pero se incluye aquí para que el catálogo público no muestre
--    propiedades no verificadas cuando esa fase esté activa.
ALTER TYPE estatus_propiedad ADD VALUE IF NOT EXISTS 'pendiente_verificacion';
