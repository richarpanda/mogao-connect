# Fase 1 — Autenticación, alta por rol y perfil

## Objetivo

Que una persona pueda registrarse en Mogao App como Comprador, Vendedor/Propietario o Asesor, pase por el flujo de verificación de identidad correspondiente, y quede en el estatus correcto según de dónde vino y qué rol tomó.

## Prerrequisitos de esquema (NO asumir que ya existen — confirmar con Ricardo antes de escribir queries que dependan de esto)

- Valor `vendedor` agregado al enum `rol_usuario`
- Nueva tabla para vendedores/propietarios con cuenta propia (con `usuario_id` FK a `usuarios`, siguiendo el mismo patrón que `agentes`)
- Nueva tabla de documentos de identidad (KYC) ligada a `usuario_id`, no a un rol específico — pensada para que un documento (INE, acta de nacimiento) sirva para cualquier rol que tenga esa persona
- Columna de estatus de autorización en `agentes` (y en la nueva tabla de vendedores) — separado del `activo` boolean que ya existe. Debe distinguir mínimo: pendiente, autorizado, rechazado
- Columna de origen (CRM vs App) — interna, no visible en UI de usuario final ni de admin

**Si alguno de estos no existe todavía en Supabase al momento de construir esta fase, detente y pregúntale a Ricardo — no la simules con datos locales ni la omitas silenciosamente.**

## Alcance

### 1. Registro
- Correo + contraseña, o Google (vía Supabase Auth)
- Selección de rol al registrarse: Comprador / Vendedor-Propietario / Asesor
- Un usuario existente puede agregar un rol adicional más adelante desde su perfil (ej. un comprador que luego quiere ser asesor) — no fuerces un solo rol por cuenta de por vida

### 2. Verificación de identidad (KYC) — wizard de pasos
Inspirado en el flujo de HUHO (4 pasos: Identidad → Domicilio → Constancia de Situación Fiscal [opcional] → Contrato), pero **el detalle exacto de qué se pide por rol lo confirma Ricardo/Dalia antes de construir las pantallas** — no lo des por definido solo con esta nota:

- **Comprador**: INE, constancia de situación fiscal, datos de contacto
- **Vendedor/Propietario**: INE, cédula fiscal, acta de nacimiento, documentación de la propiedad (esto se captura en el flujo de alta de propiedad, no aquí)
- **Asesor**: INE, cédula fiscal, acta de nacimiento, foto de perfil

Paso de identidad debe ofrecer **"Usar INE" o "Usar pasaporte mexicano"**, cada uno pidiendo foto de identificación + selfie de verificación.

### 3. Estatus de autorización
- Cuentas creadas desde el CRM (agentes/vendedores internos de la inmobiliaria ancla): autorizadas automáticamente
- Cuentas creadas desde la App: quedan en estatus "pendiente de autorización" hasta que Mogao (vía CRM) las revise — mostrar badge visible tipo "Verificación pendiente" en el perfil mientras tanto
- Un asesor con verificación pendiente **no debe poder tomar citas** (ver Fase 4), aunque sí puede navegar la app

### 4. Radio de servicio (solo para Asesores)
- Mapa con pin arrastrable + slider de radio en km
- Define qué solicitudes de cita abiertas le van a aparecer en su bandeja (Fase 4) — solo las que caen dentro de su radio configurado

### 5. Toggle de modo (Asesor ↔ Comprador)
- Si la persona tiene ambos roles, mostrar un control para cambiar entre "modo asesor" y "modo comprador"
- **Esto NO cierra sesión.** Es un cambio de contexto de UI/datos mostrados, la sesión de Supabase Auth sigue siendo la misma
- Cambia navegación, home, y qué datos se consultan (fila de `agentes` vs fila de `contactos` del mismo `usuario_id`)

### 6. Perfil
- Nombre, apellido, bio, teléfono, foto
- Área de servicio (solo asesores, ver punto 4)
- Badge de estatus de verificación siempre visible

## Fuera de alcance de esta fase
- Sign-in with Apple (pospuesto, ver CLAUDE.md)
- Documentación de propiedad (vive en la fase de catálogo/vendedor)
- Cualquier lógica de citas o bandeja de solicitudes (Fase 4)

## Criterios de aceptación
- Registro completo funciona con correo/contraseña y con Google
- Un usuario puede tener rol de agente y de cliente a la vez sin duplicar cuenta
- El estatus de autorización se refleja correctamente según el origen (CRM vs App) — verificar con datos de prueba de ambos orígenes
- El wizard de KYC no deja avanzar sin subir los documentos obligatorios de ese rol (los opcionales sí se pueden saltar)
- El toggle de modo cambia la interfaz sin generar un nuevo login (verificar que el token de sesión no cambia al alternar)
- Probar en al menos una pantalla angosta (mobile-first) que nada se corta o desborda
