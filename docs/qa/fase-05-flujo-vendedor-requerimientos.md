# QA — Fase 5
**Flujo del vendedor · Alta de propiedad · Tablero de Requerimientos**

> Ejecuta cada caso en dispositivo real o emulador. Marca el resultado en la columna R.

**Leyenda:** ✅ Pasa · ❌ Falla · ⚠️ Parcial · ➖ No aplica / pendiente

**Última revisión:** —
**Revisado por:** —
**Estado general:** 🔲 Pendiente de QA

---

## ⚠️ Requisitos previos — ejecutar ANTES del QA

| # | Acción | Responsable | Estado |
|---|---|---|---|
| B1 | Correr `docs/migrations/fase-5-schema.sql` en el SQL Editor de Supabase | Ricardo | 🔲 |
| B2 | Correr `docs/migrations/fase-5-schema-rechazo.sql` (enum `rechazada` + columna `motivo_rechazo`) | Ricardo | 🔲 |
| B3 | Verificar que la columna `propiedades.vendedor_cuenta_id` existe en Supabase | Ricardo | 🔲 |
| B4 | Verificar que la tabla `requerimientos` existe con RLS activo | Ricardo | 🔲 |

> **Nota sobre fotos y documentos:** La carga de fotos y documentos de propiedad está marcada como "Próximamente" en la pantalla de alta. Activarla requiere instalar `expo-image-picker` y `expo-document-picker` (`npx expo install expo-image-picker expo-document-picker`) y realizar un rebuild del dev client (`eas build --profile development`). Esos casos de QA quedan en ➖ hasta que se implemente en Fase 5.1.

---

## Fuera de alcance de este QA

> Verificación/aprobación de propiedades por el admin → CRM (no esta app)
> Matching automático inteligente entre requerimientos y propiedades → mejora futura
> Carga de fotos y documentos de propiedad → Fase 5.1 (requiere expo-image-picker)
> Motivo de rechazo específico de propiedad → `propiedades` no tiene columna `motivo_rechazo`; pendiente de agregar en schema cuando el CRM implemente el rechazo de propiedades
> Toggle vendedor ↔ comprador para usuarios con ambos roles → Fase 5.1

---

## Preparación — Datos de prueba

| Cuenta | Email | Contraseña | Rol | Notas |
|---|---|---|---|---|
| Vendedor verificado | qa-vendedor-a@test.com | Test123456 | vendedor | `estatus_autorizacion = 'autorizado'` en `vendedores_cuenta` |
| Vendedor pendiente | qa-vendedor-pend@test.com | Test123456 | vendedor | `estatus_autorizacion = 'pendiente'` en `vendedores_cuenta` |
| Asesor autorizado A | qa-agente-a@test.com | Test123456 | agente | `estatus_autorizacion = 'autorizado'` |
| Asesor autorizado B | qa-agente-b@test.com | Test123456 | agente | Para pruebas de edición de requerimientos de otro asesor |
| Comprador | qa-comprador@test.com | Test123456 | cliente | Para verificar que catálogo excluye propiedades pendientes |

**Requerimientos previos en Supabase:**
- Al menos 1 propiedad con `estatus = 'disponible'`, `tipo_id` y `ciudad` definidos (para verificar conteo de coincidencias en requerimientos)
- Al menos 1 cita con `tipo = 'visita'` apuntando a una propiedad del vendedor A (para Bloque 4)

---

## Bloque 1 — Acceso al modo vendedor

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 1.1 | Tab central muestra "Propiedades" en modo vendedor | Login como vendedor → tab central | Label "Propiedades", ícono de casa | ➖ |
| 1.2 | Tab "Requerimientos" no visible para vendedor | Login como vendedor | Solo 3 tabs visibles: Catálogo, Propiedades, Perfil — sin "Requerimientos" | ➖ |
| 1.3 | Tab "Requerimientos" visible para asesor | Login como asesor | 4 tabs visibles: Catálogo, Solicitudes, Requerimientos, Perfil | ➖ |
| 1.4 | Tab "Requerimientos" no visible para comprador | Login como comprador | Solo 3 tabs visibles: Catálogo, Mis procesos, Perfil | ➖ |
| 1.5 | Vendedor pendiente ve banner de bloqueo | Login como vendedor pendiente → tab Propiedades | Banner amarillo "Cuenta pendiente — Podrás publicar propiedades una vez que tu cuenta sea verificada por Mogao" | ➖ |
| 1.6 | Vendedor autorizado NO ve banner | Login como vendedor autorizado | Sin banner, botón "Publicar" visible en el header | ➖ |

---

## Bloque 2 — Alta de propiedad

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 2.1 | Acceso al formulario | Vendedor autorizado → botón "Publicar" o "Publicar primera propiedad" | Navega a pantalla "Publicar propiedad" con formulario completo | ➖ |
| 2.2 | Validación de título requerido | Intentar enviar sin título | Alert "Campo requerido — Ingresa un título para la propiedad" | ➖ |
| 2.3 | Validación de precio requerido | Título relleno, precio vacío → enviar | Alert "Campo requerido — Ingresa un precio válido" | ➖ |
| 2.4 | Picker de tipo de propiedad funciona | Tocar campo "Tipo de propiedad" | Se abre sheet con lista de tipos; al seleccionar, se refleja en el campo | ➖ |
| 2.5 | Alta exitosa | Llenar todos los campos → "Publicar propiedad" | Alert "¡Propiedad publicada! — Tu propiedad fue enviada..." + regresa a "Mis propiedades" | ➖ |
| 2.6 | Propiedad aparece en "Mis propiedades" | Tras alta exitosa → tab Propiedades | Card con la nueva propiedad visible | ➖ |
| 2.7 | `estatus` de la propiedad en DB es `pendiente_verificacion` | Verificar en Supabase | Columna `estatus = 'pendiente_verificacion'` | ➖ |
| 2.8 | `vendedor_cuenta_id` asignado | Verificar en Supabase | Columna `vendedor_cuenta_id` apunta al UUID del vendedor que publicó | ➖ |
| 2.9 | Botón "Publicar" deshabilitado para vendedor pendiente | Login como vendedor pendiente → tab Propiedades | Botón "Publicar" no visible; solo el banner de cuenta pendiente | ➖ |

---

## Bloque 3 — Estatus de verificación

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 3.1 | Badge "Pendiente de verificación" en amarillo | Propiedad recién creada en lista | Badge amarillo con texto "Pendiente de verificación" visible en el card | ➖ |
| 3.2 | Badge "Disponible" en verde | Cambiar `estatus = 'disponible'` desde Supabase → pull-to-refresh en app | Badge verde "Disponible" visible | ➖ |
| 3.3 | Badge "Vendida" en gris | Cambiar `estatus = 'vendida'` desde Supabase → pull-to-refresh | Badge gris "Vendida" visible | ➖ |
| 3.4 | Pull-to-refresh actualiza estatus | Bajar desde el tope de la lista | Spinner teal + lista se recarga con el estatus actualizado | ➖ |
| 3.5 | Badge "Rechazada" en rojo | Cambiar `estatus = 'rechazada'` desde Supabase → esperar sin refrescar | Badge rojo "Rechazada" aparece automáticamente vía Realtime | ➖ |
| 3.6 | Motivo de rechazo visible | Cambiar `estatus = 'rechazada'` + llenar `motivo_rechazo` en Supabase | Caja roja con el texto del motivo visible debajo del card | ➖ |
| 3.7 | Realtime actualiza estatus sin pull-to-refresh | Cambiar `estatus` de una propiedad desde Supabase → no tocar la app | El badge en el card se actualiza automáticamente en ≤3 s | ➖ |
| 3.8 | Selector de modo muestra opciones según roles | Usuario con vendedorCuenta + contacto → tab Perfil | Sección "Modo activo" visible con botones "Vendedor" y "Comprador" | ➖ |
| 3.9 | Cambio de modo vendedor → comprador | Tocar botón "Comprador" en selector de modo | Tab central cambia a "Mis procesos", tab Requerimientos desaparece | ➖ |
| 3.10 | Cambio de modo comprador → vendedor | Tocar botón "Vendedor" | Tab central vuelve a "Propiedades" | ➖ |

---

## Bloque 4 — Interés generado (conteo de visitas)

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 4.1 | Conteo de visitas visible en card | Propiedad con citas de tipo `visita` | Texto "X visitas solicitadas" con ícono de ojo visible en el card | ➖ |
| 4.2 | Conteo cero cuando no hay visitas | Propiedad sin citas | Texto "0 visitas solicitadas" | ➖ |
| 4.3 | Singular correcto | Propiedad con exactamente 1 visita | Texto "1 visita solicitada" (no "1 visitas") | ➖ |
| 4.4 | Datos del comprador NO visibles | Ver cards del vendedor | No aparece nombre, teléfono ni email del comprador en ningún card | ➖ |

---

## Bloque 5 — Catálogo excluye propiedades pendientes

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 5.1 | Propiedad pendiente no aparece en catálogo (lista) | Login como comprador → tab Catálogo | La propiedad con `estatus = 'pendiente_verificacion'` NO figura en la lista | ➖ |
| 5.2 | Propiedad pendiente no aparece en catálogo (mapa) | Cambiar a vista mapa | El pin de la propiedad pendiente NO aparece en el mapa | ➖ |
| 5.3 | RLS bloquea lectura directa desde cliente | Usuario comprador consulta `propiedades` directamente (SQL Editor o Postman con su JWT) | Propiedad `pendiente_verificacion` de otro vendedor devuelve 0 resultados | ➖ |
| 5.4 | Vendedor SÍ puede leer su propia propiedad pendiente | Vendedor consulta sus propiedades | La propiedad pendiente aparece en "Mis propiedades" | ➖ |

---

## Bloque 6 — Tablero de Requerimientos (lectura)

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 6.1 | Tab "Todos" muestra requerimientos de la red | Asesor → tab Requerimientos → "Todos" | Se listan todos los requerimientos activos (de todos los asesores) | ➖ |
| 6.2 | Card muestra tipo de operación | Ver cualquier card | Badge "Compra" o "Renta" visible | ➖ |
| 6.3 | Card muestra tipo de propiedad si existe | Requerimiento con tipo definido | Badge del tipo visible junto al de operación | ➖ |
| 6.4 | Card muestra zona | Requerimiento con zona definida | Texto "📍 Roma Norte, CDMX" visible | ➖ |
| 6.5 | Card muestra rango de precio | Requerimiento con precio_min y precio_max | Texto "💰 $1,500,000 – $3,000,000" visible | ➖ |
| 6.6 | Card muestra conteo de coincidencias | Requerimiento que coincide con propiedades disponibles | Texto "X propiedades coinciden" en verde teal | ➖ |
| 6.7 | Coincidencias = 0 cuando no hay match | Requerimiento con precio muy alto o zona inexistente | Texto "0 propiedades coinciden" | ➖ |
| 6.8 | Sub-tab "Mis publicaciones" filtra correctamente | Asesor A → "Mis publicaciones" | Solo muestra los requerimientos publicados por ese asesor | ➖ |
| 6.9 | Estado vacío en "Todos" | Sin requerimientos activos | Ícono + texto "No hay requerimientos activos en la red" | ➖ |
| 6.10 | Estado vacío en "Mis publicaciones" | Asesor sin requerimientos propios | Ícono + texto + botón "Publicar primero" | ➖ |

---

## Bloque 7 — Publicar y editar requerimiento

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 7.1 | Botón "Publicar" abre modal | Tocar "+ Publicar" en el header | Se abre sheet/modal "Nuevo requerimiento" | ➖ |
| 7.2 | Selector de tipo de operación funciona | Tocar "Compra" o "Renta" | El botón seleccionado se resalta en teal; el otro queda gris | ➖ |
| 7.3 | Picker de tipo de propiedad funciona | Tocar "Tipo de propiedad" en el modal | Se abre sub-sheet con lista de tipos + opción "Cualquier tipo" | ➖ |
| 7.4 | Validación mínima | Intentar guardar sin zona, precio ni tipo | Alert "Faltan datos — Agrega al menos una zona, rango de precio o tipo de propiedad" | ➖ |
| 7.5 | Publicación exitosa | Llenar al menos un campo + "Publicar requerimiento" | Modal se cierra + el requerimiento aparece en la lista | ➖ |
| 7.6 | Botones editar/eliminar solo visibles en propios | Asesor A ve requerimientos de B | Requerimientos de B no tienen iconos de edición/eliminación | ➖ |
| 7.7 | Editar requerimiento propio | Asesor A → lápiz en su requerimiento | Modal "Editar requerimiento" abre con datos prellenados | ➖ |
| 7.8 | Guardar edición actualiza el card | Modificar zona → guardar | El card refleja la nueva zona sin necesidad de reiniciar la app | ➖ |
| 7.9 | Desactivar requerimiento | Tocar ícono de basura → confirmar | Alert de confirmación → al confirmar, el requerimiento desaparece de la lista | ➖ |
| 7.10 | Desactivado no reaparece | Tras desactivar → pull-to-refresh | El requerimiento eliminado no vuelve a aparecer | ➖ |

---

## Bloque 8 — Seguridad / RLS

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 8.1 | Asesor B no puede editar requerimiento de A | Llamar UPDATE en `requerimientos` con JWT de B sobre un registro de A | 0 filas afectadas (RLS bloquea) | ➖ |
| 8.2 | Comprador no puede publicar requerimientos | INSERT en `requerimientos` con JWT de comprador | Error de RLS o 0 filas insertadas | ➖ |
| 8.3 | Comprador puede leer requerimientos activos | SELECT en `requerimientos` con JWT de comprador | Devuelve los requerimientos activos (política permissive SELECT) | ➖ |
| 8.4 | Vendedor pendiente no puede insertar propiedad | Intentar llamar INSERT en `propiedades` con cuenta pendiente directamente | RLS no bloquea el INSERT (la restricción es lógica de app), pero la propiedad queda en `pendiente_verificacion` | ➖ |
| 8.5 | Vendedor no puede ver propiedades de otro vendedor | Vendedor A consulta propiedades directamente con su JWT | Solo devuelve sus propias propiedades | ➖ |

---

## Bugs encontrados

| # | Bloque | Descripción | Severidad | Estado |
|---|---|---|---|---|

> Severidad: 🔴 Crítico (bloquea flujo) · 🟡 Medio (afecta UX) · 🟢 Menor (cosmético)

---

## Limitaciones conocidas (no son bugs, están documentadas)

| # | Descripción | Plan |
|---|---|---|
| L1 | Carga de fotos y documentos de propiedad marcada "Próximamente" | Fase 5.1 — requiere `npx expo install expo-image-picker expo-document-picker` + rebuild del dev client |

---

## Notas generales

- El bloque 5 (catálogo excluye pendientes) es crítico — verifica tanto la consulta de lista como el mapa y la RLS directa.
- El caso 8.1 puede probarse desde el SQL Editor de Supabase usando `SET request.jwt.claims = '...'` con el JWT del asesor B, o desde Postman.
- Para el caso 6.6 (coincidencias), el conteo es client-side comparando con propiedades en estatus `disponible` — asegúrate de tener al menos una propiedad disponible con tipo/ciudad/precio que coincida con un requerimiento de prueba.
