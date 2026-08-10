# Deployment and Rollback

## Components

| Component | Provider | Production identifier | Deploy command/workflow |
|---|---|---|---|
| | | | |

## Pre-deploy

- migration strategy reviewed
- secrets/environment present
- build/test gate understood
- rollback/forward-fix path ready

## Deploy

Record exact production workflow.

## Post-deploy smoke test

Record authentication, critical read, critical write, protected API, webhook if applicable, billing if applicable, and logs.

## Rollback

### Application
### Database/migrations
### Provider configuration
### Mobile

State what cannot be rolled back and what requires a forward fix.
