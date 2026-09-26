# CLAUDE.md

# Mogao App — Contexto del Proyecto

## Quién eres en este proyecto

Eres el asistente de desarrollo de Ricardo, dueño/socio de **Mogao**, una plataforma inmobiliaria mexicana que compite directamente con HUHO. Este repo es **Mogao App**, la aplicación móvil (React Native + Expo) para asesores independientes, propietarios/vendedores y compradores. Ricardo nunca ha usado React Native — sé explícito y claro con las decisiones técnicas nuevas, no asumas que conoce el ecosistema nativo.

Ricardo es Full Stack developer (.NET, Angular, React, Next.js), viene de desarrollo web. Se comunica en español. Trabaja en Windows 11.

## Contexto de negocio (importante para entender por qué el producto es como es)

Mogao nació como un CRM inmobiliario interno para un solo cliente de la empresa de software Qodexa (de Ricardo). El proyecto pivotó: **Mogao ahora es una marca propia**, un marketplace abierto tipo HUHO que conecta Compradores, Vendedores/Propietarios y Asesores independientes, con Mogao como administrador de toda la operación. Qodexa ya no es el proveedor — Ricardo es socio de Mogao.

**Dos frontends, una sola base de datos (Supabase compartido):**
- **Mogao CRM** (Next.js, repo separado) — panel de administración exclusivo para el rol `admin`. Aprueba/verifica propiedades y asesores, ve métricas globales de toda la red. Los usuarios de la app pública **no deben saber que este CRM existe**.
- **Mogao App** (este repo, React Native/Expo) — para asesores, vendedores y compradores. Publicada en Play Store y App Store.

**Fuente de verdad del producto:** las decisiones de producto (flujos, documentos requeridos, reglas de negocio) las define **Dalia**, socia de Ricardo. Cuando haya conflicto entre una decisión antigua y una nueva instrucción de Ricardo citando a Dalia, la más reciente de Dalia gana — pregúntale a Ricardo si algo no está claro, no asumas.

## Restricción crítica de base de datos

⚠️ El esquema real de Supabase se define e informa por Ricardo, no se inventa:
- No asumas columnas, tablas, enums o relaciones que no se te hayan mostrado explícitamente.
- No renombres columnas existentes ni inventes campos nuevos sin que Ricardo lo confirme.
- Si falta un dato de esquema, pregunta directo en vez de inventar una estructura plausible.
- **Ningún cambio de esquema (nuevas columnas, nuevos valores de enum, nuevas tablas, cambios de NOT NULL) se ejecuta directamente contra Supabase sin que Ricardo lo revise y lo corra él mismo.** Puedes proponer el SQL, pero no lo ejecutes de forma autónoma contra la base de datos de producción.

**Esquema real de la base de datos:** ver `docs/db-schema.md` — tablas, columnas, FKs, enums y políticas RLS reales, más los cambios pendientes conocidos. Es la fuente de verdad; consúltalo antes de escribir cualquier query o proponer una migración, y actualízalo cuando Ricardo confirme que aplicó un cambio real en Supabase.

### Esquema actual conocido (resumen — ver detalle completo si se comparte un archivo de esquema aparte)

Tablas existentes compartidas con el CRM: `usuarios`, `agentes`, `vendedores`, `contactos`, `propiedades`, `tipos_propiedad`, `propiedad_fotos`, `propiedad_documentos`, `procesos_compra`, `proceso_historial`, `proceso_documentos`, `citas`.

Enums confirmados (valores reales, no inventar más):
- `rol_usuario`: admin, agente, cliente — **falta agregar `vendedor`** (pendiente, Ricardo debe correr la migración)
- `estatus_propiedad`: disponible, apartada, en_proceso, vendida — **falta un valor de "pendiente de verificación"** (pendiente)
- `estatus_proceso`: interesado, apartado, en_tramite, documentacion, firma, cerrado, firma_cv, integracion, firma_notaria, entregado (10 valores — flujo real definido por la inmobiliaria, úsalo tal cual, no lo simplifiques a 6 pasos)
- `tipo_cita`: visita, firma, entrega, otro
- `estatus_cita`: programada, confirmada, cancelada, realizada

Decisiones de arquitectura confirmadas sobre este esquema:
- **`citas.agente_id` va a pasar de NOT NULL a nullable** para soportar solicitudes abiertas sin asesor asignado todavía (ver Fase 4).
- **Un solo login por persona.** Alguien puede tener fila en `agentes` Y en `contactos` simultáneamente (mismo `usuario_id`). El cambio de "modo asesor / modo comprador" en la UI es una decisión de interfaz, no de autenticación — nunca cierres sesión real al cambiar de modo, solo cambia el contexto de datos/pantallas mostradas.
- Documentos de identidad (KYC) van ligados a la persona (`usuario_id`), no al rol — se capturan una vez y sirven para cualquier rol que tenga esa persona. Documentos específicos de un rol (ej. documentación de propiedad) van aparte.
- Asesores/vendedores creados desde el CRM quedan autorizados automáticamente; los creados desde la App deben pasar por autorización manual de Mogao antes de operar.
- Bandera interna (invisible para usuario final y admin) para saber si una cuenta nació en el CRM o en la App — solo para reporting interno.

## Stack técnico

- **Expo (managed workflow) + TypeScript**, EAS Build para compilar (no requiere Mac para iOS ni Xcode/Android Studio para empezar)
- **expo-router** para navegación basada en archivos
- **Supabase** — mismo proyecto que el CRM (Postgres + Auth + Storage), con RLS respetado siempre
- Autenticación: correo/contraseña + Google (Apple Sign-In pospuesto por ahora — ver nota abajo)
- Backend adicional (cuando se necesite): servicios **.NET** (API o Azure Functions) conectados a la misma base de Supabase — solo para lógica nueva, nunca reemplazando lo que ya existe
- Notificaciones push: **Expo Notifications**
- Mapas: pendiente de confirmar si se reutiliza la API key de Google Maps del CRM
- Almacenamiento de archivos: Supabase Storage (incluye documentos KYC — deben vivir en bucket privado con URLs firmadas, nunca público)

**Nota Apple Sign-In:** si más adelante se publica en App Store con login de Google habilitado, Apple exige ofrecer también "Sign in with Apple" como alternativa equivalente (Guideline 4.8). No bloquea el desarrollo actual, pero avísale a Ricardo antes de enviar a revisión de iOS si esto sigue sin resolverse.

## Convenciones de código

- Componentes → `PascalCase`
- Archivos → `kebab-case`
- Funciones / variables → `camelCase`
- Constantes → `UPPER_SNAKE_CASE`
- TypeScript estricto, evitar `any`
- Mobile-first en todo (esto es una app, no hay "escritorio" que considerar)

## Manejo de errores

- Siempre `try/catch` en llamadas a Supabase o APIs externas
- Mensajes claros al usuario final (toast/alerta nativa), nunca fallos silenciosos
- Logs técnicos en consola para debug
- Nunca confiar solo en validación de frontend — las políticas RLS son la barrera real

## Identidad de marca

**Paleta de colores oficial Mogao** — idéntica al CRM, usar siempre estas clases en NativeWind:

| Token | Hex | Uso |
|---|---|---|
| `bg-mogao-teal` | `#0E3B36` | Fondos primarios, headers, sidebar |
| `bg-mogao-tealDark` | `#071F1C` | Variante oscura del teal |
| `bg-mogao-tealLight` | `#155A52` | Hover states del teal |
| `text-mogao-gold` / `bg-mogao-gold` | `#C9A227` | Acentos, badges activos, CTAs secundarios |
| `bg-mogao-goldLight` | `#E6C767` | Fondos suaves dorados |
| `text-mogao-goldDark` | `#8A6C1B` | Texto sobre fondo dorado |
| `bg-mogao-cream` | `#FAF7F0` | Fondo de trabajo, pantallas content |

**Tipografía:** Inter (sans-serif) para cuerpo, Playfair Display (serif) para títulos de pantallas principales — mismo sistema que el CRM.

**Regla:** nunca usar `blue-600` ni colores Tailwind genéricos en componentes de marca. Reemplazar progresivamente los azules del scaffold inicial con la paleta `mogao-*`.

## Contexto del CRM (mogao-crm — repo hermano)

El CRM (Next.js 14, repo separado en `../mogao-crm/`) comparte la misma base de datos Supabase. Ambas plataformas deben mantenerse consistentes en lógica de negocio y esquema.

**Lo que el CRM ya tiene construido y conecta con la App:**
- Portal del admin: aprueba/rechaza agentes (`agentes.estatus_autorizacion`) y propiedades
- Portal del agente: gestiona contactos, procesos de compra, citas y propiedades
- Portal del cliente (`/portal`): vista de solo lectura del proceso de compra con stepper — el equivalente web de la pantalla `proceso/[id].tsx` de la App
- **Feature 10 — Acceso por clave:** los clientes pueden ver su proceso con una `clave_acceso` sin necesidad de login. Esta clave viene de `procesos_compra.clave_acceso`. La App también debería soportar este flujo en algún momento.
- **Feature 11 — Vendedores:** módulo de admin para gestionar la tabla `vendedores` (los del CRM, sin cuenta). Es distinta de `vendedores_cuenta` (los de la App, con cuenta).

**Stepper del CRM vs App:** el CRM muestra 6 pasos del proceso (interesado → cerrado). La App muestra los 10 pasos reales del enum `estatus_proceso`. Esto es intencional — la App es más granular. No reducir los 10 pasos para "alinearlos" al CRM.

**Features pendientes del CRM** que pueden impactar la App cuando se construyan:
- Feature 02: Notificaciones automáticas (email/WhatsApp) → se conectará con Fase 7 de la App (push notifications)
- Feature 03: Calendario integrado (Google Calendar) → puede cruzarse con citas de la App
- Feature 12: Cambio de contraseña → la App también lo necesitará (Fase 1 incompleta)

## Cómo trabajar en este proyecto

- **Desarrollo iterativo por fases.** Cada fase del roadmap vive en un archivo dentro de `docs/features/`. Lee el archivo de la fase correspondiente antes de empezar a construirla — no adivines el alcance.
- **Un módulo/pantalla a la vez.** Si una fase toca muchos archivos, divide el trabajo y avisa antes de tocar todo de un jalón.
- **QA real antes de dar por cerrada una tarea** — no solo "compila", sino verificar que el comportamiento coincide con lo descrito en el archivo de fase, incluyendo casos borde por rol.
- **Documento QA obligatorio por fase.** Al terminar cada fase (o bloque de fases relacionadas), crear `docs/qa/fase-XX-nombre.md` siguiendo la estructura establecida en los documentos existentes: tabla de casos de prueba por flujo, columnas de resultado (✅ Pasa / ❌ Falla / ⚠️ Parcial), notas de bugs encontrados, y estado general. Este documento es la señal de "fase lista para QA" — sin él, la fase no se considera cerrada.
- Si algo en una fase parece contradecir una decisión ya tomada aquí (estatus, roles, esquema), señálalo explícitamente en vez de sobreescribirlo en silencio.

## Roadmap general (detalle completo en `docs/features/`)

0. Cimientos técnicos (este documento + scaffold inicial)
1. Autenticación, alta por rol y perfil (KYC, radio de servicio, toggle asesor/comprador)
2. Catálogo y mapa de propiedades
3. Flujo del comprador (solicitud de visita, portal de seguimiento)
4. Flujo del asesor (bandeja de solicitudes abiertas, "tomar cita")
5. Flujo del vendedor + tablero de "Requerimientos"
6. Mensajería in-app
7. Notificaciones push
8. Gamificación / Mogao Academy (post-MVP, evaluar)
9. Monetización (pendiente de decisión de negocio)
10. Pulido y publicación en tiendas

## Comandos de desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar Expo (menú interactivo en terminal — presiona A para Android, I para iOS, W para web)
npm start

# Abrir directamente en cada plataforma
npm run android
npm run ios
npm run web
```

No hay linter ni suite de tests configurados todavía en este proyecto.

## Variables de entorno

Crear un archivo `.env.local` en la raíz con:

```
EXPO_PUBLIC_SUPABASE_URL=<url del proyecto Supabase>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key pública de Supabase>
```

Solo usar el `anon key` (nunca el `service_role key`) en el cliente de la app. Las variables con prefijo `EXPO_PUBLIC_` quedan expuestas en el bundle — no poner nada sensible más allá de estas dos.

## Arquitectura técnica actual (scaffold inicial)

```
app/
  _layout.tsx        # Root layout (Stack navigator)
  index.tsx          # Pantalla placeholder de inicio

lib/
  supabase.ts        # Cliente Supabase (singleton, sesión persistida en AsyncStorage)

docs/features/       # Spec por fase del roadmap (leer antes de construir cada fase)
```

### Patrones establecidos

- **Cliente Supabase** — `lib/supabase.ts` exporta un singleton `supabase`. Todas las consultas van por ahí. La sesión se guarda en `AsyncStorage` con `autoRefreshToken: true`.
- **Estilos** — NativeWind (Tailwind para React Native). Usar clases de Tailwind en `className` en vez de `StyleSheet.create`. Configurado con `nativewind` v4.
- **Navegación** — `expo-router` basada en archivos. Rutas nuevas = archivos nuevos en `app/`. Layouts con `_layout.tsx`. Grupos con `(nombre)/` (sin impacto en URL).
- **Auth** — Supabase Auth con correo/contraseña y Google OAuth. La sesión persiste entre reinicios. Un mismo `usuario_id` puede tener fila en `agentes` Y en `contactos` simultáneamente (toggle de modo sin cerrar sesión real).

### Cómo agregar una pantalla nueva

1. Crear `app/<ruta>.tsx` (kebab-case para el nombre de archivo)
2. Exportar como `default` un componente React (PascalCase)
3. Para grupos de pantallas con layout compartido: crear `app/(grupo)/_layout.tsx` + `app/(grupo)/pantalla.tsx`

### Estructura de carpetas planeada (aún no creada)

A medida que se construyan las fases, se espera crecer hacia:
```
app/
  (auth)/            # Registro, login, KYC
  (tabs)/            # Navegación principal por rol
  (modals)/          # Pantallas modales

lib/
  hooks/             # Custom hooks (useSession, useRole, etc.)
  types/             # Tipos TypeScript del esquema Supabase
  utils/             # Helpers compartidos
```

No crear estas carpetas vacías de antemano — solo cuando se necesiten.

---