# Fase 10 — Pulido y publicación

## Objetivo
Dejar Mogao App lista para revisión y publicación en Google Play y (si aplica) App Store.

## Prerrequisitos
- Cuenta de Google Play Console activa (confirmado que Ricardo ya la gestiona)
- Cuenta de Apple Developer Program, si se apunta a iOS (pendiente de confirmar estado con Ricardo)
- Decisión resuelta sobre Sign-in with Apple si va a iOS con login de Google habilitado (ver nota en `CLAUDE.md` — Apple lo exige como alternativa equivalente, Guideline 4.8)
- Todas las fases funcionales (1–7 como mínimo) completas y con QA real hecho, no solo "compila"

## Alcance
- Ícono de app y splash screen con la identidad de marca de Mogao
- Política de privacidad y términos de servicio (confirmar con Ricardo si ya existen o hay que redactarlos — no inventar el contenido legal)
- Configuración de EAS Build para generar builds de producción (Android e iOS)
- Build de pruebas: Internal Testing en Play Console, TestFlight en App Store si aplica
- Metadata de tienda: descripción, capturas de pantalla, categoría
- Envío a revisión

## Fuera de alcance
- Cualquier feature nueva — esta fase es exclusivamente de cierre y publicación

## Criterios de aceptación
- Build de producción instala y corre sin errores en un dispositivo físico real, no solo en simulador
- Ningún dato sensible (API keys, service role key) queda expuesto en el bundle de la app — verificar que solo se usó el `anon key` de Supabase en el cliente
- Checklist de políticas de tienda revisado antes de enviar (evitar rechazo por temas evitables como falta de política de privacidad visible)
