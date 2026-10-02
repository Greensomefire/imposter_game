## Visual style

Default to a dark, cool, understated palette for any UI you build or restyle.

- **Backgrounds:** near-black with a blue or slate tint (e.g. #0B0E14, #11151C, #171C26), never pure #000. Create depth with 2–3 slightly lighter surface layers rather than shadows.
- **Text:** soft off-white (#D5DAE3) for primary, muted grey-blue (#8A93A6) for secondary. Never pure #FFF.
- **Accent:** one cool, desaturated accent (steel blue, slate teal, or dusty indigo, e.g. #5B8DB8 or #6C7FD1). Use it sparingly: primary actions, focus states, active items. No second accent color.
- **Borders:** thin, low-contrast (1px, ~8–12% white) instead of heavy outlines.
- **Status colors:** muted versions only (dusty red, sage green, soft amber), never fully saturated.

Avoid: bright or neon colors, purple-to-pink gradients, warm tones (orange, yellow, beige), glow effects, glassmorphism, heavy drop shadows, and large blocks of saturated color.

Overall feel: calm, quiet, and restrained, more like a code editor or a pro audio tool than a marketing page. When in doubt, lower the saturation and reduce the contrast between surfaces.

Define colors as CSS variables (or theme tokens) in one place and reference them everywhere. Keep body text contrast at WCAG AA or better.
