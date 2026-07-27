# DarkWatch Pro — Design Tokens Reference

Extracted from the original static HTML site (17 pages, ~900KB of CSS).

## Color System

### Dark Mode (Default) — Green & Black

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#000000` | Page backgrounds |
| `--bg-secondary` | `#0a0a0a` | Card backgrounds, sidebar |
| `--bg-tertiary` | `#111111` | Input backgrounds, hover states |
| `--bg-quaternary` | `#1a1a1a` | Elevated surfaces |
| `--border-color` | `#333333` | Default borders |
| `--border-color-light` | `#444444` | Subtle borders |
| `--border-color-dark` | `#222222` | Strong borders |
| `--text-primary` | `#ffffff` | Headings, primary text |
| `--text-secondary` | `#cccccc` | Body text |
| `--text-muted` | `#a0a0a0` | Captions, timestamps |
| `--text-disabled` | `#666666` | Disabled elements |
| `--accent-primary` | `#00ff88` | Brand green, CTAs, active states |
| `--accent-secondary` | `#00cc6a` | Gradient end, hover states |
| `--accent-tertiary` | `#00ffaa` | Accent variations |
| `--accent-light` | `#33ff99` | Light accent |
| `--success` | `#00ff88` | Success states (same as accent in dark) |
| `--warning` | `#ff9500` | Warnings |
| `--danger` | `#ff4444` | Errors, critical alerts |
| `--info` | `#00ccff` | Information states |

### Light Mode — Purple & White

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#ffffff` | Page backgrounds |
| `--bg-secondary` | `#f8f9fa` | Card backgrounds |
| `--bg-tertiary` | `#f1f3f4` | Input backgrounds |
| `--bg-quaternary` | `#e8eaed` | Elevated surfaces |
| `--border-color` | `#dadce0` | Default borders |
| `--text-primary` | `#202124` | Headings |
| `--text-secondary` | `#5f6368` | Body text |
| `--text-muted` | `#9aa0a6` | Captions |
| `--accent-primary` | `#6f42c1` | Brand purple, CTAs |
| `--accent-secondary` | `#5a32a3` | Gradient end |
| `--success` | `#6f42c1` | Success (same as accent) |
| `--warning` | `#f59e0b` | Warnings |
| `--danger` | `#ef4444` | Errors |
| `--info` | `#3b82f6` | Information |

## Typography

| Property | Value |
|----------|-------|
| Primary Font | Inter (300-800) |
| Secondary Font | Poppins (300-700) |
| Display Font | Playfair Display (400-700) |
| Monospace Font | JetBrains Mono (300-600) |
| Fallback | -apple-system, BlinkMacSystemFont, sans-serif |

### Font Scale

| Token | Size | Usage |
|-------|------|-------|
| `--fs-xs` | 0.75rem | Badges, tiny labels |
| `--fs-sm` | 0.8rem | Small text, status |
| `--fs-base` | 0.9rem | Default body |
| `--fs-md` | 0.95rem | Navigation, labels |
| `--fs-lg` | 1rem | Standard text |
| `--fs-xl` | 1.1rem | Emphasized text |
| `--fs-2xl` | 1.2rem | Subtitles |
| `--fs-3xl` | 1.5rem | Card titles |
| `--fs-4xl` | 1.8rem | Section titles |
| `--fs-5xl` | 2rem | Page titles |
| `--fs-6xl` | 2.25rem | Large titles |
| `--fs-7xl` | 2.5rem | Hero subtitles |
| `--fs-8xl` | 3rem | Stats, pricing |
| `--fs-9xl` | 3.5rem | Page heroes |
| `--fs-10xl` | 4rem | Main hero heading |

## Spacing

8-point scale: 0.25rem, 0.5rem, 0.75rem, 1rem, 1.25rem, 1.5rem, 2rem, 2.5rem, 3rem, 4rem, 5rem, 6rem, 8rem, 10rem

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small elements |
| `--radius-md` | 6px | Inputs, badges |
| `--radius-lg` | 8px | Buttons, cards |
| `--radius-xl` | 12px | Cards, modals |
| `--radius-2xl` | 16px | Feature cards, pricing |
| `--radius-3xl` | 20px | Pills, badges |
| `--radius-full` | 50% | Avatars, icons |

## Layout Constants

| Property | Value |
|----------|-------|
| Sidebar width | 250px (some pages 280px) |
| Container max | 1200px (public), 1400px (app) |
| Navbar z-index | 1000 |
| Modal z-index | 2000 |

## Key Patterns

### Sidebar Navigation (App pages)
- Fixed left sidebar, 250px wide
- Logo at top, nav links below
- Credit balance at bottom
- Collapses to hidden on mobile (<1024px), hamburger toggle

### Card Pattern
- Background: `var(--bg-secondary)`
- Border: `1px solid var(--border-color)` (or 2px for emphasis)
- Border radius: 12px
- Hover: border-color → `var(--accent-primary)`, translateY(-2px), shadow

### Button Variants
- **Primary**: Gradient bg (accent-primary → accent-secondary), dark text
- **Outline**: Transparent bg, accent border, accent text → fills on hover
- **Danger**: Red background, dark text
- **Sizes**: sm (0.25rem 0.5rem), default, lg (1rem 2rem)

### Form Inputs
- Background: `var(--bg-tertiary)` 
- Border: `1px solid var(--border-color)` → `var(--accent-primary)` on focus
- Border radius: 6-8px
- Focus: `box-shadow: 0 0 0 4px rgba(111, 66, 193, 0.1)`

### Theme Toggle
- Dark mode = default (no data-theme attribute)
- Light mode = `[data-theme="light"]` on `<html>`
- Stored in localStorage as `darkwatch-theme`
- Toggle button appears in header/user-menu area