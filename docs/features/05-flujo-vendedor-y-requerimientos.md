# Fase 5 — Flujo del vendedor + tablero de Requerimientos

## Objetivo
Que un vendedor/propietario pueda dar de alta su propiedad con documentación, ver el estatus de verificación, y que exista un tablero de demanda ("Requerimientos") donde los asesores publican lo que buscan sus compradores.

## Prerrequisitos de esquema
- Tabla de vendedores con cuenta propia (ver Fase 1)
- Valor "pendiente de verificación" en `estatus_propiedad`
- **La tabla de "Requerimientos" no existe todavía en el esquema.** No inventes su estructura — proponle a Ricardo un diseño (ej. tipo de operación, tipo de propiedad, rango de precio, zona, `asesor_id` que lo publicó, contador de propiedades asociadas) y espera su confirmación antes de escribir migraciones o código contra ella.

## Alcance

### Alta de propiedad (vendedor)
- Formulario con datos generales, ubicación (lat/long), características, precio
- Carga de documentos requeridos (escritura, predial, agua, etc. — confirmar lista exacta con Ricardo/Dalia)
- La propiedad nace en estatus "pendiente de verificación" y **no debe aparecer en el catálogo/mapa público** (Fase 2) hasta que Mogao la apruebe desde el CRM

### Estatus de verificación
- El vendedor ve claramente si su propiedad está pendiente, aprobada o rechazada (con motivo si aplica)

### Interés generado
- El vendedor puede ver citas/interés generado sobre su propiedad (sin necesariamente ver los datos completos del comprador, según lo que decida RLS — confirmar nivel de detalle con Ricardo)

### Tablero de Requerimientos
- Un asesor publica una solicitud de búsqueda de un comprador: tipo de operación, tipo de propiedad, rango de precio, zona
- El sistema debe poder mostrar cuántas propiedades de la red calzan con ese requerimiento (aunque sea 0 al inicio)
- Vista de "mis requerimientos publicados" para el asesor

## Fuera de alcance
- Verificación por parte del admin (eso vive en el CRM, no en esta app)
- Matching automático inteligente entre requerimientos y propiedades (para esta fase, con que se pueda ver y filtrar manualmente es suficiente — automatizarlo es una mejora futura, no lo construyas de más)

## Criterios de aceptación
- Una propiedad recién creada por un vendedor no aparece en el catálogo público hasta ser aprobada (verificar con RLS, no solo con un filtro de frontend)
- El vendedor ve su propio estatus de verificación reflejado sin refrescar manualmente si es posible
- Un requerimiento se puede publicar y editar por el asesor que lo creó, y nadie más puede editarlo
