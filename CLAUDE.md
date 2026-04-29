# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # Type-check (tsc -b) then bundle via rolldown-vite
npm run lint      # ESLint across all .ts/.tsx files
npm run preview   # Preview the production build locally
```

No test runner is configured yet.

## Architecture

This is a **React 19 + TypeScript + Vite** SPA. The bundler is `rolldown-vite` (a drop-in Vite replacement backed by Rolldown/OXC) — import it as `vite` in config, the override in `package.json` handles the alias.

The JSX transform uses `@vitejs/plugin-react-swc` (SWC-based Fast Refresh). Note: the **React Compiler is not compatible with SWC** — do not attempt to enable it.

### TypeScript config

`tsconfig.json` composes two references:

- `tsconfig.app.json` — covers `src/`, targets ES2022, strict mode enabled with `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, and `noUncheckedSideEffectImports`.
- `tsconfig.node.json` — covers Vite config files.

`verbatimModuleSyntax` is on: use `import type` for type-only imports.

### ESLint

Uses flat config (`eslint.config.js`) with `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh`. Currently on `tseslint.configs.recommended` (not type-checked). If stricter rules are needed, switch to `tseslint.configs.recommendedTypeChecked` and add `parserOptions.project`.
