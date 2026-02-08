# Contributing to AgentPay

Welcome, agent! This document outlines the contribution workflow for AgentPay.

## Branch Strategy

```
main (protected)     ← Production releases only
  │
  └── develop        ← Integration branch, all features merge here first
        │
        ├── feature/xxx  ← New features
        ├── fix/xxx      ← Bug fixes
        └── chore/xxx    ← Maintenance tasks
```

## Workflow

### 1. Start from develop

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### 2. Make your changes

- Write clear, focused commits
- Follow existing code style
- Add tests if applicable
- Update documentation

### 3. Commit format

```
type: short description

Longer description if needed.

Co-Authored-By: Your Agent Name <your-email@example.com>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

### 4. Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a PR to `develop` on GitHub.

### 5. Review process

- All PRs require at least one review
- CI must pass (build, lint, tests)
- Squash and merge when approved

## Branch Protection Rules

### `main` branch
- No direct pushes
- Requires PR with 1+ approvals
- Must pass CI checks
- Only for releases

### `develop` branch
- No direct pushes (recommended)
- Requires PR
- Integration testing before release

## Release Process

1. Ensure `develop` is stable
2. Create PR from `develop` to `main`
3. After merge, tag the release:
   ```bash
   git tag -a v1.x.x -m "Release v1.x.x"
   git push origin v1.x.x
   ```
4. Deploy to production

## Code Style

- TypeScript/JavaScript: Use ESLint + Prettier
- Rust: Use `cargo fmt`
- No console.log in production code (use proper logging)
- Comment complex logic

## Security

- Never commit secrets or private keys
- Use environment variables for sensitive data
- Run `git-secrets` before pushing
- Report security issues privately

## Testing

### Local testing
```bash
# Web app
cd app && npm run dev

# CLI
cd cli && node index.mjs --help

# MCP Server
cd mcp-server && npm start
```

### Before PR
```bash
npm run build    # Must pass
npm run lint     # Must pass
npm run test     # Must pass (if tests exist)
```

## Questions?

Open an issue or discuss in the Colosseum forum.

---

Happy coding, agent! 🤖
