# QA — Fase 2
**Catálogo y detalle de propiedades**

> Ejecuta cada caso en dispositivo real o emulador. Marca el resultado en la columna R.

**Leyenda:** ✅ Pasa · ❌ Falla · ⚠️ Parcial · ➖ No aplica / pendiente

**Última revisión:** 2026-09-26
**Revisado por:** —
**Estado general:** 🔲 Lista para QA (Bloques 5–6 en Expo Go · Bloques 7–8 requieren development build)

---

## Fuera de alcance de este QA

- CTA "Solicitar visita" en detalle de propiedad (Fase 3)

---

## Preparación — Datos de prueba necesarios

| Cuenta | Email | Contraseña | Rol |
|---|---|---|---|
| Cualquier usuario autenticado | — | — | cliente / agente / vendedor |

> **Propiedad A:** `estatus = 'disponible'`, con 2+ fotos, título, ciudad, recámaras, baños y m², **con latitud/longitud**.
> **Propiedad B:** `estatus = 'disponible'`, **sin fotos**, **sin coordenadas**.
> **Propiedad C:** `estatus = 'disponible'`, tipo de propiedad distinto al de A.

⚠️ El mapa requiere **development build** — no funciona en Expo Go. Instalar `react-native-maps` (`npx expo install react-native-maps`) y crear un dev client con EAS Build antes de probar los casos del Bloque 7.

---

## Bloque 5 — Catálogo de propiedades

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 5.1 | Catálogo carga propiedades | Login como comprador → tab Catálogo | Lista de propiedades con foto, precio en dorado, ciudad | ✅ |
| 5.2 | Fondo cream en catálogo | Ver pantalla | SafeAreaView con fondo `#FAF7F0` | ✅ |
| 5.3 | Propiedad sin foto muestra placeholder | Propiedad B en la lista | Placeholder con ícono 🏠, no imagen rota | ✅ |
| 5.4 | Búsqueda por ciudad | Escribir ciudad → Buscar | Lista se filtra correctamente | |
| 5.5 | Búsqueda vacía muestra todo | Borrar búsqueda → Buscar | Vuelve a mostrar todas las propiedades | |
| 5.6 | Chip de recámaras activo | Tocar chip "2+" | Chip se pone dorado, lista filtra propiedades con ≥ 2 recámaras | |
| 5.7 | Chip "Todos" limpia filtro | Tocar chip "Todos" | Vuelve a mostrar todo, chip activo regresa a "Todos" | |
| 5.8 | Pull to refresh | Pull-down en la lista | Indicador de carga, lista se recarga | |
| 5.9 | Lista vacía | Buscar ciudad inexistente | Mensaje "No hay propiedades disponibles", no crash | |
| 5.10 | Fotos visibles para vendedor | Login como vendedor → tab Catálogo | Fotos de propiedades se muestran (no placeholder) | |

---

## Bloque 6 — Detalle de propiedad

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 6.1 | Abrir detalle desde catálogo | Tocar una tarjeta | Navega a ficha con galería, precio, características | |
| 6.2 | Galería con múltiples fotos | Propiedad A (2+ fotos) | Scroll horizontal entre fotos, indicadores de puntos actualizados | |
| 6.3 | Solo una foto | Propiedad con 1 foto | Sin indicadores de puntos, foto se muestra correctamente | |
| 6.4 | Sin fotos | Propiedad B | Placeholder con ícono, sin crash | |
| 6.5 | Precio en dorado | Ver ficha | Precio visible en color `#C9A227` | |
| 6.6 | Características mostradas | Propiedad A | Recámaras, baños y m² visibles | |
| 6.7 | Fondo cream en detalle | Ver pantalla | Fondo `#FAF7F0` en área de contenido | |
| 6.8 | Botón volver | Tocar flecha de regreso | Regresa al catálogo | |

---

## Bloque 7 — Vista de mapa

> ⚠️ Requiere development build con `react-native-maps` instalado y `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` en `.env.local`.

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 7.1 | Toggle a mapa | Tab Catálogo → botón flotante "Ver mapa" | Vista cambia a MapView con pines, botón pasa a "Ver lista" | |
| 7.2 | Toggle a lista | Desde mapa → botón "Ver lista" | Vuelve al feed, filtros activos se conservan | |
| 7.3 | Pines visibles | Propiedad A (con coords) en pantalla | Pin con precio compacto visible sobre el mapa | |
| 7.4 | Propiedad sin coords no aparece en mapa | Propiedad B | No hay pin para B, sí aparece en la lista | |
| 7.5 | Tap en pin muestra card flotante | Tocar pin de Propiedad A | Card flotante con foto, precio y título aparece en la parte inferior | |
| 7.6 | Tap en card flotante navega a detalle | Tap en la card flotante | Navega a `propiedad/[id]` correctamente | |
| 7.7 | Cerrar card flotante | Tocar ✕ en la card | Card desaparece, pines siguen visibles | |
| 7.8 | Tap en mapa cierra card | Tap en área vacía del mapa | Card flotante se cierra | |
| 7.9 | Pin seleccionado cambia a dorado | Tocar un pin | Pin activo se pone dorado, los demás siguen en teal | |
| 7.10 | Aviso sin coordenadas | Filtrar a ciudad sin propiedades con coords | Mensaje "Ninguna propiedad tiene ubicación registrada" | |
| 7.11 | Filtros activos reflejan en mapa | Filtrar por recámaras en lista → cambiar a mapa | Mapa muestra solo las propiedades que pasan el filtro | |

---

## Bloque 8 — Modal de filtros

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 8.1 | Abrir modal | Tocar botón de filtros (icono ≡) | Modal desliza desde abajo | |
| 8.2 | Cerrar con overlay | Tap fuera del modal | Modal se cierra | |
| 8.3 | Filtro por baños | Seleccionar "2+" → Aplicar | Lista muestra solo propiedades con ≥ 2 baños | |
| 8.4 | Filtro por tipo de propiedad | Seleccionar un tipo → Aplicar | Lista filtra por ese tipo | |
| 8.5 | Filtro por precio mínimo | Ingresar precio mínimo → Aplicar | Solo aparecen propiedades con precio ≥ al ingresado | |
| 8.6 | Filtro por precio máximo | Ingresar precio máximo → Aplicar | Solo aparecen propiedades con precio ≤ al ingresado | |
| 8.7 | Filtros combinados | Baños + tipo + precio → Aplicar | Todos los filtros se aplican simultáneamente | |
| 8.8 | Limpiar todo | Abrir modal con filtros activos → "Limpiar todo" | Chips regresan a "Todos", precio vacío | |
| 8.9 | Badge en botón de filtros | Aplicar 2 filtros activos | Botón muestra "2" en dorado | |
| 8.10 | Badge desaparece al limpiar | Limpiar todos los filtros → Aplicar | Botón vuelve a mostrar el ícono (sin badge) | |

---

## Bugs encontrados

| # | Bloque | Descripción | Severidad | Estado |
|---|---|---|---|---|
| — | — | — | — | — |

> Severidad: 🔴 Crítico (bloquea flujo) · 🟡 Medio (afecta UX) · 🟢 Menor (cosmético)

---

## Notas generales

- Probar catálogo con los tres roles (comprador, asesor, vendedor) — todos deben ver las mismas propiedades y fotos
- El mapa (Bloque 7) solo se puede probar en development build — **no funciona en Expo Go**
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` debe estar en `.env.local` (usar la misma API key que el CRM)
