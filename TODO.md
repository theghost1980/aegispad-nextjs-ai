Importante: //TODO

- agregar configuracion para control de voz en profile + mensaje si estan usando otro browser diferente de chrome.

- integrate https://github.com/aioha-hive/aioha

- investigar para usar apis de:

  - https://unsplash.com/
  - https://www.pexels.com/

- podemos incluir videos desde youtube y una funcion para buscar?

- agregar funciones de compartir con:

  - fb, instagram, telegram, twitter, linkedin
  - discord en canales preconfigurados
  - en este punto debemos mirar en que usamos la IA para modificar los contenidos, formatos etc.

- //TODO admins:

  - can create: C:\Users\saturno\Downloads\HIVE-Projects\hive-markdown\TODO-ADD-AEGISPAD
  - add a new panel like revise/translate only with admins
  - admin dashboards, etc

- add mobile support for aegis, fix styles, etc + test

- Add assistance about:

  - tags:
    - TagInput part: IP
    - When revising article:
      - should be an option to be included in the revision before doing it so the prompt will change + add this data into localstorage so it can be retrieved on final review.
  - title
  - images to add when certain conditions are meet:
    - no imagen when reaching certain point or stage?
    - suggest images tags, categories depending on the content/titles
  - Real TAG Assistance to the hiver:
    - connect to be-hivesql and if available:
      - allow to search:
        - new tags
        - recently used by user
        - tags within a date range to:
          - know avg votes values by tags
          - most voted tags and so on....

- Add a module to find & target dualinguals:
  - this module will use hivesql to perfom efefctive searches
    - locate people who posts in 2 languages and leave an invitation to the app.
    - sharing info:
      -a detailed guide
      -in the future giving an upvote as well
  - it can be a module that only works if a hivesql search was made.

## Clean this up MAN!! too many comments we must be "professionals YO"

# AegisPad Project TODOs

- [ ] **Migrar al nuevo Google Gen AI SDK:** Investigar y migrar todas las interacciones con la API de Gemini desde el SDK `@google/generative-ai` (actualmente depreciado) al nuevo SDK unificado recomendado por Google. Esto incluye las rutas de validación de API key y la integración con Genkit.

  - Referencia: README de `@google/generative-ai` que indica la depreciación y la existencia de un nuevo SDK.
  - Fecha límite de soporte del SDK antiguo: 31 de agosto de 2025.

- [ ] **Implementar Generación de Imágenes con Vertex AI:** Migrar la ruta `/api/ai/generate-image` para usar el SDK de Vertex AI (`@google-cloud/aiplatform`) y la autenticación de cuenta de servicio de Google Cloud. Esto incluye configurar las credenciales (`GOOGLE_APPLICATION_CREDENTIALS`, `GCP_PROJECT_ID`) y ajustar la lógica de llamada al modelo "Imagen" específico.
- add pexels? https://www.pexels.com/api/documentation/#client_libraries
- manejo de estado de la app? zustand?
- https://posthog.com/ para Product Analytics? https://plausible.io/#pricing
- implementar formulario de datos para el lanzamiento beta.
- implementar la opcion de publicar en HIVE (se habilitará luego del beta como plan premium).
- implementar el modulo de publicacion programada (estudiar opciones sin gastos: backend, cron-job).
- implementar las notificaciones de la app al usuario (¿email?).
- crear un modulo de sugerencias para estilos de escritura.
- colocar el estilo de escritura opcional como parte del prompt de creacion de contenido.

## Integración con Pexels API

- **Objetivo:** Permitir a los usuarios buscar e insertar imágenes desde Pexels.com.
- **Consideraciones Clave:** Gestión estricta de los límites de la API de Pexels (200 reqs/hora, 20k reqs/mes).

- **Estrategias de Gestión de Límites:**
  - **Caching Agresivo en el Servidor (Supabase):**
    - Crear tabla `pexels_api_cache` (columnas: `search_query_hash`, `pexels_response` (JSONB), `cached_at`, `expires_at`).
    - Revisar caché antes de llamar a Pexels.
    - Definir política de expiración (ej. 1-6 horas).
  - **Rate Limiting en Backend Propio (Supabase):**
    - Crear tabla `api_usage_tracking` (columnas: `api_name`, `period_start_hour`, `hourly_requests`, `period_start_month`, `monthly_requests`).
    - Consultar y actualizar contadores antes y después de cada llamada a Pexels.
    - Devolver error 429 si se superan los umbrales (con margen de seguridad).
  - **Debounce en el Frontend:**
    - Esperar a que el usuario deje de escribir (300-500ms) antes de enviar la solicitud de búsqueda.
  - **Optimización de Solicitudes:**
    - Usar paginación (`per_page`).
    - Evitar búsquedas vacías.
  - **Interfaz de Usuario Informativa:**
    - Mostrar mensajes amigables si se alcanzan los límites.
- **Próximos Pasos (Diseño):**
  - Definir esquemas detallados para las tablas `pexels_api_cache` y `api_usage_tracking` en Supabase.
  - Diseñar la lógica del endpoint del servidor para interactuar con estas tablas y la API de Pexels.
