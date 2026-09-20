# Fase 2 — Catálogo y mapa de propiedades

## Objetivo
Que cualquier usuario (autenticado o no, según RLS) pueda descubrir propiedades de dos formas complementarias: un mapa con pines clicables y un catálogo tipo feed (estilo Airbnb). No es necesario ni deseable imitar la metáfora visual de Uber aquí — eso es exclusivo del mecanismo de citas (Fase 4).

## Prerrequisitos de esquema
- Confirmar si el valor "pendiente de verificación" ya fue agregado a `estatus_propiedad`. Mientras no exista, las propiedades de vendedores independientes no tienen dónde reflejar ese estado — no lances esta fase completa a producción sin ese valor si ya hay vendedores externos dados de alta
- Decisión pendiente sobre API key de mapas: confirmar con Ricardo si se reutiliza la de Google Maps del CRM o se crea una nueva para la app

## Alcance

### Descubrimiento
- **Vista de mapa**: pines por propiedad con lat/long (`propiedades.latitud`, `propiedades.longitud`), tap en un pin abre resumen/ficha
- **Vista de catálogo/feed**: scroll tipo Airbnb, tarjeta con foto principal, precio, ubicación, características básicas (recámaras/baños/m²)
- Tabs de tipo de operación si aplica (venta/renta/preventa — confirmar con Ricardo si esto ya existe como filtro en `propiedades` o hay que inferirlo de otro campo)

### Filtros
- Zona/ciudad/colonia (búsqueda de texto o selección de mapa)
- Rango de precio, recámaras, baños
- Tipo de propiedad (`tipos_propiedad`)

### Ficha de detalle
- Galería de fotos (`propiedad_fotos`, respetar el campo `orden`)
- Descripción, dirección, precio, características (`caracteristicas` jsonb)
- Documentos públicos de la propiedad si aplica (`propiedad_documentos` — confirmar cuáles son visibles para el público vs. solo para asesores/admin)

### Decisión de producto pendiente
HUHO muestra la comisión de forma muy prominente sobre la foto principal ("¡$X de comisión!"). Confirmar con Ricardo/Dalia si Mogao App hace lo mismo o lo mantiene más discreto antes de construir la tarjeta definitiva del catálogo.

## Fuera de alcance
- Publicar/editar una propiedad (eso es Fase 5, flujo del vendedor)
- Solicitar visita o cita (Fase 3)

## Criterios de aceptación
- El catálogo público respeta RLS: un usuario anónimo solo debe ver propiedades con estatus que corresponda a las políticas `public_read_all` / `public_read_disponibles` — verificar cuál aplica realmente y que no se filtren propiedades en verificación
- Filtros combinables sin romper la consulta
- Mapa y catálogo muestran el mismo set de datos (no dos fuentes desincronizadas)
- Probar con una propiedad sin fotos (no debe romper la UI)
