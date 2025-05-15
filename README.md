# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

---

## Consideraciones Importantes

- Actualmente este proyecto utiliza suppressHydrationWarning en ciertos elementos ya que la extensión Hive Keychain hace uso de la inyección de clases de CSS para sus mecanismos de detección. Dado que confiamos en ese proyecto, hemos desactivado esa advertencia de hidratación para esos elementos específicos.
- Si investiga el código y encuentra alguna falla importante o bug relacionado con la hidratación o la interacción con Hive Keychain que no esté cubierta por esta excepción, por favor abra un issue en nuestro repositorio de GitHub.
