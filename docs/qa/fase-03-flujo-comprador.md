# QA — Fase 3
**Flujo del comprador — solicitud de visita y portal de seguimiento**

> Ejecuta cada caso en dispositivo real o emulador. Marca el resultado en la columna R.

**Leyenda:** ✅ Pasa · ❌ Falla · ⚠️ Parcial · ➖ No aplica / pendiente

**Última revisión:** —
**Revisado por:** —
**Estado general:** 🔲 Lista para QA

---

## Fuera de alcance de este QA

- Asignación/toma de cita por asesor (Fase 4)
- Publicación de propiedades
- Notificaciones push reales (Fase 7)

---

## Preparación — Datos de prueba necesarios

| Cuenta | Email | Contraseña | Rol | Notas |
|---|---|---|---|---|
| Comprador A | — | — | cliente | Sin fila previa en `contactos` |
| Comprador B | — | — | cliente | Con fila previa en `contactos` y al menos 1 cita |
| Comprador C | — | — | cliente | Con al menos 1 fila en `procesos_compra` (cualquier estatus) |

> **Propiedad X:** `estatus = 'disponible'`, visible en catálogo — usada para solicitar visitas.
>
> **Proceso P:** fila en `procesos_compra` con `contacto_id` = contacto de Comprador C, con al menos 1 entrada en `proceso_historial` y 1 en `proceso_documentos`.

---

## Bloque 9 — Solicitar visita

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 9.1 | Comprador sin contacto previo crea solicitud | Login como Comprador A → catálogo → Propiedad X → "Solicitar visita" → ingresar fecha futura y hora válidas → Enviar | Alerta "¡Solicitud enviada!", se crea fila en `contactos` y en `citas` con `agente_id = NULL` | |
| 9.2 | Comprador con contacto existente no duplica contacto | Login como Comprador B → solicitar visita en Propiedad X → Enviar | Solo se crea 1 nueva cita; la fila de `contactos` no se duplica | |
| 9.3 | Fecha y hora son requeridos | Dejar fecha vacía → Enviar | Alerta "Campos requeridos" | |
| 9.4 | Formato de fecha inválido | Escribir "abc" en fecha → Enviar | Alerta "Formato inválido" con instrucción de formato correcto | |
| 9.5 | Fecha en el pasado rechazada | Ingresar fecha anterior a hoy → Enviar | Alerta "Fecha inválida — la visita debe ser en una fecha futura" | |
| 9.6 | Notas son opcionales | Enviar sin llenar notas | Cita creada correctamente, campo `notas` = NULL | |
| 9.7 | Notas se guardan si se ingresan | Ingresar texto en notas → Enviar | Cita creada con el texto en `notas` | |
| 9.8 | Botón deshabilitado durante envío | Tocar "Enviar solicitud" | Botón muestra "Enviando..." y no responde a taps adicionales | |
| 9.9 | Redirección tras éxito | Solicitud exitosa | Navega a `/(tabs)/solicitudes` y la nueva cita aparece en el tab "Visitas" | |
| 9.10 | Botón volver | Tocar flecha de regreso | Regresa a la ficha de la propiedad | |

---

## Bloque 10 — Listado de solicitudes (tab Visitas)

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 10.1 | Tab "Visitas" muestra citas del comprador | Login como Comprador B → tab "Mis solicitudes" | Lista de citas con nombre de propiedad, ciudad, fecha/hora y badge de estatus | |
| 10.2 | Badge "Programada" en amarillo | Cita con `estatus = 'programada'` | Badge amarillo con texto "Programada" | |
| 10.3 | Badge "Confirmada" en verde | Cita con `estatus = 'confirmada'` | Badge verde con texto "Confirmada" | |
| 10.4 | Badge "Cancelada" en rojo | Cita con `estatus = 'cancelada'` | Badge rojo con texto "Cancelada" | |
| 10.5 | Badge "Realizada" en gris | Cita con `estatus = 'realizada'` | Badge gris con texto "Realizada" | |
| 10.6 | Notas visibles en la tarjeta | Cita con notas → ver lista | Notas truncadas (máx 2 líneas) visibles en la tarjeta | |
| 10.7 | Estado vacío sin citas | Login como Comprador A antes de solicitar cualquier visita | Mensaje "No tienes visitas solicitadas" + botón "Ver catálogo" | |
| 10.8 | Botón "Ver catálogo" navega correctamente | Tocar "Ver catálogo" en estado vacío | Navega a `/(tabs)` (catálogo de propiedades) | |
| 10.9 | Pull to refresh actualiza lista | Solicitar visita en otra sesión → pull-down en tab Visitas | Lista se recarga con la nueva cita | |

---

## Bloque 11 — Listado de procesos (tab Procesos)

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 11.1 | Tab "Procesos" muestra procesos del comprador | Login como Comprador C → tab "Mis solicitudes" → pestaña "Procesos" | Lista de procesos con nombre de propiedad, ciudad, barra de progreso y estatus | |
| 11.2 | Barra de progreso proporcional | Proceso en paso 5 de 10 | Barra dorada al 50% | |
| 11.3 | Contador de pasos correcto | Ver tarjeta de proceso | Texto "X / 10" con el número del paso actual | |
| 11.4 | Estado vacío sin procesos | Comprador sin procesos → pestaña "Procesos" | Mensaje "Sin procesos activos" | |
| 11.5 | Tap en tarjeta navega al detalle | Tocar tarjeta de proceso | Navega a `proceso/[id]` con el detalle correcto | |
| 11.6 | Pull to refresh actualiza lista | Pull-down en pestaña Procesos | Lista se recarga | |

---

## Bloque 12 — Portal de seguimiento (stepper de 10 pasos)

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 12.1 | Stepper muestra exactamente 10 pasos | Abrir `proceso/[id]` | 10 filas en el stepper: Interesado, Apartado, En trámite, Documentación, Firma, Cerrado, Firma CV, Integración, Firma notaría, Entregado | |
| 12.2 | Orden de los pasos correcto | Ver stepper | Los pasos aparecen en el orden exacto del enum `estatus_proceso` | |
| 12.3 | Paso actual resaltado en dorado | Proceso en cualquier estatus | El círculo del paso actual es dorado (`bg-mogao-gold`), número en blanco | |
| 12.4 | Pasos completados en verde con checkmark | Proceso avanzado | Círculos anteriores al actual en verde con ícono ✓ | |
| 12.5 | Pasos futuros en gris | Ver pasos después del actual | Círculos y texto en gris | |
| 12.6 | Descripción visible en paso actual | Ver paso actual | Texto de descripción visible bajo el label del paso actual | |
| 12.7 | Descripción visible en pasos completados | Pasos anteriores al actual | Texto de descripción visible (no ocultado) | |
| 12.8 | Descripción oculta en pasos futuros | Pasos posteriores al actual | Sin texto de descripción bajo el label | |
| 12.9 | Precio acordado en dorado | Proceso con `precio_acordado` | Precio visible en color dorado (`text-mogao-gold`) en el resumen superior | |
| 12.10 | Sin precio: sección precio oculta | Proceso sin `precio_acordado` | No aparece precio en blanco ni placeholder | |
| 12.11 | Fecha de inicio visible | Ver resumen | "Inicio: DD/MM/AAAA" visible | |
| 12.12 | Fecha de cierre solo si existe | Proceso sin `fecha_cierre` | No aparece "Cierre:" | |
| 12.13 | Documentos del asesor visibles | Proceso P con documentos | Sección "Documentos" con nombre de archivo y tipo de cada documento | |
| 12.14 | Sin documentos: sección oculta | Proceso sin `proceso_documentos` | Sección "Documentos" no aparece | |
| 12.15 | Historial de cambios visible | Proceso P con historial | Sección "Historial" con estatus anterior → nuevo, comentario y fecha | |
| 12.16 | Sin historial: sección oculta | Proceso sin `proceso_historial` | Sección "Historial" no aparece | |
| 12.17 | Botón volver | Tocar flecha de regreso | Regresa al tab "Mis solicitudes" | |
| 12.18 | Error de carga | Navegar a ID de proceso inexistente | Alerta "No se pudo cargar el proceso" y regresa a pantalla anterior | |

---

## Bloque 13 — Aislamiento por RLS

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 13.1 | Comprador no ve citas de otro comprador | Login como Comprador A → tab Visitas | Solo aparecen las citas de Comprador A, no las de Comprador B | |
| 13.2 | Comprador no ve procesos de otro comprador | Login como Comprador A → tab Procesos | Solo aparecen los procesos de Comprador A, no los de Comprador C | |
| 13.3 | Acceso directo a proceso ajeno bloqueado | Navegar manualmente a `proceso/[id_de_proceso_ajeno]` | Alerta de error y regresa (RLS rechaza el query) | |

---

## Bugs encontrados

| # | Bloque | Descripción | Severidad | Estado |
|---|---|---|---|---|
| — | — | — | — | — |

> Severidad: 🔴 Crítico (bloquea flujo) · 🟡 Medio (afecta UX) · 🟢 Menor (cosmético)

---

## Notas generales

- Los casos de aislamiento (Bloque 13) requieren al menos dos cuentas de prueba con datos distintos.
- La sección de documentos del proceso (`proceso_documentos`) requiere que un asesor haya subido archivos desde el CRM — crear datos de prueba directamente en Supabase si no hay flujo de asesor disponible aún.
- Las notificaciones push reales se verifican en Fase 7; aquí solo se valida que el estado in-app (badge/lista) se actualiza correctamente.
