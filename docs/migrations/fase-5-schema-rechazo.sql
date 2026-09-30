-- ============================================================
-- Fase 5 — Complemento: rechazo de propiedad
-- Ejecutar DESPUÉS de fase-5-schema.sql
-- ============================================================

-- 1. Nuevo valor en el enum estatus_propiedad
ALTER TYPE estatus_propiedad ADD VALUE IF NOT EXISTS 'rechazada';

-- 2. Columna motivo_rechazo en propiedades
--    El CRM la llena cuando rechaza una propiedad; la App la muestra al vendedor.
ALTER TABLE propiedades
ADD COLUMN IF NOT EXISTS motivo_rechazo text;
