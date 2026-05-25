---
name: Master-Finance
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf3'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d5e3fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#444652'
  inverse-surface: '#233144'
  inverse-on-surface: '#eaf1ff'
  outline: '#757683'
  outline-variant: '#c5c5d4'
  surface-tint: '#4158b1'
  primary: '#001e6f'
  on-primary: '#ffffff'
  primary-container: '#1a358e'
  on-primary-container: '#8ea3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#bb0015'
  on-secondary: '#ffffff'
  secondary-container: '#e32027'
  on-secondary-container: '#fffbff'
  tertiary: '#25282a'
  on-tertiary: '#ffffff'
  tertiary-container: '#3b3e40'
  on-tertiary-container: '#a6a9ab'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#263f98'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb4ac'
  on-secondary-fixed: '#410003'
  on-secondary-fixed-variant: '#93000e'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0d1c2e'
  surface-variant: '#d5e3fc'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2.5rem
  gutter: 1.5rem
  margin: 2rem
---

## Brand & Style

The design system is engineered for the medical and laboratory sector, where precision and empathy must coexist. The brand personality is rooted in **trust, hygiene, and modern efficiency**. It aims to evoke a sense of calm and clinical reliability, reducing patient anxiety while providing practitioners with a high-utility interface.

The visual style is **Corporate / Modern** with a focus on high legibility and clear information hierarchy. It utilizes generous whitespace to signify cleanliness and employs a systematic approach to data visualization. The aesthetic is "clinical-plus"—functional and sterile enough to feel professional, but softened by modern UI patterns to feel approachable.

**Technical Stack Integration:**
This design system is architected for **React 19** and **Tailwind CSS v4**. It leverages CSS variables for real-time theme switching and ensures high performance through minimal DOM depth and modern standard hooks.

## Colors

The color palette is derived directly from the medical heritage of the brand.

- **Primary Navy (#1A358E):** Represents authority, stability, and intelligence. Used for primary navigation, headers, and main action buttons.
- **Medical Red (#E21F26):** Reserved for critical status indicators, emergency alerts, and laboratory "Critical" results. It should be used sparingly to maintain its impact.
- **Neutral / Slate:** A range of grays used for typography and UI borders to ensure high contrast and readability.
- **Clean White:** The primary background color, emphasizing a hygienic and open environment.

All color combinations must adhere to **WCAG 2.1 Level AA** standards, ensuring a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text.

## Typography

This design system uses a dual-font strategy. **Plus Jakarta Sans** provides a welcoming yet professional character for headings and branding elements. **Inter** is utilized for all functional body text and data-heavy interfaces due to its exceptional legibility at small sizes and high x-height.

In medical contexts where numerical precision is paramount, Inter's clear distinction between '1', 'l', and 'I' is critical. Use `tabular-nums` for laboratory results and date/time displays to ensure vertical alignment in tables.

## Layout & Spacing

The system follows a **12-column fluid grid** for desktop, collapsing to a **4-column grid** for mobile devices.

- **Desktop (1280px+):** 24px gutters, 32px side margins.
- **Tablet (768px - 1279px):** 16px gutters, 24px side margins.
- **Mobile (< 767px):** 16px gutters, 16px side margins.

A strict **8pt spacing system** governs all vertical rhythm. Components should use 16px (md) or 24px (lg) padding to ensure the UI feels airy and accessible, preventing "data-clutter" which can lead to medical interpretation errors.

## Elevation & Depth

To maintain a "hygienic" feel, this design system avoids heavy shadows. Instead, it uses **Tonal Layers** and **Low-Contrast Outlines**.

1.  **Level 0 (Surface):** The main background, purely white (#FFFFFF).
2.  **Level 1 (Card/Container):** Uses a subtle 1px border (#E2E8F0) and a soft, low-opacity shadow (4% alpha) to distinguish from the background.
3.  **Level 2 (Dropdowns/Modals):** Increased elevation with a 12% alpha shadow and a tinted primary glow to indicate interactivity.

Backdrop blurs (10px) are used behind modals to maintain context while focusing the user's attention on critical tasks like patient data entry.

## Shapes

The shape language uses **Level 2 (Rounded)** settings. This produces a 0.5rem (8px) default radius for standard components like input fields and buttons.

- **Cards/Modals:** Use `rounded-xl` (1.5rem / 24px) to create a friendly, modern container for health records.
- **Status Badges:** Use `rounded-full` (pill-shaped) to distinguish them clearly from interactive buttons.

## Components

### Patient Cards

Contain a high-level summary including name, ID, and age. Profile images are always circular. Use `headline-sm` for names and `body-sm` for metadata.

### Appointment Schedules

Utilize a vertical timeline layout. "Current" time should be marked with a Primary Navy horizontal line. Interactive slots should change background color to `primary-50` on hover.

### Lab Result Tables

Tables must use `tabular-nums`. Row height is set to `48px` minimum for touch accessibility.

- **Normal Range:** Neutral slate text.
- **Out of Range:** Bold weight with Secondary Red text and an alert icon.

### Status Badges

- **Pending:** Neutral background with Slate text.
- **Ready:** Primary Navy background with White text.
- **Critical:** Medical Red background with White text; must include a pulse animation or high-visibility icon.

### Input Fields

Strict focus states using a 2px Primary Navy outline. Error states must use the Medical Red for both the border and the descriptive helper text below the field.
