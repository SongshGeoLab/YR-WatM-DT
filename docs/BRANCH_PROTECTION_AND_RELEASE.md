# Branch Protection and Release Workflow

This document standardizes how we protect branches and publish releases for `YR-WatM-DT`.

## Branch Strategy

- Main branches:
  - `master`: stable, deployable at any time. Only updated via PR from `dev`.
  - `dev`: active development. Feature branches merge here via PR.
- Supporting branches:
  - `feature/*`: short‑lived branches for new features or refactors.
  - `fix/*`: hotfix branches for urgent bug fixes.

## GitHub Branch Protection (master)

Recommended settings in GitHub → Settings → Branches → Add rule:

1. Branch name pattern: `master`
2. Enable:
   - Require a pull request before merging
   - Require approvals: 1 (or more for your team)
   - Dismiss stale pull request approvals when new commits are pushed
   - Require status checks to pass before merging
     - Add checks you use (e.g., CI, lint, build)
   - Require conversation resolution before merging
   - Include administrators (optional but recommended)
   - Restrict who can push to matching branches (optional)

Minimal setup without CI: enable PR requirement and approvals.

## Release Cadence

- Regular release from `master` (e.g., bi‑weekly) after `dev` has accumulated changes and tested locally.
- Hotfix release: create `fix/*` from `master`, PR back into `master` and `dev`.

## Release Steps (no CI)

1. Ensure local `dev` is up to date and stable.
2. Fast‑forward `master` to `dev` locally:
   ```bash
   git checkout master
   git reset --hard dev
   git push origin master --force-with-lease
   ```
3. Tag a version:
   ```bash
   git tag -a vX.Y.Z -m "release: vX.Y.Z"
   git push origin vX.Y.Z
   ```
4. Draft GitHub Release:
   - Go to Releases → Draft a new release
   - Choose tag `vX.Y.Z`, set title and highlights

## Pull Request Template (suggested)

When opening PRs into `dev` or `master`, include:

- Summary: what and why
- Type: feature / fix / chore / docs
- Testing: how it was verified
- Impact: breaking changes, migrations, data updates

## Versioning Guidelines

- Use SemVer: MAJOR.MINOR.PATCH
  - MAJOR: breaking changes
  - MINOR: new features, backwards compatible
  - PATCH: bug fixes and docs

## Local Quality Gates (suggested)

Before merging into `dev` or releasing to `master`:

- Backend:
  - `poetry install`
  - `flake8` and run key scripts
- Frontend:
  - `cd viz && npm i && npm run build`

## FAQ

- Why do I need `--force-with-lease` when syncing `master` to `dev`?
  - Because histories can diverge; this flag safely forces while protecting others' work.
- Can I release directly from `dev`?
  - Avoid it. Always move changes to `master` first, then tag.
