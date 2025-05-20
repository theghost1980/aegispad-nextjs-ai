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
- manejo de estado de la app? zustand?
- https://posthog.com/ para Product Analytics? https://plausible.io/#pricing
- implementar formulario de datos para el lanzamiento beta.
- implementar la opcion de publicar en HIVE (se habilitará luego del beta como plan premium).
- implementar el modulo de publicacion programada (estudiar opciones sin gastos: backend, cron-job).
- implementar las notificaciones de la app al usuario (¿email?).
- crear un modulo de sugerencias para estilos de escritura.
- colocar el estilo de escritura opcional como parte del prompt de creacion de contenido.

//TODO last steps todo:

¡Totalmente de acuerdo, parcero! Pensar los casos antes de tirar código es la jugada inteligente. Vamos a desmenuzar esos escenarios para ver cómo encaja todo y si necesitamos ajustar el OnboardingAssistant o si una página de login separada tendría más sentido.

Escenarios de Usuario y Flujo Esperado:

Usuario Completamente Nuevo (Nunca ha usado la app):

Acción: Abre la app (ej. va a /editor).
Estado Inicial: isAuthenticated es false. isGeminiKeyConfigured (en page.tsx) es false.
Flujo Esperado (page.tsx):
useEffect principal detecta !isAuthenticated y !isGeminiKeyConfigured.
setIsOnboardingOpen(true).
Flujo Esperado (OnboardingAssistant):
useEffect de initialCheck ve !isAuthenticated y lo lleva al paso "hiveLogin".
Usuario ingresa su nombre de Hive y hace login.
handleHiveLoginAttempt -> login() es exitoso. isAuthenticated se vuelve true.
handleHiveLoginAttempt llama a checkIfApiKeyIsConfigured(). Como es un usuario nuevo en nuestro sistema, esto devuelve false.
OnboardingAssistant va al paso "apiKeyInput".
Usuario ingresa su API key de Gemini.
handleApiKeySubmitAttempt -> saveApiKeyToBackend() es exitoso.
OnboardingAssistant va al paso "report" y luego a "completed".
Llama a onComplete.
Flujo Esperado (page.tsx de nuevo):
handleOnboardingComplete establece setIsOnboardingOpen(false) y setIsGeminiKeyConfigured(true).
canUseEditor se vuelve true. Se muestra el editor.
Conclusión para este caso: El OnboardingAssistant parece manejar bien este flujo completo.
Usuario Existente con Sesión Válida y API Key Configurada (Vuelve a la app):

Acción: Abre la app.
Estado Inicial (useHiveAuth y useGeminiKeyManager cargan desde IndexedDB/backend):
useHiveAuth -> isAuthenticated se vuelve true, hiveUsername se carga.
page.tsx -> useEffect de verifyGeminiKeyConfiguration llama a checkIfApiKeyIsConfigured() que devuelve true. isGeminiKeyConfigured se vuelve true.
Flujo Esperado (page.tsx):
useEffect principal ve isAuthenticated (true) y isGeminiKeyConfigured (true).
userIsConfigured es true.
setIsOnboardingOpen(false) (o se mantiene false).
canUseEditor es true. Se muestra el editor directamente.
Conclusión para este caso: Funciona bien, el OnboardingAssistant no debería ni mostrarse.
Usuario Existente con Sesión Válida PERO SIN API Key Configurada (Quizás la borró o hubo un error al guardarla antes):

Acción: Abre la app.
Estado Inicial:
useHiveAuth -> isAuthenticated es true, hiveUsername se carga.
page.tsx -> useEffect de verifyGeminiKeyConfiguration llama a checkIfApiKeyIsConfigured() que devuelve false. isGeminiKeyConfigured se vuelve false.
Flujo Esperado (page.tsx):
useEffect principal ve isAuthenticated (true) pero isGeminiKeyConfigured (false).
userIsConfigured es false.
setIsOnboardingOpen(true).
Flujo Esperado (OnboardingAssistant):
useEffect de initialCheck ve isAuthenticated (true) pero isApiKeyConfigured (que obtiene de su propia llamada a checkIfApiKeyIsConfigured()) es false.
Lo lleva directamente al paso "apiKeyInput".
Usuario ingresa API key, se guarda, va a "report", "completed", llama a onComplete.
Flujo Esperado (page.tsx de nuevo):
handleOnboardingComplete establece setIsOnboardingOpen(false) y setIsGeminiKeyConfigured(true).
Se muestra el editor.
Conclusión para este caso: El OnboardingAssistant también debería manejar esto bien.
Usuario Cierra Sesión y Vuelve a Iniciar Sesión (con el mismo usuario o uno diferente):

Acción: Clic en "Cerrar Sesión".
Estado (useHiveAuth): isAuthenticated se vuelve false, hiveUsername es null. accessToken y refreshToken se borran de IndexedDB.
Estado (page.tsx):
useEffect de verifyGeminiKeyConfiguration ve !isHiveLoggedIn y establece setIsGeminiKeyConfigured(false).
useEffect principal ve !isAuthenticated y !isGeminiKeyConfigured.
setIsOnboardingOpen(true).
Acción: Usuario intenta iniciar sesión de nuevo (a través del OnboardingAssistant que ahora está visible).
Si es el mismo usuario que antes tenía API key:
OnboardingAssistant -> handleHiveLoginAttempt -> login() exitoso.
handleHiveLoginAttempt llama a checkIfApiKeyIsConfigured(). Esto debería devolver true (porque la clave está en Supabase para ese usuario).
OnboardingAssistant va a "report", "completed", llama a onComplete.
page.tsx -> handleOnboardingComplete -> setIsGeminiKeyConfigured(true), setIsOnboardingOpen(false). Editor se muestra.
Si es un usuario completamente nuevo (que nunca ha guardado API key en Supabase):
OnboardingAssistant -> handleHiveLoginAttempt -> login() exitoso.
handleHiveLoginAttempt llama a checkIfApiKeyIsConfigured(). Esto devuelve false.
OnboardingAssistant va a "apiKeyInput".
...sigue el flujo del Caso 1.
Conclusión para este caso: El OnboardingAssistant parece ser capaz de manejar estos re-logins. El comportamiento que tuviste (pedir login de nuevo después de un login exitoso) es el que estamos tratando de cazar y eliminar con los ajustes recientes.
Análisis de la Necesidad de una Página /login Separada:

Basándonos en estos escenarios, el OnboardingAssistant parece ser lo suficientemente versátil para manejar tanto el flujo de un nuevo usuario como el de un usuario que necesita completar su configuración (como añadir la API key de Gemini).

No veo una necesidad imperiosa de una página /login separada por ahora, siempre y cuando:

El OnboardingAssistant sea robusto: Que maneje correctamente todos estos estados y transiciones sin bucles ni saltos inesperados. Los console.log y las pruebas exhaustivas son clave aquí.
La UX sea clara: Que el usuario entienda por qué se le presenta el asistente (ya sea para login inicial o para completar la configuración).
El acceso a rutas protegidas funcione bien: Si un usuario no autenticado intenta acceder a /editor, se le debe presentar el OnboardingAssistant (o ser redirigido a una página que lo contenga). Tu lógica actual en page.tsx que muestra el Dialog con el OnboardingAssistant si !canUseEditor parece cubrir esto.
¿Cuándo SÍ considerar una página /login separada?

Si quieres una URL canónica para login: tusitio.com/login. Esto puede ser útil para enlaces directos, campañas de marketing, o si el OnboardingAssistant se vuelve demasiado "pesado" para un simple re-login.
Si el flujo de "completar perfil/configuración" se vuelve muy diferente al de un "simple login": Si el OnboardingAssistant tiene muchos pasos que no son relevantes para alguien que solo necesita re-autenticarse, una página de login más simple podría ser mejor.
Requisitos de SEO o estructura del sitio: A veces, tener páginas dedicadas para acciones clave es preferible.
Conclusión del Análisis:

Creo que el OnboardingAssistant tiene el potencial de ser tu principal "portal de entrada". El comportamiento extraño que experimentaste antes (pedir login de nuevo) era probablemente un error en la gestión del estado o en la lógica de transición de pasos, que los últimos ajustes intentaron corregir.

Sugerencia: Sigamos refinando el OnboardingAssistant y la lógica en page.tsx para asegurar que el flujo sea impecable en todos los escenarios que identificamos. Si después de esto, la experiencia de re-login a través del asistente se siente engorrosa o si surgen nuevas necesidades, entonces podemos reconsiderar una página /login dedicada.

¿Qué podemos hacer ahora para probar/mejorar?

Probar el Escenario del Usuario Nuevo: Cierra sesión completamente. Borra los datos de IndexedDB de tu sitio en el navegador (para simular un navegador limpio). Intenta el flujo completo. ¿Te pide login de Hive? ¿Luego te pide la API key de Gemini? ¿Se guarda todo correctamente? ¿Puedes usar el editor?
Probar Cerrar Sesión y Volver a Iniciar Sesión (mismo usuario): Después del paso 1, cierra sesión. Vuelve a iniciar sesión con el mismo usuario. ¿Te lleva directamente al editor (saltándose la petición de API key)?
Logs, Logs, Logs: Mantén los console.log en puntos clave de page.tsx y OnboardingAssistant.tsx (especialmente alrededor de isAuthenticated, isGeminiKeyConfigured, currentStep, y las llamadas a checkIfApiKeyIsConfigured) para ver exactamente qué decisiones se están tomando y en qué orden.
Si el problema del "doble login" o el salto incorrecto al editor persiste, los logs nos dirán dónde se está rompiendo la cadena. ¡Vamos a cazar ese bicho, parcero!
