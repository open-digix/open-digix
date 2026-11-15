# Contributing to DigiX Lab

Thank you for your interest in DigiX Lab! We welcome bug reports, feature suggestions, documentation improvements, and code contributions.

## Before you start

- Read the [README](README.md) for the current implementation and setup instructions. Designs in the [documentation](docs/README.md) do not necessarily describe implemented features.
- Search existing issues and pull requests before opening a new one. For major changes or architectural decisions, open an issue to discuss the approach first.
- Describe the expected behavior, reproduction steps (for bugs), and scope of your proposal. Do not include passwords, tokens, personal data, or internal information in issues, logs, or pull requests.

## Set up your environment

You need Docker Engine, Docker Compose v2, and an internet connection for the initial image and package downloads. From the repository root:

```sh
cp .env.example .env
# Replace the example passwords and secrets with values unique to your machine.
docker compose up --build --wait
```

See the [README](README.md) for service checks and troubleshooting. Use `docker compose down` to stop the services; **do not run `docker compose down -v`** unless you intend to delete local data.

For development outside containers, use Node.js 24 and npm. Run checks in each application directory:

```sh
cd apps/api
npm ci
npm run lint
npm run build
npm test

cd ../web
npm ci
npm run lint
npm run build
```

Note: the API's `lint` script uses `--fix` and may modify files. Review those changes before submitting.

## Submit a change

1. Create a branch for your change. Keep each pull request focused on one issue and avoid unrelated edits.
2. Add or update tests for behavior changes. Update the README or documentation if setup steps, APIs, or feature status change. For tenant-scoped data, preserve authorization checks and tenant isolation.
3. Run the relevant checks above. If you cannot run a check, explain why and describe what you verified in the pull request.
4. Explain **what changed, why, and how you tested it** in the pull request. Link related issues when applicable. Screenshots are helpful for UI changes.

Be respectful in all project discussions. If you discover a security vulnerability, **do not post exploit details, tokens, or sensitive data in a public issue**. Contact the maintainers privately before disclosure.

Before contributing third-party code or assets, make sure you have the right to share them and identify their source and license. The team has not yet finalized and published a repository license; do not assume all assets and dependencies share the same license.
