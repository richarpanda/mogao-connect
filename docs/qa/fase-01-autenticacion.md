# QA — Fase 1
**Autenticación · Alta por rol · Perfil**

> Ejecuta cada caso en dispositivo real o emulador. Marca el resultado en la columna R.

**Leyenda:** ✅ Pasa · ❌ Falla · ⚠️ Parcial · ➖ No aplica / pendiente

**Última revisión:** 2026-09-25
**Revisado por:** Ricardo
**Estado general:** ⚠️ Parcial — funcionalidad completa, pendiente de pruebas en Bloques 3.8, 5, 6 y 7

---

## ⚠️ Bloqueadores previos al QA

| # | Pendiente | Responsable |
|---|---|---|
| B1 | Función RPC `set_initial_rol` creada en Supabase | ✅ Aplicado |
| B2 | Migración `agentes.radio_km / radio_lat / radio_lng` | ✅ Aplicado 2026-09-25 |

---

## Fuera de alcance de este QA

> KYC y Google OAuth movidos a Fase 1.2 (`docs/features/01.2-kyc-y-google-oauth.md`)

> **Toggle modo Asesor ↔ Comprador (Bloque 8):** la UI del toggle existe, pero agregar un segundo rol desde la app aún no está construido. Sin ese flujo no hay forma de probar el toggle sin insertar datos manualmente en Supabase. Se incorpora al QA cuando se construya el flujo "Agregar rol" en perfil.

---

## Preparación — Datos de prueba necesarios

| Cuenta | Email | Contraseña | Rol | Notas |
|---|---|---|---|---|
| Comprador nuevo | qa-comprador@test.com | Test123456 | cliente | Sin procesos ni citas |
| Asesor autorizado | qa-agente@test.com | Test123456 | agente | `estatus_autorizacion = 'autorizado'`, origen CRM |
| Asesor pendiente | qa-agente-pend@test.com | Test123456 | agente | `estatus_autorizacion = 'pendiente'`, origen app |
| Vendedor pendiente | qa-vendedor@test.com | Test123456 | vendedor | `estatus_autorizacion = 'pendiente'`, origen app |
| Usuario multi-rol | qa-multrol@test.com | Test123456 | agente | Fila en `agentes` Y en `contactos` con mismo `usuario_id` |

---

## Bloque 1 — Splash y arranque

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 1.1 | Splash se muestra al abrir | Tocar ícono desde pantalla de inicio | GIF de animación sobre fondo verde (#0E3B36) ocupa toda la pantalla | ✅ |
| 1.2 | Splash da paso al login | Esperar a que termine el GIF | Fade-out suave → pantalla de login sin parpadeo blanco | ✅ |
| 1.3 | Fondo del splash nativo es verde | Forzar cierre + reabrirla rápido | El splash nativo (antes del JS) también muestra fondo verde, no blanco | ✅ |
| 1.4 | Sesión activa salta directo a tabs | Abrir app con sesión ya iniciada | Splash → tabs directamente, sin pasar por login | ➖ |

---

## Bloque 2 — Registro y selección de rol

> Los casos 2.7–2.10 solo aplican con "Confirm email" activo en Supabase — marcar ➖ si está desactivado.

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 2.1 | Registro exitoso como comprador | Registro con email nuevo → rol Comprador → Continuar | Usuario creado, redirige a tabs, `usuarios.rol = 'cliente'` en Supabase | ✅ |
| 2.2 | Registro exitoso como asesor | Registro → rol Asesor independiente → Continuar | Fila en `agentes` creada con `estatus_autorizacion = 'pendiente'` y `origen = 'app'` | ✅ |
| 2.3 | Registro exitoso como vendedor | Registro → rol Vendedor/Propietario → Continuar | Fila en `vendedores_cuenta` creada con `estatus_autorizacion = 'pendiente'`; `usuarios.rol = 'vendedor'` | ✅ |
| 2.4 | Validación de campos vacíos | Intentar continuar sin llenar campos | Alerta "Campos requeridos" — no navega | ✅ |
| 2.5 | Contraseña corta | Ingresar contraseña de 4 caracteres | Alerta "Contraseña muy corta" | ✅ |
| 2.6 | Email duplicado | Registrar con email ya existente | Alerta con mensaje de error, no falla silenciosamente | ✅ |
| 2.7 | Verificación por correo | Registrar con "Confirm email" activo | Redirige a pantalla OTP, no a role-select | ➖ |
| 2.8 | Código OTP correcto | Registrar → recibir código → ingresarlo | Verificación exitosa → redirige a role-select | ➖ |
| 2.9 | Código OTP incorrecto | Ingresar código erróneo | Alerta "Código inválido", cajas se limpian | ➖ |
| 2.10 | Reenvío de código (countdown) | Esperar 60 s en pantalla OTP | Botón "Reenviar" aparece al llegar a 0, reenvío funciona | ➖ |
| 2.11 | Role-select diseño | Abrir pantalla de selección de rol | Header teal con logo, tres cards con íconos, la seleccionada se pone verde con checkmark dorado | ✅ |
| 2.12 | No se puede continuar sin seleccionar rol | Tocar Continuar sin seleccionar | Botón deshabilitado (teal claro), no navega | ✅ |
| 2.13 | Botón "Crear cuenta" es teal | Pantalla de registro | Botón principal usa `bg-mogao-teal`, no azul genérico | ➖ |
| 2.14 | Link "Inicia sesión" es dorado | Pantalla de registro | Link inferior usa color `mogao-gold` | ➖ |

---

## Bloque 3 — Login

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 3.1 | Login con credenciales válidas | Ingresar email y contraseña correctos → Entrar | Redirige a tabs, sin error | ✅ |
| 3.2 | Login credenciales incorrectas | Email o contraseña equivocados → Entrar | Alerta con mensaje de error, sigue en login | ✅ |
| 3.3 | Campos vacíos | Tocar Entrar sin llenar | Alerta "Campos requeridos" | ✅ |
| 3.4 | Show/hide contraseña | Tocar ícono de ojo | Texto alterna entre oculto y visible | ✅ |
| 3.5 | Logo de Mogao Connect visible | Abrir pantalla de login | Logo local carga correctamente en header teal | ✅ |
| 3.6 | Botón Google muestra alerta | Tocar "Continuar con Google" | Alerta informativa (pendiente de configuración), no crash | ✅ |
| 3.7 | Link a registro | Tocar "Regístrate" | Navega a pantalla de registro | ✅ |
| 3.8 | Olvidé contraseña — navega | Tocar "¿Olvidaste tu contraseña?" | Navega a pantalla `forgot-password` (fondo teal + card cream) | ➖ |
| 3.9 | Teclado no tapa el formulario | Enfocar campo de contraseña | KeyboardAvoidingView funciona, formulario accesible | ✅ |

---

## Bloque 4 — Perfil (display)

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 4.1 | Perfil carga datos correctos | Login como comprador → tab Perfil | Nombre, email y badge de rol "Comprador" visibles | ✅ |
| 4.2 | Avatar con inicial visible | Cualquier usuario | Círculo teal con inicial del nombre, no invisible | ✅ |
| 4.3 | Badge "Verificación pendiente" — asesor | Login como asesor pendiente | Badge amarillo "Verificación pendiente" con texto explicativo | ✅ |
| 4.4 | Badge "Verificado" — asesor autorizado | Login como asesor autorizado (origen CRM) | Badge verde "Verificado" | ➖ |
| 4.5 | Badge "Verificación pendiente" — vendedor | Login como vendedor pendiente | Badge amarillo visible (mismo estilo que asesor) | ✅ |
| 4.6 | Sin badge para comprador | Login como comprador | No aparece ningún badge de verificación | ✅ |
| 4.7 | Cerrar sesión | Tocar "Cerrar sesión" → confirmar | Sesión cerrada, redirige a login | ✅ |
| 4.8 | Cerrar sesión — cancelar | Tocar "Cerrar sesión" → Cancelar | Dialog se cierra, sigue en perfil | ✅ |
| 4.9 | Opción "Radio de servicio" solo para asesores | Login como asesor → tab Perfil | Menú muestra opción "Radio de servicio"; no aparece para comprador ni vendedor | ➖ |
| 4.10 | KYC marcado como "Próximamente" | Cualquier usuario → tab Perfil | Opción KYC visible pero deshabilitada con texto "Próximamente" | ➖ |

---

## Bloque 5 — Recuperar contraseña ✅

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 5.1 | Navega desde login | Tocar "¿Olvidaste tu contraseña?" | Abre pantalla forgot-password (header teal, card cream) | ✅ |
| 5.2 | Campo vacío | Tocar "Enviar enlace" sin email | Alerta "Campo requerido" | ✅ |
| 5.3 | Email válido enviado | Ingresar email registrado → Enviar enlace | Card de confirmación verde con el email ingresado | ✅ |
| 5.4 | Botón volver en confirmación | Tocar "Volver al inicio de sesión" tras envío | Regresa a login | ✅ |
| 5.5 | Botón volver en header | Tocar flecha volver antes de enviar | Regresa a login | ✅ |

---

## Bloque 6 — Editar perfil ✅

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 6.1 | Abre desde menú | Perfil → "Editar perfil" | Modal sube desde abajo con nombre y teléfono pre-llenados | ✅ |
| 6.2 | Nombre vacío | Borrar nombre → Guardar | Alerta "Campo requerido", no guarda | ✅ |
| 6.3 | Guardar cambios | Editar nombre/teléfono → Guardar | Alert "Perfil actualizado", cierra modal, perfil refleja cambio | ✅ |
| 6.4 | Cancelar | Tocar "Cancelar" sin guardar | Modal cierra, datos sin cambiar | ✅ |

---

## Bloque 7 — Cambiar contraseña

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 7.1 | Abre desde menú | Perfil → "Cambiar contraseña" | Modal sube desde abajo con tres campos de contraseña | ✅ |
| 7.2 | Campos vacíos | Tocar "Actualizar" sin llenar | Alerta "Campos requeridos" | ✅ |
| 7.3 | Contraseña actual incorrecta | Ingresar contraseña equivocada | Alerta "La contraseña actual es incorrecta" | ✅ |
| 7.4 | Nueva contraseña corta | Nueva contraseña < 6 caracteres | Alerta "Contraseña muy corta" | ✅ |
| 7.5 | Confirmación no coincide | Nueva ≠ confirmación | Alerta "No coinciden" | ✅ |
| 7.6 | Cambio exitoso | Datos correctos → Actualizar | Alert "Contraseña actualizada", cierra modal | ✅ |
| 7.7 | Show/hide en los tres campos | Tocar íconos de ojo | Cada campo alterna visibilidad independientemente | ✅ |

---

## Bloque 8 — Radio de servicio (solo asesores)

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 8.1 | Abre desde menú | Login como asesor → Perfil → "Radio de servicio" | Modal sube con valor de radio actual (default 10 km) | ➖ |
| 8.2 | Incrementar radio | Tocar "+" varias veces | Radio aumenta en 5 km por toque; máximo 100 | ➖ |
| 8.3 | Decrementar radio | Tocar "−" varias veces | Radio baja en 5 km por toque; mínimo 1 | ➖ |
| 8.4 | Botones deshabilitados en extremos | Radio = 100 → tocar "+"; Radio = 1 → tocar "−" | Botón correspondiente aparece en gris y no reacciona | ➖ |
| 8.5 | Guardar radio | Ajustar radio → Guardar | Alert "Guardado", modal cierra, columna `agentes.radio_km` actualizada en Supabase | ➖ |
| 8.6 | No visible para comprador o vendedor | Login como comprador o vendedor → Perfil | Opción "Radio de servicio" no aparece en el menú | ➖ |

---

## Bugs encontrados

| # | Bloque | Descripción | Severidad | Estado |
|---|---|---|---|---|
| B3 | 2 | Registro como vendedor falla con error 42P10 — falta `UNIQUE` constraint en `vendedores_cuenta.usuario_id`. SQL: `ALTER TABLE vendedores_cuenta ADD CONSTRAINT vendedores_cuenta_usuario_id_key UNIQUE (usuario_id);` | 🔴 Crítico | Pendiente DB |
| B4 | 6, 8 | Cambios en perfil y radio no persisten — políticas RLS de `usuarios` y `agentes` no tienen UPDATE. SQL en docs del sprint. | 🔴 Crítico | Pendiente DB |

> Severidad: 🔴 Crítico (bloquea flujo) · 🟡 Medio (afecta UX) · 🟢 Menor (cosmético)

---

## Notas generales

- Caso 4.4 (asesor autorizado) requiere cuenta creada desde el CRM — marcar ➖ hasta tener ese dato de prueba
- Bloques 5, 6, 7 y 8 requieren correr los dos SQL de RLS antes de probar (ver bugs B3 y B4 abajo)
