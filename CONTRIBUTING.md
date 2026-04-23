# Contributing to dragble-react-editor

Thank you for your interest in contributing. This guide will help you get started.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 16
- npm >= 8

## Getting Started

1. Fork and clone the repository:

```bash
git clone https://github.com/Dragble/dragble-react-editor.git
cd dragble-react
```

2. Install dependencies:

```bash
npm install
```

3. Build the package:

```bash
npm run build
```

## Development

### Project Structure

```
dragble-react/
  src/
    index.tsx          # Component and hook source (single-file library)
  dist/                # Build output (CJS + ESM + types)
  demo/                # Working demo app (Vite + React 19)
  rollup.config.js     # Rollup build configuration
  tsconfig.json        # TypeScript configuration
```

### Available Scripts

| Script              | Description                                       |
| ------------------- | ------------------------------------------------- |
| `npm run build`     | Build the package (CJS + ESM + type declarations) |
| `npm run dev`       | Build in watch mode for development               |
| `npm run typecheck` | Run TypeScript type checking                      |
| `npm run lint`      | Lint source files with ESLint                     |
| `npm test`          | Run tests with Vitest                             |
| `npm run clean`     | Remove the `dist/` directory                      |

### Running the Demo

The `demo/` directory contains a standalone Vite + React app that imports the local package via `file:..`. Use it to test your changes:

```bash
# Build the package first
npm run build

# Then run the demo
cd demo
npm install
npm run dev
```

The demo starts at [http://localhost:4010](http://localhost:4010).

For a faster feedback loop, run the library in watch mode in one terminal and the demo dev server in another:

```bash
# Terminal 1 — rebuild on source changes
npm run dev

# Terminal 2 — demo dev server
cd demo && npm run dev
```

## Making Changes

1. Create a new branch from `main`:

```bash
git checkout -b feature/your-feature
```

2. Make your changes in `src/index.tsx`.

3. Verify your changes:

```bash
npm run typecheck
npm run lint
npm run build
```

4. Test with the demo app to confirm the editor works correctly.

5. Commit your changes with a clear, descriptive message:

```bash
git commit -m "feat: add support for custom toolbar configuration"
```

### Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation changes
- `refactor:` — code changes that neither fix a bug nor add a feature
- `chore:` — maintenance tasks (deps, CI, build config)

## Pull Requests

1. Push your branch to your fork.
2. Open a pull request against the `main` branch.
3. Provide a clear description of what your changes do and why.
4. Make sure the CI checks pass (typecheck, lint, build).

## Reporting Issues

- Use [GitHub Issues](https://github.com/Dragble/dragble-react-editor/issues) to report bugs or request features.
- Include steps to reproduce the issue, expected vs. actual behavior, and your environment details (Node version, browser, OS).

## Code Style

- TypeScript strict mode is enabled.
- Follow the existing code patterns in `src/index.tsx`.
- Use JSDoc comments for public APIs.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
