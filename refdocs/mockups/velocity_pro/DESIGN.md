# Design System Strategy: The Intelligent Flow

## 1. Overview & Creative North Star
The "Creative North Star" for this design system is **The Intellectual Sanctuary**. 

Micro-learning often feels frantic and overwhelming; this system is designed to counteract that friction. We are moving away from the "standard dashboard" aesthetic toward a **High-End Editorial** experience. By leveraging intentional white space, soft tonal layering, and sophisticated typography scales, we transform educational content into a premium digital journey. 

We break the "template" look through **Tonal Depth** and **Asymmetric Breathing Room**. Rather than boxing content into rigid grids with harsh borders, we allow information to "float" on layers of light, using the subtle shifts between surface tiers to guide the eye. This creates an environment that feels intelligent, calm, and effortlessly modern.

---

## 2. Colors: Tonal Architecture
This system utilizes a sophisticated palette where color is used for "focus" rather than "decoration." 

### The "No-Line" Rule
**Designers are prohibited from using 1px solid borders for sectioning.** To define boundaries, use background shifts. A `surface-container-low` (#f4eeff) section should sit directly on a `surface` (#faf4ff) background. The transition between these two soft tones provides all the structure necessary without the visual clutter of lines.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine, semi-translucent paper.
- **Base Layer:** `surface` (#faf4ff) for the primary application background.
- **Secondary Layer:** `surface-container-low` (#f4eeff) for secondary navigation or sidebars.
- **Action Layer:** `surface-container-lowest` (#ffffff) for the highest-priority cards and interactive modules. This creates a "glow" effect where the most important content appears closest to the user.

### The "Glass & Gradient" Rule
To elevate the "FastTrack AI" identity, use **Glassmorphism** for floating elements (e.g., sticky headers or mobile navigation). Use semi-transparent `surface` colors with a `backdrop-filter: blur(20px)`. 

For Primary CTAs, utilize a **Signature Gradient**:
- From `primary` (#4647d3) to `primary-container` (#9396ff) at a 135-degree angle. This adds "soul" and depth, preventing the app from looking like a generic SaaS template.

---

## 3. Typography: Editorial Authority
The typography system pairs the geometric precision of **Plus Jakarta Sans** with the utilitarian clarity of **Inter**.

- **Display & Headlines (Plus Jakarta Sans):** These are the "Editorial Voice." Use `display-lg` (3.5rem) for milestone achievements and `headline-md` (1.75rem) for lesson titles. The increased letter-spacing and bold weights project confidence.
- **Body & Labels (Inter):** These are the "Instructional Voice." `body-lg` (1rem) is the workhorse for learning content. Ensure a line height of 1.6x for maximum readability during long-form micro-lessons.
- **Hierarchy through Scale:** Do not use color to differentiate headers; use scale. A large `headline-lg` in `on_surface` (#302950) is more premium than a small header in a bright color.

---

## 4. Elevation & Depth: The Layering Principle
We move beyond 2010-era drop shadows. Depth is achieved through **Tonal Layering**.

- **Ambient Shadows:** For floating elements (like a "Start Lesson" FAB), use a shadow tinted with the `on_surface` color: `box-shadow: 0 12px 32px rgba(48, 41, 80, 0.06)`. This mimics natural light reflecting off purple-tinted surfaces.
- **The "Ghost Border" Fallback:** If a border is required for accessibility in input fields, use the `outline-variant` (#b0a7d6) at **20% opacity**. Never use a 100% opaque border.
- **Soft Corners:** Use the `xl` (1.5rem) radius for primary containers and lesson cards to evoke a friendly, approachable AI personality. Use `md` (0.75rem) for smaller interactive elements like buttons.

---

## 5. Components

### Cards & Content Modules
- **Rule:** Forbid the use of divider lines.
- **Execution:** Use vertical white space or a shift to `surface-container-highest` (#e1d8ff) for a "Lesson Card" to separate it from the main feed. Ensure `xl` (1.5rem) corner rounding.

### Buttons
- **Primary:** Signature Gradient (Primary to Primary-Container), white text (`on_primary`), `md` (0.75rem) rounded corners.
- **Secondary:** `secondary-container` (#d6cbff) background with `on_secondary_container` (#4a349d) text. No border.
- **Tertiary:** Transparent background, `primary` (#4647d3) text, ghost-border on hover only.

### AI Code Blocks
- **Styling:** Use `inverse_surface` (#0f072e) as the background. 
- **Typography:** Monospace font (JetBrains Mono or similar).
- **Contrast:** High-contrast syntax highlighting using `tertiary_fixed` (#ff8ed2) and `primary_fixed` (#9396ff).

### Micro-Learning Progress Bars
- **Track:** `surface-container-highest` (#e1d8ff).
- **Indicator:** `primary` (#4647d3) with a subtle outer glow (0 0 8px) using the same color at 30% opacity.

### Learning Chips
- **Selection:** Use `primary-container` (#9396ff) background with `on_primary_container` (#0a0081) text. Shape should be `full` (9999px) for a pill-like feel.

---

## 6. Do's and Don'ts

### Do
- **Do** use `surface-container-low` to group related educational topics.
- **Do** allow headlines to "breathe" with at least 32px of top margin.
- **Do** use `tertiary` (#963776) sparingly for "Success" or "Achievement" moments to provide a warm contrast to the purple primary.
- **Do** ensure all text on `primary` uses `on_primary` (#f4f1ff) for AAA accessibility.

### Don't
- **Don't** use 1px grey lines to separate list items; use a 12px gap instead.
- **Don't** use pure black (#000000) for text. Always use `on_surface` (#302950) to maintain the sophisticated, deep-purple tonal quality.
- **Don't** use "Standard" blue for links. Use `secondary` (#5e4ab3) with a 2px underline offset.
- **Don't** clutter the screen. If a micro-lesson has more than three core concepts, split it into a new "layer" or screen.