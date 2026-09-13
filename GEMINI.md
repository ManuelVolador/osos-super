# Directrices de Diseño Profesional Anti-IA Slop (osos-super)

Este proyecto aplica rigurosos estándares de diseño profesional y desarrollo de interfaces con enfoque **Anti-AI Slop**, garantizando que cualquier interfaz creada o editada se sienta artesanal, táctil y pensada por un diseñador humano experto.

---

## Skills de Diseño Activas

El agente tiene a su disposición las siguientes skills globales instaladas en `~/.gemini/config/skills/`:
- **`hallmark`**: Variedad macroestructural, estética táctil, auditoría de slop (`hallmark audit`) y rediseño de calidad boutique.
- **`ui-ux-pro-max`**: Inteligencia de diseño con 79 estilos, 192 paletas razonadas, 74 combinaciones tipográficas y motor local de búsqueda (`scripts/search.py`).
- **`design-system`**: Generación de tokens semánticos, escalas de espaciado y variables CSS.
- **`antislop` / `antislop-ui` / `antislop-copywriting`**: Filtros estrictos de calidad y puerta de entrega (*Delivery Gate*).

---

## Patrones Terminantemente Prohibidos (Anti-Slop Filter)

1. **Degradados Neón Genéricos**:
   - ❌ NO usar combinaciones púrpura/índigo (`from-purple-600 to-indigo-600`), azul eléctrico a cian, ni resplandores de fondo difuminados (*ambient glow blobs*) sin justificación de marca.
   - ✅ Usar paletas intencionales de alto contraste: fondos neutros matizados, colores primarios con carácter (arcilla, esmeralda profundo, carbón, azul marino industrial) y acentos controlados.

2. **Monotonía Macroestructural**:
   - ❌ NO repetir la estructura plantilla de IA: *Pill badge con emoji ✨ ("✨ Nueva IA...") → Título centrado gigante con clipping de degradado → 3 tarjetas idénticas con esquinas hiper-redondeadas e iconos dentro de cajas de color → Bento grid forzado*.
   - ✅ Diseñar estructuras asimétricas, ritmo visual variado, composiciones editoriales, tipografía protagonista o rejillas funcionales según el contenido real del proyecto.

3. **Glassmorphism y Resplandores Borrosos**:
   - ❌ NO abusar de `backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl` que arruina el contraste y la legibilidad.
   - ✅ Usar superficies sólidas, bordes sutiles y tangibles (1px), separadores nítidos y sombras calculadas con luz natural.

4. **Tipografía Plana y Sin Personalidad**:
   - ❌ NO usar Inter o Roboto como única tipografía para todo el documento sin contraste de peso ni tracking.
   - ✅ Establecer pares tipográficos con carácter: sans geométrico con tracking negativo para encabezados + sans limpio legible para texto de lectura, o serif editorial para destacar. Respetar jerarquías y escala modular.

5. **Copywriting de Relleno IA**:
   - ❌ Baneo absoluto de palabras trilladas: *"delve"*, *"seamlessly streamline"*, *"elevate"*, *"game-changing"*, *"cutting-edge"*, *"empower your journey"*.
   - ✅ Redactar texto directo, conciso, humano y centrado en la propuesta de valor real del usuario o cliente.

6. **Microinteracciones y Accesibilidad (WCAG AA)**:
   - ✅ Todo elemento interactivo (botones, inputs, enlaces) DEBE tener estados claramente diferenciados: `:hover`, `:active` (feedback táctil), `:focus-visible` (anillo de foco accesible para teclado) y `:disabled`.
   - ✅ Comprobar siempre una relación de contraste mínima de 4.5:1 para texto normal y 3:1 para texto grande.
