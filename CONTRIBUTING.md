# Contributing to ApiTab

Thanks for taking the time to contribute! This project is a browser extension
built with WXT, React, TypeScript, Tailwind CSS, and Zustand.

## Getting started

```bash
npm install
npm run dev          # Chrome, hot reload
npm run dev:firefox  # Firefox, hot reload
```

See the [README](README.md) for the full architecture overview, keyboard
shortcuts, and manual unpacked-build instructions.

## Before you open a pull request

1. **Type-check.** `npm run compile` must pass with no errors.
2. **Build.** `npm run build` (and `npm run build:firefox` if you touched
   anything browser-specific) must succeed.
3. **Keep the diff focused.** One logical change per PR — a bug fix doesn't
   need an accompanying refactor, and a new feature shouldn't reformat
   unrelated files.
4. **Match the existing style.** No new code comments unless they explain a
   non-obvious *why* (a hidden constraint, a workaround, a subtle invariant).
   Prefer editing existing files over adding new abstractions.
5. **Describe the change.** In the PR description, explain what changed and
   why — screenshots or a short clip are welcome for UI changes.

## Reporting bugs

Open an issue using the **Bug report** template. Include your browser + OS,
the extension version (Options page → About, or `chrome://extensions`), and
steps to reproduce. Console errors (from the extension's background
service-worker console, or the page console) are extremely helpful.

## Suggesting features

Open an issue using the **Feature request** template. Describe the problem
you're trying to solve, not just the solution — it helps evaluate whether it
fits the project's local-first, no-login-required philosophy.

## Security issues

Please **do not** open a public issue for security vulnerabilities — see
[SECURITY.md](SECURITY.md) instead.

## Code of Conduct

This project follows a [Code of Conduct](CODE_OF_CONDUCT.md). By
participating, you're expected to uphold it.

## License

By contributing, you agree that your contributions will be licensed under the
project's [MIT License](LICENSE).
