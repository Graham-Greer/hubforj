# Design System And Theming

## Purpose

This app must support branded, modern, calm experiences across multiple hubs without degenerating into one-off styling.

The design system is therefore not decorative. It is architecture.

## Core design-system principles

### 1. Token-first always

All reusable styling must resolve through tokens.

This includes:

- color
- spacing
- radius
- typography
- motion
- elevation
- layout constraints
- component contract values

Hard-coded visual values inside component CSS should be rare and justified.

### 2. Semantic tokens over raw palette usage

Raw palette tokens are allowed only in foundational token files.

Reusable components should prefer semantic tokens such as:

- `--surface-primary`
- `--text-primary`
- `--border-subtle`
- `--accent-primary`

This allows theme switching and template shifts without rewriting components.

### 3. Theme and template are separate concepts

- Theme controls system-wide presentation mode such as light vs dark.
- Template controls art direction and tone such as civic vs editorial vs studio.

Do not blur them.

Examples:

- light/dark is a theme concern
- display font family or shell atmosphere is a template concern

### 4. Components should not know hub branding logic

Reusable components consume semantic tokens. They do not decide hub branding.

Hub-level branding decisions should happen through:

- theme/template selection
- hub-level token overrides
- shell-level scope application

## Global styling structure

The preferred global structure is:

- `tokens.css`
  - raw scales and neutral foundations
- `semantic.css`
  - semantic token contracts derived from scales
- `theme-modes.css`
  - non-template theme selectors such as light/dark
- `styles/templates/*.css`
  - per-template visual overrides
- `base.css`
  - reset and element defaults
- `globals.css`
  - import and compose those files

If the app is temporarily using a single `globals.css`, that is transitional. It should not remain the long-term structure.

## CSS module rules

All reusable component styling must live in colocated `.module.css` files.

Rules:

- no inline styles unless there is a documented exception
- no broad global selectors inside component styles
- no page-specific styles inside reusable component modules
- no visual tokens invented ad hoc inside modules

## Spacing rules

Spacing must use the spacing scale.

Avoid:

- arbitrary values that bypass the spacing scale
- separate spacing semantics for every feature area
- layout padding that differs without reason across shells

Spacing should communicate hierarchy and rhythm, not entropy.

## Typography rules

Typography must be intentional.

Requirements:

- one default sans family
- one display family strategy
- one mono family for system and tabular contexts
- consistent size scale
- consistent weight usage
- no random font-size exceptions inside route files

## Component contract tokens

Reusable controls should use contract tokens where appropriate.

Examples:

- button padding and radius
- field padding and border
- panel radius and background
- nav item spacing and radius

This allows consistent theming without constantly editing component modules.

## Theme precedence

The precedence model should be:

1. document defaults
2. app or shell scope defaults
3. hub-level theme/template selection
4. hub token overrides
5. component local semantic consumption

Components should never override hub-level branding intent unless accessibility requires it.

## Accessibility and contrast

Theme flexibility does not excuse poor accessibility.

Requirements:

- sufficient contrast for all text and actionable states
- clear focus-visible treatment
- interactive states that do not rely on color alone
- dark theme that is intentionally designed, not inverted by accident

## Restrictions

Do not:

- hard-code hex values in reusable component modules unless the token system genuinely cannot express the need
- use gradient-heavy styling as a substitute for hierarchy
- let each route invent its own color language
- embed template-specific styling directly in generic UI components

## Design quality bar

The target is modern, calm, high-trust UI.

That means:

- restrained surfaces
- clear hierarchy
- deliberate whitespace
- obvious primary actions
- minimal cognitive noise
- visual consistency without bland sameness
