# Fase 6 — Mensajería in-app

## Objetivo
Chat dentro de la app, inspirado en el patrón de HUHO: pestañas separadas por tipo de contraparte (Asesores, Clientes, Soporte).

## Prerrequisitos de esquema
- **No existe todavía tabla de mensajes/conversaciones en el esquema.** Proponer diseño a Ricardo (ej. `conversaciones` + `mensajes`, con participantes y tipo) antes de construir — no inventar la estructura ni asumir que Supabase Realtime está configurado sin confirmarlo.

## Alcance
- Lista de conversaciones con pestañas: Asesores / Clientes / Soporte
- Vista de conversación individual con envío/recepción de mensajes
- Buscador de conversaciones
- Botón para iniciar una conversación nueva
- Evaluar Supabase Realtime (canales) para mensajes en vivo vs. polling — proponer la opción más simple que funcione bien en Expo antes de sobre-diseñar

## Fuera de alcance
- Llamadas de voz/video (no mencionado en ningún requerimiento de negocio hasta ahora — no construir sin que se pida explícitamente)
- Mensajería con archivos adjuntos, salvo que Ricardo lo confirme como necesario para esta fase

## Criterios de aceptación
- Un asesor solo ve conversaciones donde es participante (RLS, no solo filtro de frontend)
- Los mensajes nuevos llegan sin necesidad de recargar la pantalla manualmente
- Las tres pestañas filtran correctamente por tipo de contraparte
