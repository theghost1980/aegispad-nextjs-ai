## Project Overview: AegisPad - Your Intelligent Hive Content Suite

AegisPad is a sophisticated Next.js application designed as an all-in-one content management suite for users on the Hive blockchain.
It leverages Artificial Intelligence, primarily through Google's Gemini API, to offer a rich set of tools that streamline the entire lifecycle of an article. The application is deeply integrated with Hive Keychain for secure authentication and operations.

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
