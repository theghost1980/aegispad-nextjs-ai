# 🧠 AegisPad – Roadmap de Producto y Técnico

> Este documento define el roadmap de AegisPad, separando claramente prioridades de MVP/Beta, mejoras de UX, integraciones Web3, arquitectura técnica y futuras líneas de crecimiento.

---

## 1️⃣ Prioridades MVP & Beta

* [ ] Preparar lanzamiento beta:

  * [ ] Implementar formulario de captura de datos para usuarios beta.
  * [ ] Mostrar mensajes claros de estado beta en la UI.
  * [ ] Deshabilitar la publicación directa en HIVE durante beta (feature premium post-beta).

* [ ] Módulo de publicación programada:

  * Investigar opciones sin costo (backend propio + cron jobs).
  * Evaluar Supabase + Edge Functions vs VPS tradicional.

* [ ] Notificaciones de la aplicación:

  * Definir canal inicial (email).
  * Evaluar notificaciones in-app en fases futuras.

---

## 2️⃣ Accesibilidad & Experiencia de Usuario (UX)

### Control por Voz

* [ ] Crear post guía (aegispad o theghost.test) explicando cómo usar el control de voz antes de lanzar el feature.
* [ ] Agregar información en la homepage destacando accesibilidad (ayuda a personas con necesidades especiales).
* [ ] Agregar configuración de control de voz en el perfil del usuario.
* [ ] Detectar navegador:

  * Mostrar mensaje si el usuario no está usando Chrome.

### UX General

* [ ] Mejorar estilos responsive.
* [ ] Soporte mobile completo.
* [ ] Agregar tests para flujos mobile.

---

## 3️⃣ Creación de Contenido & Mejoras con IA

* [ ] Módulo de sugerencias de estilos de escritura.
* [ ] Permitir seleccionar estilo de escritura e incluirlo como parte del prompt de creación de contenido.
* [ ] Asistencia para títulos mediante IA.
* [ ] Asistencia para imágenes:

  * Sugerir imágenes según contenido, título y etapa del artículo.
  * Definir reglas claras (ej. no sugerir imágenes en ciertas fases).

### Asistencia Avanzada de Tags

* [ ] Mejorar componente `TagInput`.
* [ ] Durante la revisión de artículos:

  * Opción para incluir tags en el prompt antes de ejecutar la revisión.
  * Persistir esta información en `localStorage` para el paso de revisión final.

---

## 4️⃣ Medios & Integraciones Externas

### Proveedores de Imágenes

* [ ] Integrar API de Pexels.
* [ ] Investigar API de Unsplash (licencias y límites).

### Video

* [ ] Permitir incrustar videos de YouTube.
* [ ] Investigar funcionalidad de búsqueda de videos.

### Compartir Contenido

* [ ] Integraciones de compartir en:

  * Facebook, Instagram, Twitter/X, LinkedIn, Telegram.
  * Discord (canales preconfigurados).
* [ ] Evaluar uso de IA para adaptar contenido y formatos según plataforma.

---

## 5️⃣ Integraciones Web3 & Ecosistema Hive

* [ ] Integrar aioha:

  * [https://github.com/aioha-hive/aioha](https://github.com/aioha-hive/aioha)

### Inteligencia Avanzada de Tags (HiveSQL)

* [ ] Conectar con HiveSQL para:

  * Buscar nuevos tags.
  * Tags usados recientemente por el usuario.
  * Análisis de rendimiento de tags:

    * Promedio de votos.
    * Tags más votados por rango de fechas.

---

## 6️⃣ Herramientas de Administración

* [ ] Paneles exclusivos para admins:

  * Revisión y traducción de contenidos.
  * Dashboards administrativos.

* [ ] Herramientas de creación de contenido solo para admins.

---

## 7️⃣ Soporte Mobile & Cross-Platform

* [ ] Mejorar UI/UX en mobile.
* [ ] Corregir estilos específicos.
* [ ] Agregar cobertura de tests en dispositivos móviles.

---

## 8️⃣ Growth, Analítica & Monetización

* [ ] Analítica de producto:

  * Evaluar PostHog.
  * Evaluar Plausible.

* [ ] Módulo de identificación de usuarios bilingües:

  * Usar HiveSQL para localizar usuarios que publican en dos idiomas.
  * Enviar invitaciones a AegisPad con:

    * Guía detallada.
    * Incentivos futuros (ej. upvotes).

---

## 9️⃣ Arquitectura Técnica & Backend

* [ ] Migrar al nuevo Google Gen AI SDK:

  * Reemplazar `@google/generative-ai` (deprecado).
  * Integrar Genkit.
  * Fecha límite SDK antiguo: **31 de agosto de 2025**.

* [ ] Migrar generación de imágenes a Vertex AI:

  * Usar `@google-cloud/aiplatform`.
  * Configurar credenciales de cuenta de servicio (`GOOGLE_APPLICATION_CREDENTIALS`).

* [ ] Evaluar manejo de estado global:

  * Zustand vs solución actual.

---

## 🔟 Integración con API de Pexels

### Objetivo

Permitir a los usuarios buscar e insertar imágenes desde Pexels.com.

### Límites de la API

* 200 requests por hora.
* 20.000 requests por mes.

### Estrategia de Gestión

* Caching agresivo en backend (Supabase).
* Rate limiting a nivel backend.
* Debounce en frontend (300–500ms).
* Paginación y validación de búsquedas vacías.
* Mensajes claros en UI al alcanzar límites.

### Próximos Pasos

* Definir esquemas de tablas:

  * `pexels_api_cache`
  * `api_usage_tracking`

