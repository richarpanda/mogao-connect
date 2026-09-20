# Fase 3 — Flujo del comprador

## Objetivo
Que un comprador pueda solicitar conocer una propiedad y dar seguimiento en tiempo real a su proceso de compra.

## Prerrequisitos de esquema
- **`citas.agente_id` debe ya ser nullable.** Esta fase crea citas sin agente asignado (la solicitud nace abierta, un asesor la toma después en Fase 4). Si la columna sigue siendo NOT NULL, esta fase no se puede construir — confirmar con Ricardo antes de empezar.

## Alcance

### Solicitar visita
- Desde la ficha de una propiedad, el comprador solicita una cita/visita
- Se crea una fila en `citas` con `agente_id = NULL`, `contacto_id` del comprador, `propiedad_id`, `tipo = 'visita'`, `estatus` inicial (confirmar valor a usar entre `programada` u otro — revisar con Ricardo si aplica un estatus distinto para "sin asesor asignado aún" o si se maneja con `agente_id IS NULL` como única señal)
- El comprador debe tener una fila en `contactos` asociada a su `usuario_id` — si no la tiene (primera solicitud), crearla en este flujo

### Portal de seguimiento
- Vista del `procesos_compra` del comprador (`contacto_id = current_contacto_id()`, política RLS ya existe)
- Mostrar el estatus real del stepper de **10 pasos**: interesado, apartado, en_tramite, documentacion, firma, cerrado, firma_cv, integracion, firma_notaria, entregado — no simplificar a menos pasos
- Mostrar historial (`proceso_historial`) y documentos compartidos por su agente (`proceso_documentos`, política de solo lectura para el cliente ya existe)

### Notificaciones de avance
- En esta fase solo el estado in-app (badge/pantalla actualizada); la integración de push real es Fase 7

## Fuera de alcance
- Tomar/asignar la cita (eso lo hace el asesor, Fase 4)
- Publicar propiedades

## Criterios de aceptación
- Un comprador nuevo puede solicitar una visita sin fricción (se crea su `contacto` automáticamente si no existía)
- El stepper del proceso de compra muestra exactamente los 10 estatus reales, en el orden correcto, sin inventar nombres ni combinarlos
- El comprador solo ve sus propios procesos y citas (verificar aislamiento con RLS, no solo con filtros de frontend)
