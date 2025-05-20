Importante: //TODO

To add to all content:

- from now on we are using MEMO to encode/decode apikey.
- posting will be used only to login and to post/comment:
  - this way we can suggest to the user to set MEMO sign on this site as frecuent to avoid
    the annoying resuests to decode the key on any use of gemini ai!

# AegisPad Project TODOs

- [ ] **Migrar al nuevo Google Gen AI SDK:** Investigar y migrar todas las interacciones con la API de Gemini desde el SDK `@google/generative-ai` (actualmente depreciado) al nuevo SDK unificado recomendado por Google. Esto incluye las rutas de validación de API key y la integración con Genkit.

  - Referencia: README de `@google/generative-ai` que indica la depreciación y la existencia de un nuevo SDK.
  - Fecha límite de soporte del SDK antiguo: 31 de agosto de 2025.

- [ ] **Implementar conteo de tokens para llamadas a la API de IA:** Añadir lógica para contar los tokens utilizados en cada llamada a la API de Gemini (tanto para la generación como para la revisión de contenido) dentro de las rutas API correspondientes. Esto podría ser útil para el seguimiento del uso, la gestión de cuotas y la optimización de costos.
- [ ] **Implementar Generación de Imágenes con Vertex AI:** Migrar la ruta `/api/ai/generate-image` para usar el SDK de Vertex AI (`@google-cloud/aiplatform`) y la autenticación de cuenta de servicio de Google Cloud. Esto incluye configurar las credenciales (`GOOGLE_APPLICATION_CREDENTIALS`, `GCP_PROJECT_ID`) y ajustar la lógica de llamada al modelo "Imagen" específico.
- manejo de estado de la app? zustand?
- https://posthog.com/ para Product Analytics? https://plausible.io/#pricing
- implementar formulario de datos para el lanzamiento beta.
- implementar la opcion de publicar en HIVE (se habilitará luego del beta como plan premium).
- implementar el modulo de publicacion programada (estudiar opciones sin gastos: backend, cron-job).
- implementar las notificaciones de la app al usuario (¿email?).
- crear un modulo de sugerencias para estilos de escritura.
- colocar el estilo de escritura opcional como parte del prompt de creacion de contenido.
