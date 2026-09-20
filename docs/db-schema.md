# Esquema de base de datos — Mogao (Supabase compartido)

**Este archivo es la fuente de verdad del esquema real.** Si necesitas una columna, tabla o relación que no está aquí, pregúntale a Ricardo — no la inventes ni asumas que existe. Cuando el esquema cambie de verdad (Ricardo corre una migración), este archivo se actualiza para reflejarlo — un esquema desactualizado aquí es peor que no tener el archivo.

Última verificación contra la base de datos real: 2026-09-18 — migraciones fase-1 y fase-3 aplicadas.

---

## Tablas existentes

### `usuarios`
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | — (= `auth.uid()`) |
| nombre | text | NO | |
| email | text | NO | |
| telefono | text | YES | |
| rol | enum `rol_usuario` | NO | `'cliente'` |
| activo | boolean | NO | `true` |
| created_at | timestamptz | NO | `now()` |
| updated_at | timestamptz | NO | `now()` |

Trigger `on_auth_user_created` crea la fila automáticamente al registrarse via Supabase Auth. `nombre` se toma de `raw_user_meta_data` (campo `nombre` + `apellido` que se pasa en `signUp options.data`).

### `agentes`
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| usuario_id | uuid → `usuarios.id` | NO | |
| comision_pct | numeric | YES | |
| activo | boolean | NO | `true` |
| estatus_autorizacion | text | NO | `'pendiente'` |
| motivo_rechazo | text | YES | |
| origen | text | NO | `'app'` |
| created_at / updated_at | timestamptz | NO | `now()` |

- `estatus_autorizacion`: `'pendiente'` | `'autorizado'` | `'rechazado'`
- `origen`: `'app'` | `'crm'` — interno, no exponer en UI
- Agentes existentes (pre-migración) tienen `estatus_autorizacion = 'autorizado'` y `origen = 'crm'`

### `vendedores`
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| nombre | text | NO | |
| email | text | YES | |
| telefono | text | YES | |
| notas | text | YES | |
| created_at | timestamptz | NO | `now()` |

Solo registros de contacto internos del CRM — **no tienen cuenta de usuario**. No confundir con `vendedores_cuenta`.

### `vendedores_cuenta`
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| usuario_id | uuid → `usuarios.id` | NO | |
| activo | boolean | NO | `true` |
| estatus_autorizacion | text | NO | `'pendiente'` |
| motivo_rechazo | text | YES | |
| origen | text | NO | `'app'` |
| created_at / updated_at | timestamptz | NO | `now()` |

Vendedores/propietarios con cuenta propia en la App. Mismo patrón que `agentes`. RLS: admin todo; el propio vendedor puede leer/insertar su fila.

### `kyc_documentos`
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| usuario_id | uuid → `usuarios.id` | NO | |
| tipo | text | NO | |
| url | text | NO | |
| estatus | text | NO | `'pendiente'` |
| notas | text | YES | |
| created_at | timestamptz | NO | `now()` |

- `tipo`: `'ine_frente'` | `'ine_reverso'` | `'pasaporte'` | `'selfie'` | `'constancia_fiscal'` | `'acta_nacimiento'`
- `estatus`: `'pendiente'` | `'aprobado'` | `'rechazado'`
- Ligado a `usuario_id` (no a un rol) — un mismo documento sirve para cualquier rol de esa persona.
- URLs deben vivir en bucket **privado** de Supabase Storage con URLs firmadas — nunca bucket público.
- RLS: admin todo; el propio usuario puede leer/escribir sus documentos.

### `contactos`
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| agente_id | uuid → `agentes.id` | YES | |
| usuario_id | uuid → `usuarios.id` | YES | |
| nombre | text | NO | |
| email | text | YES | |
| telefono | text | YES | |
| origen | text | YES | |
| notas | text | YES | |
| created_at / updated_at | timestamptz | NO | `now()` |

`agente_id` nullable desde 2026-09-18. Permite crear contactos para compradores que aún no tienen asesor asignado.

### `propiedades`
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| agente_id | uuid → `agentes.id` | YES | |
| titulo | text | NO | |
| descripcion | text | YES | |
| direccion | text | YES | |
| ciudad | text | YES | |
| precio | numeric | NO | |
| estatus | enum `estatus_propiedad` | NO | `'disponible'` |
| caracteristicas | jsonb | NO | `'{}'` |
| tipo_id | uuid → `tipos_propiedad.id` | YES | |
| latitud / longitud | numeric | YES | |
| vendedor_id | uuid → `vendedores.id` | YES | |
| created_at / updated_at | timestamptz | NO | `now()` |

### `tipos_propiedad`
`id`, `nombre`, `orden`, `created_at`

### `propiedad_fotos`
`id`, `propiedad_id` → `propiedades.id`, `url`, `orden`, `created_at`

### `propiedad_documentos`
`id`, `propiedad_id` → `propiedades.id`, `tipo`, `url`, `created_at`

### `procesos_compra`
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| propiedad_id | uuid → `propiedades.id` | NO | |
| contacto_id | uuid → `contactos.id` | NO | |
| agente_id | uuid → `agentes.id` | NO | |
| estatus | enum `estatus_proceso` | NO | `'interesado'` |
| precio_acordado | numeric | YES | |
| fecha_inicio | timestamptz | NO | `now()` |
| fecha_cierre | timestamptz | YES | |
| clave_acceso | text | NO | generado automático (código de acceso del portal del comprador) |
| created_at / updated_at | timestamptz | NO | `now()` |

### `proceso_historial`
`id`, `proceso_id` → `procesos_compra.id`, `estatus_anterior`, `estatus_nuevo`, `comentario`, `usuario_id` → `usuarios.id`, `created_at`

### `proceso_documentos`
`id`, `proceso_id` → `procesos_compra.id`, `tipo`, `nombre_archivo`, `url`, `subido_por` → `usuarios.id`, `created_at`

### `citas`
| Columna | Tipo | Nullable | Default |
|---|---|---|---|
| id | uuid | NO | `gen_random_uuid()` |
| proceso_id | uuid → `procesos_compra.id` | YES | |
| agente_id | uuid → `agentes.id` | YES | |
| contacto_id | uuid → `contactos.id` | NO | |
| propiedad_id | uuid → `propiedades.id` | YES | |
| fecha_hora | timestamptz | NO | |
| tipo | enum `tipo_cita` | NO | `'visita'` |
| estatus | enum `estatus_cita` | NO | `'programada'` |
| notas | text | YES | |
| created_at / updated_at | timestamptz | NO | `now()` |

`agente_id` nullable desde 2026-09-18. Las citas nacen sin asesor; el asesor las toma en Fase 4 (UPDATE atómico con `WHERE agente_id IS NULL`).

---

## Enums (valores reales confirmados — no agregar ni quitar sin confirmar)

- **`rol_usuario`**: `admin`, `agente`, `cliente`, `vendedor` (aplicado 2026-09-18)
- **`estatus_propiedad`**: `disponible`, `apartada`, `en_proceso`, `vendida`, `pendiente_verificacion` (aplicado 2026-09-18)
- **`estatus_proceso`**: `interesado`, `apartado`, `en_tramite`, `documentacion`, `firma`, `cerrado`, `firma_cv`, `integracion`, `firma_notaria`, `entregado` (10 valores — flujo real de la inmobiliaria, no simplificar)
- **`tipo_cita`**: `visita`, `firma`, `entrega`, `otro`
- **`estatus_cita`**: `programada`, `confirmada`, `cancelada`, `realizada`

---

## RLS (Row Level Security) — activo en todas las tablas

Funciones helper usadas en las políticas: `current_rol()`, `current_agente_id()`, `current_contacto_id()`.

- `agentes`: admin todo; el propio agente puede leer su fila (`usuario_id = auth.uid()`)
- `vendedores_cuenta`: admin todo; el propio vendedor puede leer/insertar su fila (`usuario_id = auth.uid()`)
- `kyc_documentos`: admin todo; el propio usuario puede leer/escribir sus docs (`usuario_id = auth.uid()`)
- `contactos`: admin todo; agente dueño del contacto todo; el propio cliente puede leer su fila (`usuario_id = auth.uid()`)
- `citas`: admin todo; el agente asignado todo (`agente_id = current_agente_id()`); el contacto puede leer las suyas
- `procesos_compra` / `proceso_historial` / `proceso_documentos`: admin todo, agente dueño todo, contacto solo lectura de lo suyo
- `propiedades`: admin todo; agente autenticado puede leer todas; `cliente` y `vendedor` pueden leer todas las propiedades con `estatus = 'disponible'` (policy `cliente_vendedor_read_disponibles`, aplicada 2026-09-20)
- `propiedad_fotos` / `propiedad_documentos`: admin todo; agente/cliente autenticados pueden leer; fotos con lectura pública para `anon`
- `tipos_propiedad`: admin todo; lectura para cualquier usuario autenticado
- `usuarios`: admin todo; cada quien lee su propia fila (`id = auth.uid()`)
- `vendedores` (tabla CRM): solo admin

---

## Cambios de esquema pendientes (propuestos, NO aplicados todavía)

Tablas que aún no existen (diseño pendiente de proponer y confirmar con Ricardo antes de crear):
- Tablero de "Requerimientos" (Fase 5)
- Mensajes/conversaciones (Fase 6)
- Push tokens (Fase 7)
