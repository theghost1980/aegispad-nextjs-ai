## Project Overview: AegisPad - Your Intelligent Hive Content Suite

AegisPad is a sophisticated Next.js application designed as an all-in-one content management suite for users on the Hive blockchain.
It leverages Artificial Intelligence, primarily through Google's Gemini API, to offer a rich set of tools that streamline the entire lifecycle of an article. The application is deeply integrated with Hive Keychain for secure authentication and operations.

---

<details>
  <summary>Click to expand Architecture Information</summary>

## 🧭 Arquitectura del Proyecto – Walkthrough Técnico

Esta sección describe la arquitectura general de AegisPad y las decisiones técnicas clave tomadas durante su diseño y desarrollo.

### 🎯 Objetivo Arquitectónico

AegisPad fue diseñado como una **aplicación frontend-heavy**, con lógica distribuida entre cliente y backend ligero, priorizando:

* Escalabilidad del frontend.
* Buen DX (Developer Experience).
* Integración segura con Web3 (Hive Keychain).
* Facilidad de evolución del producto sin reescrituras costosas.

La arquitectura evita acoplamientos innecesarios y permite que nuevas funcionalidades (IA, media, analytics, Web3) se integren de forma incremental.

---

### 🧩 Stack Principal

* **Framework:** Next.js (App Router)
* **Lenguaje:** TypeScript
* **UI:** React + componentes reutilizables
* **Estado:** Estado local + persistencia ligera (localStorage) para flujos multi-step
* **IA:** Google Gemini (en proceso de migración al nuevo SDK unificado)
* **Web3:** Hive Keychain
* **Backend:** APIs serverless (Next.js API routes / Supabase)
* **Infra:** Enfoque serverless-first para reducir costos y complejidad

---

### 🏗️ Separación de Responsabilidades

La aplicación se estructura siguiendo una separación clara de responsabilidades:

#### 1. **Capa de UI / Experiencia de Usuario**

* Componentes desacoplados y reutilizables.
* Editor Markdown con preview en tiempo real.
* Flujos guiados (crear → revisar → publicar).
* Diseño pensado para accesibilidad y extensibilidad (ej. control por voz).

#### 2. **Capa de Lógica de Negocio**

* Orquestación de flujos de creación, revisión y traducción.
* Control explícito de cuándo y cómo se invoca la IA.
* Persistencia temporal del estado del artículo para evitar pérdida de información entre pasos.

#### 3. **Capa de Integración IA**

* Las llamadas a IA **no se hacen directamente desde la UI**, sino a través de endpoints controlados.
* Esto permite:

  * Manejo centralizado de tokens y límites.
  * Evolución de prompts sin tocar la UI.
  * Migración futura entre proveedores de IA sin impacto directo en el frontend.

#### 4. **Capa Web3 (Hive)**

* Autenticación y firma de operaciones delegadas a Hive Keychain.
* La app **no gestiona claves privadas**, reduciendo superficie de ataque.
* Integración diseñada para ser explícita y trazable (firmas, custom JSONs, publicaciones).

---

### 🧠 Decisiones Técnicas Importantes (y Porqués)

#### ❓ ¿Por qué Next.js?

* Permite combinar frontend avanzado con backend ligero.
* Facilita SSR/CSR según necesidad.
* Ideal para un producto que puede crecer hacia dashboards, admin panels y analytics.

#### ❓ ¿Por qué un backend mínimo?

* Reduce costos operativos.
* Minimiza puntos de falla.
* Delegación de lógica pesada solo cuando es estrictamente necesario (IA, rate limiting, APIs externas).

#### ❓ ¿Por qué no centralizar todo el estado global?

* Muchos flujos son **contextuales y temporales** (artículo en edición).
* Se priorizó claridad y aislamiento de estados frente a un store global complejo.
* Se evalúa Zustand para futuros módulos compartidos.

#### ❓ ¿Cómo se controla el uso de IA?

* Tracking explícito de tokens por sesión.
* Diseño preparado para:

  * caching,
  * rate limiting,
  * políticas de uso por usuario (free vs premium).

---

### 🔐 Seguridad y Confiabilidad

* Uso de `suppressHydrationWarning` **solo en puntos específicos** donde Hive Keychain inyecta clases dinámicamente.
* Decisión consciente para evitar falsos positivos sin comprometer estabilidad.
* Invitación abierta a reportar bugs relacionados con hidratación o integraciones Web3.

---

### 🚀 Arquitectura Pensada para Evolucionar

AegisPad está diseñado para crecer en múltiples direcciones sin romper su base:

* Nuevos proveedores de IA.
* Integración con APIs externas (Pexels, Unsplash).
* Módulos admin y analítica.
* Soporte mobile-first.
* Features premium sin afectar usuarios existentes.

  ### 🧭 Fin de la arquitectura del Proyecto – Walkthrough Técnico

---

</details>

---

1.  **AI-Powered Article Forge (Editor):**

    - **Advanced Markdown Editing:** A rich Markdown editor with a live preview panel. Features a comprehensive toolbar for text styling (bold, italic, strikethrough), headings, block elements (lists, quotes, code blocks, horizontal rules), and insertions.
    - **AI Revisions:**
      - **Full Revision:** Submit entire articles for AI-driven improvements.
      - **Selective Line-by-Line Review:** Compare AI-suggested changes with original content and apply them granularly.
      - **Undo Revision:** Revert to the article's state before the last AI revision.
    - **AI Translation:** Translate articles into various target languages, with support for chunked translation for longer texts and progress display.
    - **Content Combination:** Multiple formats to combine original and translated content (e.g., simple concatenation, collapsible `<details>` tag, inline interleaving, or formatted for comments).
    - **Image Management:**
      - **AI Image Generation:** Generate images using AI (e.g., via Gemini) directly within the editor.
      - **Device Uploads:** Upload images from the user's device.
      - **Hivelens Image Search:** Search and insert images from "Hivelens" (or a similar Hive-based image service).
      - **Image by URL:** Insert images using external URLs.

2.  **Publishing Workflow & Hive Integration:**

    - **Final Review Page:** A dedicated step to review the finalized article, edit the title, and manage tags.
    - **Tag Management:** Add up to 10 tags, with the first tag serving as the main category. Includes AI-powered tag suggestions (popular on Hive or derived from article content).
    - **Community Publishing:** Option to select a subscribed Hive community for posting.
    - **Direct Hive Publishing:** Publish articles directly to the Hive blockchain, secured by Hive Keychain.
    - **Local Save/Discard:** Options to save work in progress locally or discard it.

3.  **User Account & Configuration:**

    - **Hive Keychain Authentication:** Secure login and transaction signing using Hive Keychain.
    - **Profile Management:** Users can manage their token usage history (last 25 operations), and set preferences (UI theme, page after login).

4.  **AI & Platform Services:**

    - **Token Usage Tracking:** Monitors estimated AI token usage (text and image) for the current session and provides a historical view on the profile page.
    - **Language Detection:** Automatic detection of article language.

5.  **Supporting Features & Information:**
    - **Internationalization (i18n):** The application interface is available in multiple languages (e.g., English, Spanish, French, Portuguese).
    - **FAQ Page:** Comprehensive answers to frequently asked questions about AegisPad, its features, Hive integration, and the beneficiary model.
    - **Feedback System:** A dedicated page for users to submit ratings, suggestions, and bug reports.
    - **Devlogs Page:** Information on project updates and development history.

AegisPad aims to empower Hive content creators by providing a robust, AI-enhanced environment that simplifies content refinement, translation, and publishing. It operates on a model where a small percentage of post rewards (beneficiary) helps support the platform's maintenance and development.

## Consideraciones Importantes

- Actualmente este proyecto utiliza suppressHydrationWarning en ciertos elementos ya que la extensión Hive Keychain hace uso de la inyección de clases de CSS para sus mecanismos de detección. Dado que confiamos en ese proyecto, hemos desactivado esa advertencia de hidratación para esos elementos específicos.
- Si investiga el código y encuentra alguna falla importante o bug relacionado con la hidratación o la interacción con Hive Keychain que no esté cubierta por esta excepción, por favor abra un issue en nuestro repositorio de GitHub.
