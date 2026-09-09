---
name: polar-pop-console
description: Build and refine Empresas Polar POP-control interfaces with the project's shadcn/ui system, SAP-aware traceability, square geometry, validated inputs, SOLID structure, and responsive polish.
---

# Empresas Polar POP-control UI system

Use this skill for any new page, component, form, dashboard, or visual refinement in the Empresas Polar POP-control workspace.

## Non-negotiable foundations

- Use the local shadcn/ui components in `components/ui` before creating a bespoke primitive. Add new primitives with `pnpm dlx shadcn@latest add <component>` and commit the generated source when it is part of the product surface.
- Import shared components through the `@/*` alias. Use `cn` from `@/lib/utils`; it is the project's single class-merging utility.
- Preserve the design tokens in `app/globals.css`. The corporate primary is `#00338D`; `#F4C542` is reserved for key action, verified traceability, and highlighted operational status.
- Geometry is deliberately square: use `rounded-none`, square icon containers, and straight borders. Do not introduce rounded cards, pills, or floating glass UI. Circular avatars are also not used in this product system.
- Keep all styling compatible with Tailwind CSS v4 and the existing shadcn `components.json` configuration.
- Treat SAP as the system of record for stock, product and order identifiers. This UI is the operational layer for evidence, delivery, location, seller, lead and revenue attribution; never imply a live SAP integration until one exists.

## Component decisions

| Need | Use | Rules |
| --- | --- | --- |
| Primary or secondary action | `Button` | Prefer a clear verb, visible focus state, and an icon only when it adds meaning. |
| Content grouping | `Card`, `CardHeader`, `CardContent`, `CardFooter` | Use for distinct information blocks; keep hierarchy explicit with `CardTitle` and `CardDescription`. |
| Short state or category | `Badge` | Keep labels concise; use outline for neutral states and the signal accent for positive movement. |
| Identity | `Avatar`, `AvatarFallback` | Use square initials or a real image with an accessible fallback. |
| Progress or completion | `Progress` | Always pair with a text value or label; color alone is insufficient. |
| Field text | `Label` + `Input` | Every input needs a label, a useful placeholder, a type, constraints, and an error/success message. |
| View switching | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Use tabs only for peer views; preserve keyboard navigation and a clear active state. |
| Visual separation | `Separator` | Prefer it to arbitrary one-off borders when the separation is semantic. |

Do not use raw `<input>` or `<button>` for product UI when a shadcn equivalent exists. Native elements are acceptable for semantic navigation or collection swatches only when they are deliberately styled and accessible.

## Engineering bar

- Apply SOLID: keep components focused, pass data through typed props, separate view composition from domain/data transformations, and avoid components that own unrelated responsibilities.
- Avoid speculative abstractions. Extract a component when it has a meaningful responsibility or a repeated visual contract.
- Treat every input as invalid until its validation rules are explicit. Use native constraints (`required`, `minLength`, `type`, and appropriate `autoComplete`) plus visible custom feedback for product flows. Set `aria-invalid`, connect `aria-describedby`, and announce errors with `role="alert"`.
- Keep server components as the default in the Next.js App Router. Add `"use client"` only for interaction, browser APIs, or state, and keep the client boundary as small as practical.
- Do not expose secrets or fetch private data in client components. Keep data access in server-only modules or route handlers.
- Use semantic HTML, keyboard-accessible controls, visible focus rings, sufficient contrast, descriptive labels, and meaningful empty/loading/error states.
- Every layout must work from 320px upward. Test at mobile, tablet, and wide desktop widths; prevent overflow and keep touch targets comfortable for sellers and advisors working in the field.
- Every delivery record must retain reference, material, quantity, seller, location, campaign and timestamp. Every attributed lead must retain its source material/campaign, point of sale, reference and attributed amount.
- Polish the details: clear hierarchy, purposeful whitespace, useful hover/active states, reduced-motion support, and no placeholder copy that looks unfinished.

## Completion checklist

Before handing off a change, run:

```bash
pnpm lint
pnpm build
```

Also inspect the rendered page at a narrow viewport and a wide viewport. Confirm there are no accidental rounded corners, unlabelled inputs, unvalidated submit paths, missing focus states, or imports that bypass the local component system.
