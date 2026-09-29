# QA — Fase 4
**Bandeja de solicitudes · Tomar cita · Gestión de citas del asesor**

> Ejecuta cada caso en dispositivo real o emulador. Marca el resultado en la columna R.

**Leyenda:** ✅ Pasa · ❌ Falla · ⚠️ Parcial · ➖ No aplica / pendiente

**Última revisión:** —
**Revisado por:** —
**Estado general:** 🔲 Pendiente de QA

---

## ⚠️ Bloqueadores previos al QA

| # | Pendiente | Responsable |
|---|---|---|
| B1 | Función `tomar_cita` creada en Supabase (`fase-4-schema.sql`) | ✅ Aplicado |
| B2 | Política SELECT en `citas` para solicitudes abiertas + `tomar_cita` actualizada (`fase-4-schema-rls.sql`) | ✅ Aplicado |

---

## Fuera de alcance de este QA

> Publicar propiedades o requerimientos → Fase 5

> Mensajería con el comprador → Fase 6

---

## Preparación — Datos de prueba necesarios

| Cuenta | Email | Contraseña | Rol | Notas |
|---|---|---|---|---|
| Asesor autorizado A | qa-agente-a@test.com | Test123456 | agente | `estatus_autorizacion = 'autorizado'`, `radio_lat/lng` configurados |
| Asesor autorizado B | qa-agente-b@test.com | Test123456 | agente | `estatus_autorizacion = 'autorizado'`, mismo radio que A — para pruebas de concurrencia |
| Asesor pendiente | qa-agente-pend@test.com | Test123456 | agente | `estatus_autorizacion = 'pendiente'` |
| Comprador | qa-comprador@test.com | Test123456 | cliente | Con al menos 2 citas abiertas (`agente_id = NULL`) en propiedades dentro del radio de los asesores A y B |

**Citas de prueba a crear en Supabase (insertar directo):**
- 2 citas con `agente_id = NULL`, `estatus = 'programada'`, `propiedad_id` = propiedad con coordenadas dentro del radio de A y B
- 1 cita con `agente_id = NULL` fuera del radio de A (para Bloque 6)

---

## Bloque 1 — Acceso a la bandeja

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 1.1 | Tab muestra "Solicitudes" en modo asesor | Login como asesor → tab inferior central | Label del tab dice "Solicitudes", ícono de calendario | ➖ |
| 1.2 | Tab muestra "Mis procesos" en modo comprador | Mismo usuario con toggle en modo comprador | Label cambia a "Mis procesos", ícono de documento | ➖ |
| 1.3 | Asesor autorizado no ve banner de bloqueo | Login como asesor autorizado → tab Solicitudes | Header "Bandeja", sin aviso amarillo, tabs "Disponibles" / "Mis citas" visibles | ➖ |
| 1.4 | Asesor no autorizado ve banner de bloqueo | Login como asesor pendiente → tab Solicitudes | Banner amarillo con "Bandeja bloqueada" y texto explicativo visible | ➖ |
| 1.5 | Texto del banner es correcto | Ver banner en asesor pendiente | "Podrás ver y tomar solicitudes una vez que tu cuenta sea autorizada por el equipo de Mogao" | ➖ |

---

## Bloque 2 — Solicitudes disponibles

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 2.1 | Lista carga solicitudes abiertas | Login como asesor autorizado → tab Disponibles | Se muestran las citas con `agente_id IS NULL` dentro del radio | ➖ |
| 2.2 | No muestra citas ya tomadas | Cita tomada por otro asesor → revisar lista | La cita tomada no aparece en la bandeja del segundo asesor | ➖ |
| 2.3 | Card muestra propiedad y fecha | Ver cualquier card de solicitud | Título de propiedad, ciudad (con 📍), fecha y hora (con 🗓) visibles | ➖ |
| 2.4 | Card muestra distancia en km | Radio configurado en asesor | Chip de distancia (ej. "3.2 km") visible en la esquina superior derecha del card | ➖ |
| 2.5 | Pull-to-refresh actualiza lista | Bajar desde el tope de la lista | Spinner teal + lista se recarga | ➖ |
| 2.6 | Estado vacío cuando no hay solicitudes | Sin citas abiertas en el radio | Texto "No hay solicitudes disponibles en tu radio de servicio" centrado | ➖ |
| 2.7 | Botón "Tomar cita" deshabilitado para asesor pendiente | Login como asesor pendiente | Botón gris con texto "Cuenta pendiente de autorización", no dispara acción | ➖ |

---

## Bloque 3 — Tomar cita

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 3.1 | Tomar cita exitosa | Asesor autorizado → "Tomar cita" en una solicitud | Alert "¡Listo! Cita tomada. Aparece en 'Mis citas'" | ➖ |
| 3.2 | Cita desaparece de Disponibles | Tras tomar → ver tab Disponibles | La cita ya no figura en la lista | ➖ |
| 3.3 | Cita aparece en Mis citas | Tras tomar → ver tab Mis citas | La cita figura con estatus "Confirmada" | ➖ |
| 3.4 | `citas.agente_id` actualizado en DB | Tras tomar → verificar en Supabase | Columna `agente_id` tiene el UUID del asesor que tomó | ➖ |
| 3.5 | `citas.estatus` cambia a `confirmada` | Tras tomar → verificar en Supabase | Columna `estatus = 'confirmada'` | ➖ |
| 3.6 | `contactos.agente_id` asignado al tomar | Tras tomar → verificar en Supabase | El contacto de la cita tiene `agente_id` del asesor que tomó | ➖ |
| 3.7 | Intentar tomar cita ya tomada | Asesor B toma cita ya tomada por A | Alert "No disponible — Otro asesor ya tomó esta cita." + lista se refresca | ➖ |

---

## Bloque 4 — Concurrencia

> ⚠️ Este bloque requiere dos dispositivos (o un dispositivo y el simulador) con cuentas distintas y coordinación manual para presionar "Tomar cita" casi al mismo tiempo.

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 4.1 | Solo un asesor gana la cita | Asesor A y B en la misma solicitud → presionar "Tomar cita" simultáneamente | Exactamente uno recibe "¡Listo!" y el otro recibe "No disponible" — nunca los dos | ➖ |
| 4.2 | DB refleja un solo ganador | Verificar `citas` en Supabase tras la prueba | La cita tiene el `agente_id` de exactamente uno de los dos asesores | ➖ |
| 4.3 | El perdedor no recibe error genérico | Ver alerta del asesor que perdió | Alert dice "No disponible — Otro asesor ya tomó esta cita.", no "Error inesperado" | ➖ |

---

## Bloque 5 — Mis citas

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 5.1 | Lista citas tomadas | Asesor con citas → tab Mis citas | Todas las citas con `agente_id = asesor.id` visibles | ➖ |
| 5.2 | Badge de estatus con colores correctos | Ver cards en Mis citas | Confirmada = verde, Programada = amarillo, Cancelada = rojo, Realizada = gris | ➖ |
| 5.3 | Nombre del contacto visible | Cita tomada → ver card | Nombre del comprador visible con ícono 👤 | ➖ |
| 5.4 | Teléfono del contacto visible | Cita tomada con teléfono registrado | Teléfono visible con ícono 📞 | ➖ |
| 5.5 | Pull-to-refresh funciona | Bajar desde el tope | Lista se recarga | ➖ |
| 5.6 | Estado vacío sin citas | Asesor sin citas tomadas → tab Mis citas | Texto "No has tomado citas aún" centrado | ➖ |
| 5.7 | Botón "Ver proceso" visible cuando existe | Cita con `proceso_id` no nulo | Botón "Ver proceso" (borde teal) aparece al fondo del card | ➖ |
| 5.8 | Botón "Ver proceso" navega correctamente | Tocar "Ver proceso" | Navega a `proceso/[id]` con el proceso correspondiente | ➖ |
| 5.9 | Sin botón cuando no hay proceso | Cita sin `proceso_id` | El botón no aparece en el card | ➖ |

---

## Bloque 6 — Filtro por radio

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 6.1 | Solo muestra propiedades dentro del radio | Asesor con radio configurado | Solicitud fuera del radio NO aparece en Disponibles | ➖ |
| 6.2 | Muestra todas si radio no está configurado | Asesor con `radio_lat/lng = NULL` | Se muestran todas las solicitudes abiertas sin filtro de distancia | ➖ |
| 6.3 | Propiedades sin coordenadas se excluyen | Cita en propiedad sin `latitud/longitud` y asesor con radio | La solicitud no aparece (no se puede calcular distancia) | ➖ |

---

## Bloque 7 — Seguridad / RLS

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 7.1 | Asesor no autorizado no puede tomar via RPC | Llamar `tomar_cita` directamente con cuenta pendiente (desde Supabase API o herramienta de test) | Función retorna `{ success: false, error: "no_autorizado" }` | ➖ |
| 7.2 | RLS bloquea SELECT de citas a usuarios sin fila en `agentes` | Usuario tipo `cliente` intenta consultar `citas WHERE agente_id IS NULL` | 0 resultados (política no aplica para clientes) | ➖ |

---

## Bugs encontrados

| # | Bloque | Descripción | Severidad | Estado |
|---|---|---|---|---|

> Severidad: 🔴 Crítico (bloquea flujo) · 🟡 Medio (afecta UX) · 🟢 Menor (cosmético)

---

## Notas generales

- Bloque 4 (concurrencia) es el más importante de la fase — documentar el resultado con evidencia (screenshot de las dos alertas simultáneas si es posible)
- Caso 6.3 puede requerir crear manualmente una propiedad sin coordenadas en Supabase
- Caso 7.1 puede ejecutarse desde el SQL Editor de Supabase usando `SET request.jwt.claims = '...'` para simular un usuario pendiente, o desde Postman con el JWT de esa cuenta
