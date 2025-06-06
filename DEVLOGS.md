## 2025-06-06

### ✨ Mejoras en la Experiencia de Usuario y Funcionalidad

- **Avatar de Usuario desde Perfil de Hive:**
  - **API de Login (`login/route.ts`):** Se actualizó para extraer la URL de la imagen de perfil (`profile_image`) del `posting_json_metadata` de la cuenta de Hive del usuario. Si se encuentra una URL válida, se incluye como `profile_image_url` en la respuesta de la API.
  - **Hook `useHiveAuth.ts`:**
    - Se añadió un nuevo estado `profileImageUrl` para almacenar la URL de la imagen de perfil del usuario.
    - Se implementó la carga y guardado de `profileImageUrl` en IndexedDB (bajo la clave `currentUserProfileImageUrl`) para persistencia entre sesiones.
    - Se asegura la limpieza de `profileImageUrl` (estado e IndexedDB) al cerrar sesión.
    - El hook ahora devuelve `profileImageUrl` para su uso en componentes.
  - **Componente `UserAvatarDropdown.tsx`:**
    - Ahora utiliza `profileImageUrl` del hook `useHiveAuth`.
    - Si `profileImageUrl` está disponible, se renderiza un componente `<AvatarImage>` con la imagen del perfil del usuario.
    - El `<AvatarFallback>` (con las iniciales del usuario) se mantiene como respaldo si no hay imagen o esta no carga.
  - **Componente `Avatar.tsx` (UI):** Se añadió la clase `object-cover` al componente `AvatarImage` para asegurar que la imagen de perfil se muestre con una relación de aspecto 1:1, cubriendo el área designada sin distorsionarse.
- **Ajustes de Interfaz de Usuario (UI):**
  - **Header (`header.tsx`):** Se añadió un pequeño padding (`pr-2`) al contenedor del `UserAvatarDropdown` para evitar que quede pegado al borde derecho de la cabecera.
- **Control de Voz (`use-voice-actions-handler.ts` y `editor/page.tsx`):**
  - Se pasó el `userRole` al hook `useVoiceActionsHandler`.
  - Se modificó la lógica del comando de voz `CMD_CREATE_ARTICLE`: si el usuario no tiene el rol "admin", en lugar de iniciar el panel de creación de artículo, se insertará un emoticono `:)` en el área de texto del editor.

### 🧹 Limpieza y Refactorización

- **Eliminación de Comentarios:**
  - Se eliminaron comentarios innecesarios del archivo `HomePage` (`app/[locale]/page.tsx`).
  - Se discutieron y proporcionaron expresiones regulares para facilitar la búsqueda y eliminación de comentarios en todo el proyecto, con la excepción de los comentarios `//TODO`.

### 🛠️ Mejoras

- **Consistencia en la Obtención de Metadatos:** Se especificó el uso de `posting_json_metadata` para la imagen de perfil, que es comúnmente donde los usuarios de Hive almacenan esta información a través de interfaces como PeakD o Ecency.

---

## 2025-06-05

### 🌍 Internacionalización y Mejoras en Comandos de Voz

- **Comandos de Voz Multilingües (`VOICE_COMMANDS` en `constants.ts`):**
  - Se reestructuró `VOICE_COMMANDS` para que la propiedad `keywords` sea un objeto `Record<string, string[]>`, permitiendo definir palabras clave específicas para cada locale (ej. `"en-US"`, `"es-ES"`, `"fr-FR"`, `"pt-BR"`).
  - Se añadieron las traducciones de palabras clave para los comandos principales en francés (`fr-FR`) y portugués de Brasil (`pt-BR`).
- **Mapa de Puntuación por Voz (`VOICE_PUNCTUATION_MAP` en `constants.ts`):**
  - Se actualizaron las claves principales del mapa de `en`, `es`, etc., a los códigos de locale completos (ej. `"en-US"`, `"es-ES"`) para mayor consistencia y especificidad.
- **Lógica de Detección de Comandos y Puntuación Actualizada:**
  - En `useVoiceControl.ts`: Se actualizó la lógica de detección de comandos para utilizar la nueva estructura multilingüe de `VOICE_COMMANDS`, buscando coincidencias según el `currentLanguage` del reconocimiento de voz y aplicando fallbacks (idioma base, idioma por defecto).
  - En `useVoiceActionsHandler.ts`: Se mejoró la lógica para acceder a `VOICE_PUNCTUATION_MAP`, intentando primero con el locale completo (ej. `"es-ES"`), luego con el idioma base (ej. `"es"`) y finalmente con fallbacks a inglés.
- **Modal de Ayuda de Voz (`VoiceHelpModal.tsx`):**
  - Se actualizó para mostrar las palabras clave de los `VOICE_COMMANDS` y las reglas de `VOICE_PUNCTUATION_MAP` correspondientes al idioma actual de la interfaz de usuario (`locale` de `useLocale()`), con un sistema de fallback similar al de la detección.
- **FAQ Actualizada (`constants.ts` y `messages/es-ES.json`):**
  - Se añadió una nueva pregunta frecuente (`voiceCommandsMultiLanguageQuestion`) y su respuesta (`voiceCommandsMultiLanguageAnswer`) sobre cómo utilizar los comandos de voz en diferentes idiomas.
  - Se incluyó un marcador `//TODO <link>` en la respuesta para un futuro enlace a una guía detallada.
- **Simplificación en `ArticleForgePage.tsx`:**
  - Se eliminó la función `mapLocaleToSpeechLang` ya que `currentLocale` (obtenido de `useLocale()`) ya provee el formato de idioma necesario (ej. `"es-ES"`) directamente desde la configuración de `i18n`. `speechLanguage` ahora usa `currentLocale` directamente.
  - Se aseguró que la prop `locale` se pase correctamente a `useVoiceActionsHandler`.

### 🛠️ Mejoras

- **Consistencia de Locales**: Se estandarizó el uso de códigos de locale completos (ej. "es-ES") a través de las configuraciones de comandos de voz y puntuación, alineándose con la configuración general de `next-intl`.

---

## 2025-06-04

### ✨ Nuevas Funcionalidades - Control por Voz

- **Comandos de Encabezado H1 y H3**:
  - iniciamos con la implementacion de voz para chrome en PC/desktop.
  - se agregaron los comandos basicos de voz: dictar, mostrar ayuda, probados en EN y ES.
  - En progreso...

### 🛠️ Mejoras

- **Ayuda de Voz**: El modal de ayuda de voz ahora incluye los nuevos comandos para H1 y H3, proporcionando al usuario una lista más completa de las capacidades de dictado.

---

## 2025-06-03

### ✨ Nuevas Funcionalidades

- **Sugerencias de Etiquetas con IA en `TagInput`**:
  - Se añadió un botón para activar las sugerencias de etiquetas mediante IA, permitiendo elegir entre "Populares en Hive" o "Basadas en el Contenido del Artículo".
  - Implementada la interfaz de usuario (Popover con Badges) para mostrar y seleccionar las etiquetas sugeridas.
  - Las etiquetas añadidas mediante sugerencia de IA ahora tienen un estilo visual distintivo (color de badge primario por defecto).
  - Se incorporó un contador de etiquetas (ej. "3/10 etiquetas") en el componente `TagInput`.
- **Revisión de Artículo con Sugerencia de Etiquetas**:
  - Se extendió el endpoint API `/api/ai/revise-article-input` para que, opcionalmente, pueda devolver sugerencias de etiquetas relevantes (3-5) junto con el contenido revisado.
  - Se añadió un checkbox en el panel de opciones de revisión (`ArticleForgePage`) para que el usuario pueda solicitar estas sugerencias de etiquetas durante el proceso de revisión del artículo.
- **Integración en el Flujo de Publicación**:
  - Las etiquetas sugeridas por la IA durante la revisión ahora se guardan en `localStorage` cuando el usuario procede a la "Revisión Final".
  - La página de "Revisión Final" (`FinalReviewPage`) carga estas etiquetas sugeridas y las pre-popula en el `TagInput`, manteniendo su estilo visual distintivo si el campo de tags solo contenía el tag por defecto.

### 🛠️ Mejoras

- **Experiencia de Desarrollo**: Se añadieron `console.log` en el frontend (`ArticleForgePage`) para facilitar el seguimiento y depuración del flujo de obtención de sugerencias de etiquetas desde la API de revisión.
- **UI/UX en `TagInput`**:
  - Se mejoró la visibilidad y alineación del botón de sugerencias de IA, colocándolo a la derecha del campo de entrada de etiquetas.
  - El botón para solicitar sugerencias de IA ahora también se deshabilita si se ha alcanzado el número máximo de etiquetas permitidas.

---

## 2025-06-02

#### Mejoras en la Subida y Generación de Imágenes

- **Subida de Imágenes desde Dispositivo (`/api/images/upload/route.ts` y `editor/page.tsx`):**
  - Se implementó un botón en `MarkdownToolbar.tsx` para permitir a los usuarios subir imágenes desde sus dispositivos.
  - Se creó la lógica en `editor/page.tsx` (`handleTriggerDeviceImageUpload`) para:
    - Abrir el selector de archivos del navegador.
    - Validar el tamaño del archivo.
    - Enviar el archivo al backend (`/api/images/upload`).
    - Insertar la URL de la imagen devuelta en el editor con la sintaxis Markdown correcta (`!altText`).
  - Se ajustó la API de subida para usar el método de autenticación `getProfileIdFromAuth` consistentemente con otras rutas.
  - Se corrigió la restricción de clave foránea en la tabla `user_images` para que `user_id` referencie a `profiles(id)` en lugar de `auth.users(id)`, alineándose con el flujo de autenticación actual.
  - Se refinó el proceso de firma para la subida a Hive Images, asegurando que se firme el hash SHA256 del `imageBuffer` concatenado con "ImageSigningChallenge".
- **Generación de Imágenes AI (`/api/ai/generate-image/route.ts`):**
  - Se modificó la ruta para que, en lugar de subir directamente a Cloudinary, utilice `getDeterminedStorageService` para decidir el destino de la imagen (Hive Images, Ecency, o Cloudinary como fallback).
  - Se eliminó la necesidad de guardar la imagen generada en un archivo temporal en el servidor; ahora se trabaja directamente con el `Buffer` de la imagen.
  - Se implementó la subida de la imagen generada (desde base64) al servicio determinado y se guarda la información en la tabla `user_images`.
- **Documentación:** Se creó un archivo `docs/image-upload-hive-guide.md` con una guía detallada sobre cómo implementar la subida de imágenes a Hive con firma en un proyecto Next.js.

---

## 2025-06-01

#### Flujo de Generación y Subida de Imágenes AI

- **API de Generación de Imágenes (`/api/ai/generate-image/route.ts`):**

  - **Almacenamiento Temporal Local:**
    - Se implementó el guardado de la imagen generada (convertida de base64 a buffer) en un directorio temporal local antes de cualquier subida a Cloudinary.
    - Inicialmente, se usó `public/temp/` para el guardado, generando una URL pública local (`/temp/nombre-aleatorio.extension`).
    - Posteriormente, se adaptó para entornos serverless (como Netlify) utilizando `os.tmpdir()` para el almacenamiento temporal. Esto es crucial ya que el sistema de archivos en `public/` puede no ser escribible o persistente en dichos entornos.
  - **Subida a Cloudinary desde Archivo:**
    - Si la opción `uploadToCloudinary` (configurable en el cuerpo de la solicitud, por defecto `true`) está activa, la imagen guardada temporalmente se sube a Cloudinary.
    - Se utiliza la nueva función `uploadFileToCloudinary` que toma la ruta del archivo local.
  - **Mecanismos de Fallback y Opciones:**
    - Si `uploadToCloudinary` es `false`, la API ahora devuelve la imagen directamente como una cadena base64, sin guardarla localmente ni subirla.
    - Si la subida a Cloudinary se intenta pero falla (en la versión adaptada para serverless), la API devuelve la imagen en base64 como fallback. En la versión anterior (con `public/temp`), devolvía la URL local.
  - **Limpieza de Archivos Temporales:** El archivo de imagen temporal local se elimina después de una subida exitosa a Cloudinary o al finalizar el procesamiento si la subida no se realiza.
  - **Estructura de Respuesta Mejorada:** La respuesta de la API ahora incluye:
    - `imageUrl`: La URL de Cloudinary, la URL local (si aplica y la subida falló), o `null`.
    - `imageBase64`: La imagen en base64 si la subida a Cloudinary no se solicitó o falló (en la versión serverless).
    - `uploadStatus`: Un indicador del resultado (ej. `"cloudinary"`, `"local"`, `"skipped_cloudinary"`, `"failed_cloudinary_fallback_base64"`).
    - `usageMetadata`: Metadatos de uso de la API de IA.

- **Utilidades de Cloudinary (`lib/cloudinary/server.utils.ts`):**

  - **Nueva Función `uploadFileToCloudinary`:**
    - Se añadió una nueva función asíncrona que acepta la ruta de un archivo local como argumento.
    - Sube el archivo especificado a Cloudinary, manteniendo la configuración existente (carpeta `aegispad-uploads`, etiquetas `aegispad`, `ai-generated`).

- **Integración en el Editor (`ArticleForgePage.tsx` - función `handleAIImageGenerated`):**
  - **Sintaxis Markdown de Imagen Corregida:** Se aseguró que la sintaxis Markdown generada para las imágenes insertadas desde la IA sea la correcta: `!alt text`.
  - **Enlace de Atribución Automático:**
    - Se añadió una línea de atribución en Markdown automáticamente debajo de cada imagen generada por IA insertada.
    - El formato es `<center><small>gemini-AI</small></center>`.
    - El texto "gemini-AI" es un placeholder y se podría hacer más dinámico o configurable si se desea. (Nota: En la implementación final, se usó un texto traducible `toolbar.aiImageAttributionLinkText` con "Imagen por gemini-AI" como valor por defecto, y se enlazó a una URL de Gemini).

---

## 2025-05-31

#### Funcionalidad de Publicación y Comunidades en `FinalReviewPage.tsx`

- **Selección de Tipo de Post (Blog vs. Comunidad):**
  - Se añadió un `Switch` en la página de revisión final para permitir al usuario elegir si su publicación es para su blog personal o para una comunidad de Hive.
  - Se implementaron nuevos estados (`postType`, `selectedCommunity`) para gestionar esta selección.
- **Componente `SubscribedCommunitiesList.tsx`:**
  - Se creó un nuevo componente reutilizable para mostrar las comunidades a las que un usuario de Hive está suscrito.
  - El componente tiene dos modos de visualización (`displayMode`):
    - `"full"`: Muestra una lista completa de las comunidades.
    - `"min"`: Muestra un `<Select>` (dropdown) para elegir una comunidad.
  - Incluye manejo de estados de carga, error y lista vacía.
  - Se añadieron las traducciones correspondientes.
- **Integración en `FinalReviewPage.tsx`:**
  - Si el usuario activa el switch para "publicar en comunidad", se renderiza `SubscribedCommunitiesList` en modo `"min"`, permitiendo la selección de una comunidad.
  - La comunidad seleccionada se guarda en el estado `selectedCommunity`.
  - La función `handlePublishToHive` se actualizó para usar `selectedCommunity` como `parentPermlink` (categoría principal) si se trata de un post de comunidad.
- **Carga de Comunidades Suscritas:**
  - Se creó una nueva ruta API (`/api/user/hive-subscriptions`) que utiliza `dhive` para obtener las comunidades a las que el usuario autenticado está suscrito.
  - La función `getUserSubscribedCommunities` en `lib/hive/server-utils.ts` fue corregida para parsear correctamente la respuesta de la API de Hive (que devuelve un array de arrays) y mapearla a la interfaz `HiveCommunity` (con `id`, `name`, `role`). Se manejó el tipado de la respuesta de `dhive` como `unknown` para mayor seguridad.
  - `FinalReviewPage.tsx` ahora llama a esta API al montarse para cargar y mostrar las comunidades.

### Mejoras en la Interfaz de Usuario (UI) y Experiencia de Usuario (UX)

- **Estilos de `TagInput.tsx`:**
  - Se ajustaron los estilos del componente de entrada de etiquetas para que sean compatibles con los temas claro y oscuro, utilizando variables de color de Tailwind CSS (`bg-background`, `text-foreground`) en lugar de colores fijos.
- **Actualización de Contenido en `HomePage.tsx`:**
  - Se eliminó la sección referente a la configuración individual de claves API de Gemini, ya que AegisPad ahora utiliza una clave maestra.
  - Se añadió un nuevo mensaje clave enfatizando que AegisPad está diseñado para ahorrar tiempo y esfuerzo al unificar las herramientas que un blogger necesita.
  - Se reemplazó la sección "Token Estimation" por una nueva sección "Nuestra Visión", que comunica:
    - El objetivo de AegisPad de proveer herramientas y construir una relación duradera con la comunidad.
    - La información sobre el modelo de beneficiario del 6% para la cuenta `@aegispad`.
    - Una invitación a los usuarios para que proporcionen feedback.
  - El botón "Probar el Editor" se hizo más grande y llamativo para incentivar su uso.
- **Actualización de `constants.ts` (FAQ Data):**
  - Se eliminó la pregunta y respuesta relacionada con el uso de la API de Gemini.
  - Se reemplazaron las preguntas de ejemplo por contenido más relevante y específico sobre AegisPad, incluyendo:
    - "¿Qué es AegisPad y para quién es?"
    - "¿Cómo me ayuda la Inteligencia Artificial en AegisPad?"
    - "¿Necesito una cuenta de Hive para usar AegisPad?"
    - "¿Cómo funciona el modelo de beneficiario de AegisPad?"
    - "¿Puedo personalizar mi experiencia en AegisPad?"
    - "¿Qué diferencia hay entre publicar en mi blog y en una comunidad?"
  - Se proporcionaron las traducciones correspondientes para estas nuevas entradas del FAQ.

### Correcciones y Refinamientos

- **Aplicación de Tema en `ProfilePage.tsx`:**
  - Se solucionó un problema donde el cambio de tema visual (claro/oscuro) no se aplicaba inmediatamente o se revertía después de guardar las preferencias.
  - Se ajustó la lógica del `useEffect` y de la función `handleSavePreferences` utilizando un `useRef` para asegurar que el tema se aplique correctamente y persista tras la acción del usuario y la recarga de la página.
- **Flujo de Creación de Contenido en `ArticleForgePage.tsx`:**
  - Se consolidó la lógica para que el `StartArticleCard.tsx` (panel de prompt) aparezca cuando la acción `"create"` esté activa.
  - Se implementó la llamada a la API `/api/ai/generate-content` desde `handleStartArticleFromPanel` cuando el usuario envía un prompt.
  - **Seguridad:** Se añadió una verificación de rol en el backend (`/api/ai/generate-content/route.ts`) para asegurar que solo los usuarios con rol "admin" puedan ejecutar esta acción de generación de contenido. El frontend ya muestra un `toast` si el backend devuelve un error 403 (Forbidden).
- **Simplificación de `StartArticleCard.tsx`:**
  - El componente se simplificó para enfocarse únicamente en presentar el `Textarea` para el prompt de creación de contenido, eliminando la selección de flujo de trabajo, idioma de creación y la opción de generar imagen principal.
  - Se ajustó el paso de props y el uso de traducciones en consecuencia.
- **Inserción de Imágenes en `ArticleForgePage.tsx`:**
  - Se corrigió la función `handleInsertImagesFromModal` para que genere la sintaxis Markdown estándar y correcta para las imágenes: `!alt text`.

### Próximos Pasos y Consideraciones

- **Monetización y Financiamiento (Visión a Futuro):**
  - Se añadió una frase a la visión del proyecto (para ser usada en comunicaciones) sobre la intención de, junto con la comunidad, definir un modelo de financiamiento o monetización justo para asegurar la sostenibilidad y el crecimiento de AegisPad.

---

## 2025-05-30

#### Mejoras y Correcciones en `LineReviewer.tsx`

- **Estilo y Fondo:**
  - Se ajustó el color de fondo del componente `LineReviewer` a un amarillo claro (`bg-yellow-50`) para hacerlo más llamativo.
  - El área de contenido de las líneas dentro del `ScrollArea` se configuró con un fondo blanco (`bg-white`) para mejorar el contraste.
- **Scroll:**
  - Se solucionaron problemas persistentes con el scroll vertical asegurando la correcta aplicación de clases Flexbox (`flex-1 min-h-0`) en el `ScrollArea` y `overflow-hidden` en sus contenedores padres (`Rnd` y `DialogContent`).
  - Se añadió `overflow-y-auto` directamente al `ScrollArea` para forzar la barra de scroll vertical cuando sea necesario.
- **Limpieza:** Se eliminaron todos los comentarios del código fuente de `LineReviewer.tsx`.

### Refactorización de `page.tsx` y Tipado de Traducciones

- **Extracción de Componentes:** Se refactorizó `page.tsx` extrayendo varias secciones de UI a componentes dedicados en `src/components/editor-page/`:
  - `RevisionOptionsPanelComponent.tsx`
  - `EditorActionsMenuComponent.tsx`
  - `MarkdownPreviewComponent.tsx`
  - `TranslationPanelComponent.tsx`
  - `CombinePanelComponent.tsx`
- **Tipado de `next-intl`:**
  - Se abordaron errores de TypeScript relacionados con la prop `t` (función de traducción) en los nuevos componentes.
  - Se creó y configuró `src/types/translation-types.ts` para definir tipos específicos para las funciones de traducción de cada namespace de primer nivel (ej. `ArticleForgePageTranslations`, `TokenUsageTranslations`), utilizando `ReturnType<typeof useTranslations<"NamespaceName">>>`.
  - Se verificó la estructura de los archivos de mensajes (`en.json`, `es.json`, `pt-BR.json`, `fr.json`) para confirmar los namespaces de primer nivel y asegurar la correcta definición de los tipos.
  - Se aplicaron estos tipos de traducción específicos a las props `t` en todos los componentes relevantes, tanto los nuevos como los existentes en `src/components/editor-sections/`.

### Mejoras en la Vista Previa de Markdown (`MarkdownPreviewComponent.tsx`)

- **Renderizado de Encabezados:** Se solucionó un problema donde los encabezados Markdown (ej. `### Título`) no se renderizaban visualmente como títulos.
  - Se confirmó que el HTML generado era correcto (`<h1>`, `<h2>`, etc.).
  - Se identificó que los estilos por defecto de la clase `prose` (de `@tailwindcss/typography`) eran la causa.
- **Estilos de `@tailwindcss/typography`:**
  - Se instaló el plugin `@tailwindcss/typography`.
  - Se modificó `tailwind.config.ts` para personalizar los estilos de `prose`, definiendo explícitamente `fontSize`, `fontWeight`, márgenes y colores para encabezados (`h1`-`h4`), párrafos (`p`), y tablas (`table`, `thead`, `th`, `tbody`, `tr`, `td`), incluyendo consideraciones para el modo oscuro (`dark:prose-invert`).
- **Soporte para Tablas GFM:** Se añadió el plugin `remark-gfm` a `ReactMarkdown` para permitir el correcto parseo y renderizado de tablas con sintaxis GitHub Flavored Markdown.
- **Espaciado entre Párrafos:** Se redujo el margen vertical entre párrafos (`<p>`) dentro de la vista previa modificando la configuración de `prose` en `tailwind.config.ts`.

### Interfaz de Usuario del Editor (`page.tsx` y componentes relacionados)

- **Panel de "Revisión Final":**
  - Se movió la tarjeta "¿Listo para la Revisión Final?" para que aparezca como un panel de acción (similar a "Traducir", "Combinar") cuando `activeAction === "finalReview"`.
  - Se añadió un nuevo botón "Revisión Final" al `EditorActionsMenuComponent.tsx`.
  - Se actualizó `page.tsx` para manejar este nuevo estado y renderizar el panel condicionalmente.
  - Se aplicó un fondo blanco sutil (`bg-background`) al panel de "Revisión Final" y se ajustó para que se muestre en una sola línea, mejorando la consistencia visual.
- **Botón "Copiar Resumen":**
  - Se modificó la lógica para habilitar el botón "Copiar Resumen" en `EditorActionsMenuComponent.tsx` para que dependa únicamente de si `finalCombinedOutput` tiene contenido (eliminando la dependencia del uso de tokens).
  - Se añadió el `username` del usuario (obtenido del contexto `useHiveAuth`) y la fecha/hora actual al texto del resumen que se copia.

### Planificación y Documentación

- **Conteo de Tokens (API):** Se actualizó el `TODO` en la ruta `api/ai/translate-article/route.ts` con un plan detallado y de alta prioridad para implementar el conteo de tokens (extracción de `usageMetadata`, inclusión en respuesta JSON, y futura función de registro en backend).
- **Implementación de Modo Oscuro (Dark Mode):**
  - Se discutió y planificó la implementación del modo oscuro: configuración de `darkMode: "class"` en Tailwind, definición de variables CSS para modo oscuro, creación de un `ThemeProvider` y un componente `ThemeToggle`.
  - Se integró el `ThemeToggle` dentro del `UserAvatarDropdown.tsx`.
- **Refactor a Clave Maestra de API (TODO.md):**
  - Se añadió una nueva sección de alta prioridad al inicio de `TODO.md` detallando el plan para la transición de claves de API por usuario a una única clave maestra gestionada por el servidor. Esto incluye los cambios necesarios en el backend, frontend, `useHiveAuth`, UI, y consideraciones de seguridad y costos.

---

## 2025-05-29

#### Mejoras Generales del Editor (page.tsx)

#### 1. Barra de Herramientas Markdown (`MarkdownToolbar.tsx`)

- **Creación e Integración:** Se implementó una nueva barra de herramientas para aplicar formatos Markdown comunes.
- **Funcionalidades de Formato:**
  - Negrita, cursiva, tachado.
  - Encabezados (H1, H2, H3).
  - Listas (con viñetas y numeradas).
  - Citas en bloque.
  - Bloques de código.
  - Enlaces.
  - Líneas horizontales (`---`).
- **Inserción de Imágenes:**
  - Botón para insertar imágenes desde **Hivelens** (usando el componente `ImageSearchAndInsert` en modo modal) con un icono SVG personalizado.
  - Botón para insertar imágenes directamente proporcionando una **URL**.
- **Control de Vista Previa:**
  - Botón para alternar el diseño de la vista previa entre:
    - Lado a lado (editor izquierda, vista previa derecha).
    - Apilado (editor arriba, vista previa abajo).

#### 2. Componente `ImageSearchAndInsert.tsx` (Buscador de Imágenes Hivelens)

- **Optimización:** Se reemplazó la etiqueta `<img>` por el componente `<Image>` de Next.js para optimización automática (lazy loading, WebP, etc.).
- **Configuración de Dominio:** Se ajustó `next.config.js` para permitir `hivelens.duckdns.org` en `remotePatterns` (usando wildcard `/**` para `pathname`).
- **Búsqueda Avanzada:**
  - Se añadió un `<Select>` para permitir búsquedas por "Término general", "Usuario" (`author`), o "Tags".
  - La lógica de `performSearch` se adaptó para construir los parámetros de la API de Hivelens correspondientes.
- **Paginación y Límite de Resultados:**
  - Se añadió un `<Select>` para que el usuario elija el límite de resultados por página (20, 50, 100).
  - Se implementó un botón "Cargar más resultados" que utiliza la información de paginación (`currentPage`, `totalPages`) devuelta por la API de Hivelens.
- **Créditos de Imagen:**
  - El componente ahora devuelve el `postUrl` y `altText` de las imágenes seleccionadas.
  - Al insertar, se añade un enlace de crédito debajo de la imagen en el formato: `fuente`.
  - El `altText` se trunca a 20 caracteres si es más largo.

#### 3. Flujo de Acciones del Editor (`page.tsx`)

- **Traducción:**
  - El panel de selección de idioma y el botón "Traducir Artículo" ahora aparecen directamente debajo del `EditorActionsMenu` (panel de acciones).
  - El panel se hizo más compacto, mostrando el selector de idioma y el botón de traducir en una sola línea, eliminando el título del panel.
  - Al traducir, el texto original se conserva en el editor y la traducción se añade debajo, separada por `---` y un encabezado indicando el idioma de la traducción (ej. `### Traducción (Español)`).
- **Combinación de Formatos:**
  - El panel de selección de formato y el botón "Generar Formato Combinado" ahora aparecen directamente debajo del `EditorActionsMenu`.
  - El panel se hizo más compacto, mostrando el selector de formato y el botón de combinar en una sola línea, eliminando el título del panel.
  - Al combinar, el texto resultante reemplaza el contenido actual del editor.
- **Revisión de Contenido:**
  - Al hacer clic en "Revisar Contenido" en `EditorActionsMenu`, ahora aparece un panel de opciones debajo.
  - El panel de opciones de revisión se hizo compacto, usando un `<select>` para elegir el tipo de revisión y un botón "Aplicar Revisión", todo en una línea.
  - **Opción 1: "Revisión Completa por IA (con Deshacer)"**:
    - Llama a la API de revisión.
    - Si tiene éxito, actualiza el contenido del editor con el texto revisado.
    - Guarda el estado anterior para permitir "Deshacer Revisión".
    - El botón "Deshacer Revisión" aparece en `EditorActionsMenu` para revertir al estado anterior.
  - **Opción 2: "Déjame decidir lo que se coloca (Mostrar Diff)"**:
    - Llama a la API de revisión para obtener el texto revisado.
    - Abre un nuevo componente modal/flotante `LineReviewer` para la revisión línea por línea.
- **Componente `LineReviewer.tsx` (para Revisión Selectiva):**
  - **Creación:** Se desarrolló un nuevo componente para mostrar el texto revisado por la IA línea por línea.
  - **Funcionalidad:**
    - Cada línea muestra el texto revisado.
    - Botón `+` (Aplicar): Llama a `onApplyLine` para que el componente padre decida cómo integrar esa línea en el editor principal (implementación básica actual).
    - Botón `-` (Descartar): Elimina la línea de la vista actual del `LineReviewer`.
  - **Acciones Globales:**
    - Botón "Aplicar Todos los Visibles y Cerrar": Toma todas las líneas restantes en el `LineReviewer` y actualiza el editor principal.
  - **Desacoplamiento (Panel Flotante):**
    - Se añadió un botón para "desacoplar" el `LineReviewer` de su modo modal.
    - Cuando se desacopla, se renderiza como un panel flotante utilizando la librería `react-rnd`, permitiendo al usuario moverlo y redimensionarlo.
    - Se implementó un botón para "acoplar" o cerrar el panel flotante.
  - **Scroll:** Se ajustaron los estilos para asegurar que el contenido dentro del `LineReviewer` tenga scroll vertical si es extenso, tanto en modo modal como flotante.

#### 4. Vista Previa de Markdown (`MarkdownPreview`)

- **Renderizado de HTML:** Se integró el plugin `rehype-raw` para que `ReactMarkdown` pueda renderizar correctamente etiquetas HTML como `<details>` y `<summary>`, permitiendo secciones desplegables.

#### 5. Interacción con API de IA

- **Revisión de Artículo:**
  - Se corrigió el `body` de la petición `fetch` en `handleReviseArticle` para enviar correctamente el `articleContent` (eliminando un `JSON.stringify` anidado).
  - Se ajustó el prompt enviado a la IA en `/api/ai/revise-article-input/route.ts` para instruir explícitamente la preservación de la sintaxis Markdown original.
  - Se confirmó que `authenticatedFetch` ya se estaba utilizando para esta ruta.

#### 6. Visualización de Uso de Tokens (`EditorTokenUsage.tsx`)

- Se movió el componente `EditorTokenUsage` para que aparezca dentro de un `Popover` en el `EditorActionsMenu`, activado por un botón "Tokens".

### Correcciones de Errores Menores y Refactorizaciones

- Se corrigió un error en `handleReviseArticle` donde se intentaba llamar a `setIsLoading` (que no existe) en lugar de depender de `isProcessing` de `useTransition`.
- Se ajustaron las dependencias de `useEffect` en `LineReviewer.tsx`.
- Se corrigió un error de contexto de `Dialog` en `LineReviewer.tsx` al refactorizar `reviewerContent` para usar HTML estándar en modo flotante.
- Se corrigió la ubicación de las funciones `handleApplyLineFromReviewer` y `handleApplyAllVisibleChangesFromReviewer` moviéndolas al ámbito de `ArticleForgePage`.
- Se ajustó el `dragHandleClassName` para `react-rnd` para permitir el arrastre del panel flotante.

---
