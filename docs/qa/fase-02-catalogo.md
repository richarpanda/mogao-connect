# QA — Fase 2
**Catálogo y detalle de propiedades**

> Ejecuta cada caso en dispositivo real o emulador. Marca el resultado en la columna R.

**Leyenda:** ✅ Pasa · ❌ Falla · ⚠️ Parcial · ➖ No aplica / pendiente

**Última revisión:** 2026-09-25
**Revisado por:** Ricardo
**Estado general:** 🔲 En progreso

---

## Fuera de alcance de este QA (pendiente de construir)

- Vista de mapa con pines y toggle mapa/lista
- Filtros por precio, baños y tipo de propiedad
- CTA "Solicitar visita" en detalle de propiedad (Fase 3)

---

## Preparación — Datos de prueba necesarios

| Cuenta | Email | Contraseña | Rol |
|---|---|---|---|
| Cualquier usuario autenticado | — | — | cliente / agente / vendedor |

> Propiedad de prueba A: `estatus = 'disponible'`, con fotos, título, ciudad, recámaras, baños y m².
> Propiedad de prueba B: `estatus = 'disponible'`, **sin fotos**.

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

## Bugs encontrados

| # | Bloque | Descripción | Severidad | Estado |
|---|---|---|---|---|
| — | — | — | — | — |

> Severidad: 🔴 Crítico (bloquea flujo) · 🟡 Medio (afecta UX) · 🟢 Menor (cosmético)

---

## Notas generales

- Probar catálogo con los tres roles (comprador, asesor, vendedor) — todos deben ver las mismas propiedades y fotos
- El mapa de propiedades se probará cuando esté construido (pendiente de Fase 2 completa)
