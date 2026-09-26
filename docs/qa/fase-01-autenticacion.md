# QA — Fase 1
**Autenticación · Alta por rol · Perfil**

> Ejecuta cada caso en dispositivo real o emulador. Marca el resultado en la columna R.

**Leyenda:** ✅ Pasa · ❌ Falla · ⚠️ Parcial · ➖ No aplica / pendiente

**Última revisión:** 2026-09-25
**Revisado por:** Ricardo
**Estado general:** ✅ Completa (parcial — ver fuera de alcance)

---

## ⚠️ Bloqueadores previos al QA

| # | Pendiente | Responsable |
|---|---|---|
| B1 | Función RPC `set_initial_rol` creada en Supabase | ✅ Aplicado |

---

## Fuera de alcance de este QA (pendiente de construir)

- KYC / wizard de documentos de identidad
- Radio de servicio para asesores
- Toggle modo Asesor ↔ Comprador
- Google OAuth (placeholder — muestra alerta)
- Recuperar contraseña (no construido)

---

## Preparación — Datos de prueba necesarios

| Cuenta | Email | Contraseña | Rol | Notas |
|---|---|---|---|---|
| Comprador nuevo | qa-comprador@test.com | Test123456 | cliente | Sin procesos ni citas |
| Asesor autorizado | qa-agente@test.com | Test123456 | agente | `estatus_autorizacion = 'autorizado'`, origen CRM |
| Asesor pendiente | qa-agente-pend@test.com | Test123456 | agente | `estatus_autorizacion = 'pendiente'`, origen app |
| Vendedor pendiente | qa-vendedor@test.com | Test123456 | vendedor | `estatus_autorizacion = 'pendiente'`, origen app |

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

---

## Bloque 3 — Login ✅

| # | Caso | Pasos | Resultado esperado | R |
|---|---|---|---|---|
| 3.1 | Login con credenciales válidas | Ingresar email y contraseña correctos → Entrar | Redirige a tabs, sin error | ✅ |
| 3.2 | Login credenciales incorrectas | Email o contraseña equivocados → Entrar | Alerta con mensaje de error, sigue en login | ✅ |
| 3.3 | Campos vacíos | Tocar Entrar sin llenar | Alerta "Campos requeridos" | ✅ |
| 3.4 | Show/hide contraseña | Tocar ícono de ojo | Texto alterna entre oculto y visible | ✅ |
| 3.5 | Logo de Mogao Connect visible | Abrir pantalla de login | Logo local carga correctamente en header teal | ✅ |
| 3.6 | Botón Google muestra alerta | Tocar "Continuar con Google" | Alerta informativa (pendiente de configuración), no crash | ✅ |
| 3.7 | Link a registro | Tocar "Regístrate" | Navega a pantalla de registro | ✅ |
| 3.8 | Olvidé contraseña | Tocar "¿Olvidaste tu contraseña?" | Navega a pantalla o muestra alerta "próximamente" sin crash | ➖ |
| 3.9 | Teclado no tapa el formulario | Enfocar campo de contraseña | KeyboardAvoidingView funciona, formulario accesible | ✅ |

---

## Bloque 4 — Perfil

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

---

## Bugs encontrados

| # | Bloque | Descripción | Severidad | Estado |
|---|---|---|---|---|
| — | — | — | — | — |

> Severidad: 🔴 Crítico (bloquea flujo) · 🟡 Medio (afecta UX) · 🟢 Menor (cosmético)

---

## Notas generales

- El rol visual en tabs y pantallas siempre muestra la vista "Comprador" por ahora — la diferenciación de UI por rol es alcance de Fases 3–5
- Verificar en Supabase que `usuarios.rol` y la fila en `agentes`/`vendedores_cuenta` existen correctamente después del registro
- Caso 4.4 (asesor autorizado) requiere cuenta creada desde el CRM — marcar ➖ hasta tener ese dato de prueba
