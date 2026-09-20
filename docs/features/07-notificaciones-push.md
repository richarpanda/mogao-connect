# Fase 7 — Notificaciones push

## Objetivo
Notificar en tiempo real los eventos clave ya construidos en fases anteriores, usando Expo Notifications.

## Prerrequisitos
- Fases 3, 4 y 5 completas (son las que generan los eventos a notificar)
- **No existe todavía una tabla para guardar los push tokens de cada usuario/dispositivo.** Proponer una (ej. `push_tokens` con `usuario_id`, `token`, `plataforma`) antes de construir esta fase.

## Alcance
- Solicitar permiso de notificaciones al usuario (nunca de forma agresiva al abrir la app por primera vez — pedirlo en el momento en que tiene sentido, ej. tras completar el registro)
- Registrar el push token del dispositivo contra el `usuario_id`
- Eventos a notificar (confirmar con Ricardo si falta alguno o sobra):
  - Cita tomada por un asesor (al comprador)
  - Verificación de identidad aprobada/rechazada (al asesor/vendedor)
  - Verificación de propiedad aprobada/rechazada (al vendedor)
  - Cambio de estatus en el proceso de compra (al comprador)
  - Nueva solicitud disponible en su radio de servicio (al asesor, si está autorizado)

## Fuera de alcance
- Notificaciones de marketing/promocionales (no definido, no construir sin pedido explícito)

## Criterios de aceptación
- El token se actualiza correctamente si el usuario reinstala la app o cambia de dispositivo (no debe quedar duplicado ni apuntando a un token muerto)
- Cada notificación al tocarla lleva a la pantalla relevante del evento (deep linking), no solo abre la app en la pantalla de inicio
