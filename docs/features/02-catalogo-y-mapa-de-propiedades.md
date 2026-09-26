# Fase 2 — Catálogo y mapa de propiedades

## Objetivo
Que cualquier usuario autenticado pueda descubrir propiedades de dos formas complementarias: un mapa con pines clicables y un catálogo tipo feed. El diseño de referencia es **Airbnb** — tarjetas visuales con foto dominante, precio destacado y características a golpe de vista. El mapa estilo Uber (asesores en tiempo real) es exclusivo de Fase 4 (bandeja de citas) y no aplica aquí.

## Prerrequisitos de esquema
- El valor `pendiente_verificacion` ya fue agregado a `estatus_propiedad` (aplicado 2026-09-18)
- Decisión pendiente sobre API key de mapas: confirmar con Ricardo si se reutiliza la de Google Maps del CRM o se crea una nueva para la app

## Diseño de referencia — estilo Airbnb

### Catálogo (feed)
- Scroll vertical de tarjetas de ancho completo
- Cada tarjeta: **foto principal grande** (relación 4:3 aprox.) como elemento dominante, precio en color dorado (`#C9A227`) debajo, título y ciudad en texto secundario, chips de características (recámaras 🛏, baños 🚿, m² 📐)
- Sin foto → placeholder con ícono de casa, nunca imagen rota
- Tap en tarjeta → abre ficha de detalle

### Mapa
- Vista alternativa al feed (toggle mapa / lista, como Airbnb)
- Pines por propiedad en `propiedades.latitud` / `propiedades.longitud`
- Tap en pin → card flotante con foto miniatura, precio y título (sin salir del mapa)
- Tap en la card flotante → abre ficha de detalle
- Propiedades sin coordenadas no aparecen en el mapa, sí en el feed

### Toggle mapa / lista
- Botón flotante sobre el mapa para cambiar a lista, y viceversa — mismo patrón que Airbnb
- Ambas vistas comparten los mismos filtros activos en tiempo real

## Alcance

### Descubrimiento
- **Vista de catálogo/feed**: scroll tipo Airbnb descrito arriba
- **Vista de mapa**: pines clicables con card flotante, toggle hacia el feed

### Filtros
- Zona/ciudad/colonia (búsqueda de texto)
- Recámaras (chips: Todos / 1+ / 2+ / 3+ / 4+)
- Rango de precio, baños, tipo de propiedad (`tipos_propiedad`) — pendiente de confirmar si van en un modal de filtros o inline

### Ficha de detalle
- Galería de fotos con scroll horizontal (`propiedad_fotos`, respetar el campo `orden`), indicadores de punto
- Precio en dorado, descripción, dirección, características
- Datos del tipo de propiedad (`tipos_propiedad.nombre`)

### Decisión de producto pendiente
HUHO muestra la comisión prominentemente sobre la foto ("¡$X de comisión!"). Confirmar con Ricardo/Dalia si Mogao hace lo mismo o lo omite antes de construir la tarjeta definitiva.

## Fuera de alcance
- Publicar/editar una propiedad (Fase 5, flujo del vendedor)
- Solicitar visita o cita (Fase 3)
- Mapa en tiempo real con ubicación de asesores (Fase 4)

## Criterios de aceptación
- Feed y mapa muestran el mismo set de propiedades con los mismos filtros activos
- Tarjeta visual es consistente con el estilo Airbnb: foto dominante, precio dorado, características visibles sin abrir el detalle
- Propiedad sin fotos muestra placeholder, no rompe la UI
- Propiedad sin coordenadas aparece en el feed pero no en el mapa
- Filtros combinables sin romper la consulta
- RLS: solo propiedades `disponible` son visibles para comprador/vendedor/asesor
