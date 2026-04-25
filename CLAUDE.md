# CLAUDE.md

## README

Always keep `README.md` up to date. Any change that affects the public interface, deployment workflow, project layout, or environment configuration must be reflected in the README before the task is considered done. This includes:

- New or removed modules and exports
- Changes to `package.json` scripts
- Changes to the deployment process (`infrastructure/deployment/deploy.sh`)
- New environment variables or configuration files
- Changes to the project directory structure

## Security

This is a **public repository**. Never hardcode sensitive values in any committed file. This includes AWS account IDs, domain names, registry URLs containing account identifiers, tokens, or credentials. Always use environment variables. Required variables must use `:?` guards in shell scripts so they fail fast when unset.

Sensitive files are gitignored: `.env`, `.npmrc`.
