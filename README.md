# Control POP — Empresas Polar

Control POP es una base operativa para registrar y seguir el material POP desde el inventario SAP hasta el punto de venta, vinculando entrega, vendedor, ubicación, campaña, lead e ingreso atribuible.

La interfaz usa Next.js 16 App Router, TypeScript, Tailwind CSS v4 y shadcn/ui. La dirección visual está basada en geometría cuadrada, el azul corporativo `#00338D` y el acento de operación `#F4C542`.

## Desarrollo

Requisitos: Node.js 20.9+ y pnpm.

```bash
pnpm install
pnpm dev
```

Otros comandos:

```bash
pnpm lint
pnpm build
pnpm start
```

## Sistema de UI

Los componentes shadcn viven en `components/ui` y se pueden añadir con:

```bash
pnpm dlx shadcn@latest add <component>
```

La skill local [`polar-pop-console`](./.agents/skills/polar-pop-console/SKILL.md) define las decisiones de componentes, SOLID, validación obligatoria de inputs, accesibilidad, responsive, SAP como sistema de registro y el estándar visual del producto. Léela antes de crear o modificar una interfaz.

## Estructura

- `app/`: rutas y estilos globales del App Router.
- `components/ui/`: primitives generados por shadcn/ui.
- `components/polar-pop-console.tsx`: consola interactiva de control POP.
- `lib/pop-model.ts`: modelo tipado, datos semilla y utilidades de negocio.
- `lib/utils.ts`: helper `cn` basado en `clsx` y `tailwind-merge`.
- `.agents/skills/`: reglas específicas de trabajo para el proyecto.
