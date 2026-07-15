## Fast local web validation

Use the app as a web demo. The project no longer includes Electron packaging.

### First time only

```bash
pnpm install
pnpm run setup:web
```

### Fast validation loop

```bash
pnpm run check:web
pnpm run dev:web
```

### Why this is faster

- avoids test database prep
- keeps validation focused on Next.js + Prisma only
- separates install/setup from compile/runtime

### If pnpm still feels slow

That slowdown is coming from the environment wrapper/policy checks before Next.js starts, not from the app's `dev` script itself.
