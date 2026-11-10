# Design System & UI Guidelines: EzEdit

## 1. Aesthetic Direction & Visual Identity

EzEdit utilizes a **Precision Dark Theme** engineered for digital content creation:
- **Zero Distracting Vibrant/Neon Colors**: Panels, toolbars, and canvas backgrounds use matte neutral dark tones (`#121214`, `#1A1A1E`, `#24242A`) so photo colors are viewed without chromatic bias.
- **Sharp Clean Edges**: 4px to 6px border radii, 1px crisp borders (`#2E2E38`), and distinct active tool states.
- **Obvious Selected States**: Active tools display a crisp highlight border, illuminated icon, and subtle accent background (`#2A2A34` with `#60A5FA` indicator).

---

## 2. Color Palette & Tokens

| Token | Hex Value | Usage |
|---|---|---|
| `--color-canvas-bg` | `#0D0D10` | Main canvas workspace background behind images |
| `--color-panel-bg` | `#16161A` | Toolbars, sidebars, header, tab bar |
| `--color-panel-hover` | `#222228` | Hover state for buttons and list items |
| `--color-panel-active` | `#2A2A34` | Pressed or active tool state |
| `--color-border-subtle` | `#26262E` | Subtle dividers and grid lines |
| `--color-border-focus` | `#3E3E4C` | Focused inputs and tool borders |
| `--color-text-primary` | `#F4F4F6` | Primary labels, numbers, slider values |
| `--color-text-muted` | `#9090A0` | Tooltip hints, secondary metadata |
| `--color-accent` | `#60A5FA` | Active tool indicator and slider fill |
| `--color-ad-placeholder` | `#15151C` | Permanent ad space background |

---

## 3. Responsive Workspace Layout Rules

### Desktop (Viewport Width >= 768px)
```text
+---------------------------------------------------------------------------------------+
| Header: Logo | Tabs (Max 6: Tab 1, Tab 2 +) | Undo | Redo | Zoom | Compare | Export   |
+-------------------------------------------------------------+---------------+---------+
|                                                             | Tools Panel   | Ad Slot |
|                    Editor Canvas Window                     | (Categories & | 160x600 |
|               (Interactive Image Viewport)                  |  Sliders 0.1) | Skyscra |
|                                                             | (320px fixed) | per     |
+-------------------------------------------------------------+---------------+---------+
```

### Mobile (Viewport Width < 768px)
```text
+---------------------------------------------------------------------------------------+
| Header: Logo | Tab Title | Export | Tabs Drawer                                       |
+---------------------------------------------------------------------------------------+
|                                                                                       |
|                         Editor Canvas Window (Top)                                    |
|                                                                                       |
+---------------------------------------------------------------------------------------+
| Tools Panel (Bottom Carousel - Scroll Options One by One with Slider Sheet)           |
+---------------------------------------------------------------------------------------+
| Permanent Ad Banner (Fixed Bottom 320x50 Standard Banner)                             |
+---------------------------------------------------------------------------------------+
```

---

## 4. Slider Specifications

- All adjustment sliders require step precision of **`0.1`**.
- Double-click on slider value enables numeric keyboard input.
- Double-clicking the slider thumb or reset icon snaps back to default (`0.0`).
- Range visualization indicates center balance (negative values left, positive right).
