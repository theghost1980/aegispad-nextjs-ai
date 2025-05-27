Importante: //TODO

## Refactor: Centralized Master API Key for AI Services [HIGH PRIORITY]

**Objective:** Transition from per-user API keys to a single, server-managed master API key for all AI service requests (e.g., Gemini) to simplify user experience.

- **Master Key Storage:**
  - Store the master API key securely as a server-side environment variable (e.g., `MASTER_GEMINI_API_KEY`).
- **Backend API Route Modifications (e.g., `/api/ai/*`):**
  - Remove logic for fetching/using individual user API keys.
  - Read the master API key from `process.env`.
  - Initialize AI SDKs (e.g., `GoogleGenerativeAI`) with the master key.
  - Continue to authenticate users to obtain `profileId` for token tracking and authorization.
- **`useHiveAuth` Hook Refactor:**
  - Remove all state and functions related to managing individual user API keys (e.g., `geminiApiKey`, `isGeminiKeyValid`, `fetchUserApiKey`, `saveUserApiKey`).
  - Retain core user authentication logic (`isAuthenticated`, `user`, `userRole`, `authenticatedFetch` to backend).
- **User Interface (UI) Changes:**
  - Eliminate all UI components where users would input, manage, or validate their personal API keys (e.g., from Profile page, specific modals).
  - Remove any conditional rendering or feature enablement based on a user's API key validity.
  - Update error messages related to AI service failures to be generic (e.g., "AI service unavailable" instead of "Invalid API key").
- **Database (Supabase):**
  - Fields in the `profiles` table (or similar) related to individual user API keys (e.g., `gemini_api_key`) will no longer be actively used (read from or written to).
  - No immediate schema changes required, but these fields become obsolete.
- **Token Tracking (Existing TODO):**
  - The existing TODO for implementing token counting per user becomes even more critical for cost management and monitoring.
- **Security & Cost Management:**
  - Emphasize the security of the master API key.
  - Acknowledge that all AI API costs will be centralized to the application owner.
  - Consider implementing server-side rate limiting per user to protect the master key and manage usage.

To add to all content:

- Add tokens counts from gemini requests watch: C:\Users\saturno\Downloads\HIVE-Projects\hive-markdown\TODO-ADD-AEGISPAD\TODO Tokens.txt

- from now on we are using MEMO to encode/decode apikey.
- posting will be used only to login and to post/comment:

  - this way we can suggest to the user to set MEMO sign on this site as frecuent to avoid
    the annoying resuests to decode the key on any use of gemini ai!

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

## Clean this up MAN!! too many comments we must be "professionals YO"

# AegisPad Project TODOs

- [ ] **Migrar al nuevo Google Gen AI SDK:** Investigar y migrar todas las interacciones con la API de Gemini desde el SDK `@google/generative-ai` (actualmente depreciado) al nuevo SDK unificado recomendado por Google. Esto incluye las rutas de validación de API key y la integración con Genkit.

  - Referencia: README de `@google/generative-ai` que indica la depreciación y la existencia de un nuevo SDK.
  - Fecha límite de soporte del SDK antiguo: 31 de agosto de 2025.

- [ ] **Implementar conteo de tokens para llamadas a la API de IA:** Añadir lógica para contar los tokens utilizados en cada llamada a la API de Gemini (tanto para la generación como para la revisión de contenido) dentro de las rutas API correspondientes. Esto podría ser útil para el seguimiento del uso, la gestión de cuotas y la optimización de costos.
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
