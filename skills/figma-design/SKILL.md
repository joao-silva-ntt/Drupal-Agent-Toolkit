---
name: figma-design
description: "Access and work with Figma designs, components, and design systems. Use when user provides Figma URLs, asks about design specifications, needs to extract design tokens, compare implementation with mockups, or generate code from Figma components. Works with Figma MCP server to retrieve design data."
argument-hint: "Figma file URL or design-related query (e.g., 'extract colors from [URL]', 'get component specs', 'compare button with design')"
---

# Figma Design Integration

Before project-specific design work, load `docs/AGENT_PROJECT.md` and
`docs/agent-project.json` for approved design files, component maps, tokens,
and integration tools. Use only a user-provided or profile-approved design
source; never upload private source code or assets to an external service.

## When to Use

- User provides a Figma file or component URL
- Extracting design tokens (colors, typography, spacing, border radius, shadows)
- Reviewing design mockups and specifications
- Comparing live implementation with Figma designs
- Generating component code from Figma designs
- Understanding component structure and variants
- Checking design system consistency
- Getting exact measurements and styles

## Do Not Use When

- General design questions without a specific Figma file
- Creating new designs (Figma is view-only through API)
- User asks about non-Figma design tools
- The task is pure frontend implementation without design reference

---

## Available MCP Tools

Discover the connected Figma integration's tools and schemas before calling
them. Servers expose different tool names, parameters and capabilities; do
not assume file, node, token extraction or comparison tools exist.

Prefer the narrowest available node request for the approved design source.
If the integration is absent or blocked, report that limitation instead of
inventing design measurements or installing/configuring a server without
approval.

---

## Figma URL Patterns

Figma uses specific URL patterns to identify files, nodes, and components:

### File URL
```
https://www.figma.com/file/{file-key}/{file-name}
```

### Specific Node/Frame URL
```
https://www.figma.com/file/{file-key}/{file-name}?node-id={node-id}
```

### Design File URL
```
https://www.figma.com/design/{file-key}/{file-name}
```

**Extracting IDs:**
- File key: The alphanumeric string after `/file/` or `/design/`
- Node ID: The parameter `node-id=123-456` (often formatted as `123:456`)

---

## Design Token Extraction

### Colors

When extracting colors from Figma:

```yaml
# Expected output format
colors:
  primary:
    50: '#f0f9ff'
    100: '#e0f2fe'
    500: '#0ea5e9'
    900: '#0c4a6e'
  neutral:
    white: '#ffffff'
    black: '#000000'
    gray-100: '#f3f4f6'
```

**Usage in Drupal:**
- Add to theme's `_colors.scss` or CSS custom properties
- Use for Tailwind/utility CSS configuration
- Map to SDC component prop enums

### Typography

```yaml
typography:
  fontFamily:
    sans: 'Inter, system-ui, sans-serif'
    serif: 'Georgia, serif'
  fontSize:
    xs: '0.75rem'    # 12px
    sm: '0.875rem'   # 14px
    base: '1rem'     # 16px
    lg: '1.125rem'   # 18px
    xl: '1.25rem'    # 20px
  fontWeight:
    normal: 400
    medium: 500
    semibold: 600
    bold: 700
  lineHeight:
    tight: 1.25
    normal: 1.5
    relaxed: 1.75
```

### Spacing

```yaml
spacing:
  0: '0'
  1: '0.25rem'   # 4px
  2: '0.5rem'    # 8px
  3: '0.75rem'   # 12px
  4: '1rem'      # 16px
  6: '1.5rem'    # 24px
  8: '2rem'      # 32px
  12: '3rem'     # 48px
  16: '4rem'     # 64px
```

### Border Radius

```yaml
borderRadius:
  none: '0'
  sm: '0.125rem'  # 2px
  DEFAULT: '0.25rem'  # 4px
  md: '0.375rem'  # 6px
  lg: '0.5rem'    # 8px
  xl: '0.75rem'   # 12px
  full: '9999px'
```

---

## Common Workflows

### 1. Extract Design System Tokens

**User provides:** Figma design system file URL

**Steps:**
1. Use `get_figma_file` to retrieve file structure
2. Use `get_figma_styles` to extract color/text styles
3. Parse Auto Layout constraints for spacing scale
4. Identify border radius patterns from components
5. Export as SCSS variables, CSS custom properties, or Tailwind config

**Output:** Configuration file with all design tokens

### 2. Component Specification

**User provides:** Link to specific Figma component

**Steps:**
1. Use `get_figma_node` with the node ID
2. Extract:
   - Dimensions (width, height, constraints)
   - Colors (fills, strokes)
   - Typography (font family, size, weight, line height)
   - Spacing (padding, gaps from Auto Layout)
   - Border radius, shadows, effects
3. List component variants and their differences
4. Identify states (default, hover, active, disabled)

**Output:** Detailed specification for implementation

### 3. Design-to-Code Generation

**User provides:** Figma component URL

**Steps:**
1. Analyze component structure and hierarchy
2. Map Figma layers to HTML semantic elements
3. Extract exact styles
4. Generate appropriate code:
   - **Drupal SDC:** `.component.yml` + `.twig` + `.scss`
   - **React:** JSX component with Tailwind classes
   - **Plain HTML:** Semantic markup with CSS
5. Include prop definitions for variants
6. Add accessibility attributes

**Output:** Production-ready component code

### 4. Design vs Implementation Comparison

**User provides:** Figma URL + component name in codebase

**Steps:**
1. Extract Figma component specifications
2. Analyze implemented component (CSS, Twig, SCSS)
3. Compare:
   - Colors (exact hex values)
   - Typography (font family, size, weight, line height)
   - Spacing (padding, margin, gaps)
   - Border radius, shadows
   - Responsive behavior
4. List discrepancies with exact differences

**Output:** Discrepancy report with fixes

### 5. Icon/Asset Export

**User provides:** Figma file with icons or assets

**Steps:**
1. Identify vector layers suitable for SVG export
2. Use `extract_assets` to get SVG code
3. Optimize SVGs (remove unnecessary attributes)
4. For Drupal: Save to theme assets or create inline SVG components
5. Document icon names and usage

**Output:** Optimized SVG files or inline SVG code

---

## Drupal-Specific Integration

### SDC Component Generation from Figma

When generating Drupal SDC components from Figma:

**1. Component.yml Structure**

```yaml
'$schema': 'https://git.drupalcode.org/project/drupal/-/raw/11.x/core/modules/sdc/src/metadata.schema.json'
name: [Component Name from Figma]
status: stable
group: [Atoms|Molecules|Organisms based on complexity]
description: "[Description from Figma component description]"

props:
  type: object
  properties:
    # Map Figma variants to props
    variant:
      type: string
      title: "Variant"
      enum: [primary, secondary, tertiary]  # From Figma variants
      default: primary
    size:
      type: string
      title: "Size"
      enum: [sm, md, lg]  # From Figma size variants
      default: md
```

**2. SCSS from Figma Styles**

```scss
.component-name {
  // Extract from Figma Auto Layout
  display: flex;
  flex-direction: column;  // or row
  gap: var(--spacing-4);   // From Figma gap
  padding: var(--spacing-6);  // From Figma padding

  // Extract from Figma fills
  background-color: var(--color-primary-500);

  // Extract from Figma effects
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

**3. Responsive Breakpoints**

Map Figma frames to Drupal theme breakpoints:

```yaml
# In [theme_name].breakpoints.yml
[theme].mobile:
  label: Mobile
  mediaQuery: '(max-width: 767px)'  # Figma: 375px-767px frames
[theme].tablet:
  label: Tablet
  mediaQuery: '(min-width: 768px) and (max-width: 1023px)'  # Figma: 768px-1023px
[theme].desktop:
  label: Desktop
  mediaQuery: '(min-width: 1024px)'  # Figma: 1024px+ frames
```

### Color Token Integration

Convert Figma color styles to theme color system:

**Option A: SCSS Variables**
```scss
// _colors.scss - generated from Figma
$color-primary-50: #f0f9ff;
$color-primary-500: #0ea5e9;
$color-primary-900: #0c4a6e;
```

**Option B: CSS Custom Properties**
```css
/* In theme's base stylesheet */
:root {
  --color-primary-50: #f0f9ff;
  --color-primary-500: #0ea5e9;
  --color-primary-900: #0c4a6e;
}
```

**Option C: Tailwind Config** (if using Tailwind CSS)
```javascript
// tailwind.config.js - generated from Figma
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          900: '#0c4a6e',
        }
      }
    }
  }
}
```

---

## Best Practices

### 1. Design Token Naming

**Figma to Code Mapping:**
- Figma: `Primary/500` → Code: `primary-500` or `--color-primary-500`
- Figma: `Heading/H1` → Code: `heading-h1` or `--font-heading-h1`
- Figma: `Spacing/Large` → Code: `spacing-lg` or `--spacing-lg`

**Use semantic names when possible:**
- Instead of `blue-500`, use `primary-500`
- Instead of `16px`, use `spacing-4` (4 × 4px scale)

### 2. Component Variants

Map Figma component variants to props:

**Figma variants:**
- Type: Primary, Secondary, Tertiary
- Size: Small, Medium, Large
- State: Default, Hover, Active, Disabled

**SDC props:**
```yaml
buttonType:
  type: string
  enum: [primary, secondary, tertiary]
  default: primary
size:
  type: string
  enum: [sm, md, lg]
  default: md
```

### 3. Accessibility Considerations

When converting Figma to code:

- **Color contrast:** Verify Figma colors meet WCAG AA (4.5:1 for text)
- **Focus states:** If Figma doesn't show focus, add standard focus rings
- **ARIA labels:** Add even if not in Figma mockups
- **Semantic HTML:** Use proper elements (`<button>`, `<nav>`, `<article>`)
- **Alt text:** Add for all images, icons with meaning

### 4. Responsive Adaptation

Figma often shows discrete breakpoints. Implement fluid between:

```scss
// Instead of fixed sizes
.component {
  // Fluid typography
  font-size: clamp(1rem, 0.9rem + 0.5vw, 1.5rem);

  // Fluid spacing
  padding: clamp(1rem, 2vw, 2rem);

  // Container queries for true component-level responsive
  container-type: inline-size;
}
```

### 5. Design System Maintenance

**Keep Figma as source of truth:**
1. Document which Figma file/page contains design tokens
2. Re-extract tokens when Figma updates
3. Use version control to track design token changes
4. Set up CI/CD to validate token consistency

---

## Troubleshooting

### "Cannot access Figma file"

**Causes:**
- File is private and token lacks permission
- File was deleted or moved
- Invalid file key in URL

**Fixes:**
- Verify Figma access token has correct scope
- Check file sharing settings in Figma
- Ensure file URL is correct and complete

### "Node not found"

**Causes:**
- Node ID is incorrect or formatted wrong
- Node was deleted in Figma
- Wrong file being accessed

**Fixes:**
- Copy URL directly from Figma (right-click frame → "Copy link")
- Node IDs use format `123:456` not `123-456` in API
- Verify file key matches node location

### "Style extraction incomplete"

**Causes:**
- Styles use complex fills (gradients, images)
- Styles defined locally not as shared styles
- Effects not supported by export format

**Fixes:**
- Use shared color/text styles in Figma
- Manually document complex styles
- Export gradients as separate definitions

### "Design tokens don't match implementation"

**Causes:**
- Implementation uses different naming convention
- Tokens were extracted from old Figma version
- Manual overrides in code

**Fixes:**
- Re-extract tokens from current Figma file
- Establish naming convention mapping
- Use CSS custom properties for easier updates

---

## Example Prompts

**Design token extraction:**
```
"Extract all colors from this Figma design system: [URL]"
"Get typography scale from [Figma file] and generate SCSS variables"
"Convert spacing values from [Figma file] to Tailwind config"
```

**Component generation:**
```
"Generate a Drupal SDC component from this Figma button: [URL]"
"Create React component matching this Figma card design: [URL]"
"Show me the CSS for this hero section: [Figma URL]"
```

**Comparison:**
```
"Compare my button component with the Figma design: [URL]"
"What's different between my CSS and this Figma component: [URL]"
"Check if my spacing matches the Figma design system: [URL]"
```

**Specifications:**
```
"What are the exact dimensions of this component: [URL]"
"List all variants of this button: [URL]"
"What colors are used in this design: [URL]"
```

---

## Integration Checklist

When starting Figma integration:

- [ ] Figma MCP server installed and configured
- [ ] Figma personal access token generated
- [ ] Access token has correct permissions (file:read scope)
- [ ] Test with public Figma community file first
- [ ] Identify main design system file URL
- [ ] Document design token naming conventions
- [ ] Set up design token export workflow
- [ ] Configure CI/CD to validate design tokens (optional)
- [ ] Train team on Figma URL patterns for assistance requests

---

## Related Skills

- **drupal-sdc-components** - For implementing Figma designs as SDC components
- **drupal-theme-development** - For theme-level design system integration
- **atomic-design** - For organizing Figma components into atomic hierarchy
- **frontend-developer** - For general frontend implementation

---

## Additional Resources

**Figma API Documentation:**
- https://www.figma.com/developers/api

**Design Token Standards:**
- https://design-tokens.github.io/community-group/format/

**Figma to Code Tools:**
- Anima plugin for Figma
- Figma Dev Mode
- Design Token plugins for Figma
