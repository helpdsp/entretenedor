```markdown
# Design System Specification: The Kinetic Stream

## 1. Overview & Creative North Star
This design system is built to bridge the gap between high-speed social consumption and intentional education. Our Creative North Star is **"The Kinetic Stream."** 

Unlike traditional educational platforms that feel static and heavy, this system mimics the fluidity of a vertical video feed. It rejects the rigid, boxy layouts of the past in favor of an editorial, high-energy interface. We break the "template" look through intentional asymmetry, overlapping glass surfaces, and a typography scale that demands attention. The goal is to make learning feel as effortless and addictive as a social swipe.

## 2. Colors & Surface Philosophy
The palette is rooted in a deep, cosmic foundation (`#060e20`) to allow our vibrant Indigo/Purple accents to pop with maximum luminance.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Traditional borders create visual "clutter" that slows down the user's eye. 
- Boundaries must be defined solely through background color shifts.
- Use `surface-container-low` for large background sections and `surface-container-high` for interactive elements to create distinction.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of smoked glass. 
- **Base Layer:** `surface` (#060e20).
- **Secondary Content:** `surface-container-low`.
- **Primary Interactive Cards:** `surface-container-high`.
- **Active/Floating Overlays:** `surface-bright` with 80% opacity and a 20px backdrop-blur (Glassmorphism).

### Signature Textures & Gradients
Main CTAs and Hero moments must use the **Kinetic Gradient**: a transition from `primary` (#a3a6ff) to `primary-dim` (#6063ee). Avoid flat colors for high-priority actions; gradients provide the "soul" and professional polish that resonates with a Gen Z audience.

## 3. Typography: Editorial Impact
We utilize a dual-typeface system to balance high-energy expression with reading stamina.

- **The Voice (Plus Jakarta Sans):** Used for `display` and `headline` scales. This is our personality. Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) to create an "editorial" look that feels like a premium magazine header.
- **The Engine (Inter):** Used for `title`, `body`, and `label` scales. Inter provides the high-contrast clarity needed for micro-learning. 
- **Intentional Contrast:** Always pair a `headline-lg` with a `body-md`. The massive jump in scale creates a visual hierarchy that guides the user through fast-paced content without fatigue.

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** rather than structural lines.

- **The Layering Principle:** Place a `surface-container-highest` card on a `surface-container-low` section to create a soft, natural lift.
- **Ambient Shadows:** When an element must "float" (like a bottom navigation bar), use an extra-diffused shadow. 
    - *Shadow Color:* Use a 10% opacity version of `on_background`. 
    - *Blur:* Minimum 40px. 
    - *Offset:* Y: 12px.
- **The "Ghost Border" Fallback:** If a border is essential for accessibility, use the `outline-variant` token at 15% opacity. Never use 100% opaque outlines.
- **Glassmorphism:** For overlays and modals, use `surface-container-high` with an alpha of 0.7 and a `backdrop-filter: blur(16px)`. This allows the vibrant colors of the "Kinetic Stream" to bleed through, maintaining the user's context.

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-dim`), `on_primary` text, and `xl` (3rem) corner radius.
- **Secondary:** Glass effect using `surface-bright` at 20% opacity with a `title-sm` font weight.
- **Sizing:** Large touch targets are mandatory. Vertical padding should be a minimum of 16px.

### Cards & Content Blocks
- **The Vertical Feed Card:** Edge-to-edge (0px side margins on mobile) to mimic TikTok's immersive feel. Use `lg` (2rem) corner radius for internal content containers.
- **No Dividers:** Forbid the use of line dividers between list items. Use 16px or 24px of vertical white space (from the spacing scale) to separate thoughts.

### Status Badges (The "Vibrant Pop")
- **'Gratis' / Success:** Use `tertiary-container` (#69f6b8) with `on_tertiary_fixed` text. These should be small, high-contrast pills with a `full` (9999px) radius.

### Input Fields
- Use `surface-container-highest` as the fill. 
- **State Change:** On focus, transition the background to `surface-bright` and add a subtle `primary` glow (8px blur, 10% opacity). Do not use a heavy stroke.

### Specialized Component: The Progress Pulse
- A micro-learning indicator using a `secondary` (#ac8aff) thin horizontal bar at the top of the screen, utilizing a subtle pulse animation to signify active "FastTrack" AI processing.

## 6. Do's and Don'ts

### Do:
- **Do** lean into the `xl` (3rem) roundedness for large containers; it makes the UI feel friendly and organic.
- **Do** use `display-lg` typography for lesson titles to create an "impact" moment.
- **Do** utilize `surface-container-lowest` for deep backgrounds to make the content cards feel like they are floating in space.

### Don't:
- **Don't** use pure white (#FFFFFF) for text. Always use `on_surface` (#dee5ff) to reduce eye strain in dark mode.
- **Don't** use standard "Material" shadows. If the shadow is dark grey or black, it's wrong. Shadows should be tinted by the background.
- **Don't** ever use a 1px solid border to separate two sections of the same color. Shift the background tone instead.

---
*This design system is a living document. Every pixel should contribute to a sense of momentum, speed, and premium quality.*```