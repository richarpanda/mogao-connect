# Fase 4 — Flujo del asesor: bandeja de solicitudes

## Objetivo
Que un asesor autorizado vea las solicitudes de cita abiertas dentro de su radio de servicio y pueda "tomarlas" — el primero que reclama una solicitud se la queda, y deja de estar disponible para los demás.

Esto es la pieza más delicada del proyecto: es un problema de **concurrencia real**, no solo de UI. Si dos asesores presionan "Tomar cita" casi simultáneamente, la base de datos debe garantizar que solo uno gane — nunca confiar en que el frontend "llegó primero".

## Prerrequisitos
- Fase 1 completa (estatus de autorización del asesor, radio de servicio)
- Fase 3 completa (citas se crean con `agente_id = NULL`)

## Alcance

### Bandeja de solicitudes
- Lista/inbox de `citas` con `agente_id IS NULL`, filtradas por las que caen dentro del radio de servicio del asesor (comparar la ubicación de `propiedades.latitud/longitud` contra el centro + radio del asesor)
- Solo visible/operable si el asesor está **autorizado** (ver Fase 1) — si está "pendiente de autorización", puede ver la bandeja pero no tomar citas (o ni verla, confirmar con Ricardo cuál de las dos)

### Tomar cita (claim atómico)
- La acción "Tomar cita" debe ejecutarse como un `UPDATE citas SET agente_id = <id>, estatus = 'confirmada' WHERE id = <cita_id> AND agente_id IS NULL` y verificar que la fila afectada sea exactamente 1 — si el `UPDATE` afecta 0 filas, significa que otro asesor ya la tomó, y la UI debe reflejar "ya no disponible", no un error genérico
- No implementar esto como "leer, verificar en el cliente, luego escribir" — eso tiene condición de carrera. Debe ser una sola sentencia condicional contra la base de datos

### Gestión de citas tomadas
- Lista de citas que el asesor ya tomó, con su estatus (`estatus_cita`: programada, confirmada, cancelada, realizada)
- Acceso a los procesos de compra asociados una vez que la cita avanza a proceso real

## Fuera de alcance
- Publicar propiedades o requerimientos (Fase 5)
- Mensajería con el comprador (Fase 6)

## Criterios de aceptación
- Prueba de concurrencia real: dos intentos simultáneos de tomar la misma cita, solo uno debe tener éxito — verificar con una prueba automatizada o manual controlada, no solo "a simple vista"
- Un asesor no autorizado no puede tomar citas aunque intente forzar la llamada (verificar con RLS, no solo ocultando el botón en UI)
- La bandeja solo muestra solicitudes dentro del radio configurado del asesor
