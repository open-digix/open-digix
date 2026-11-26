# Audit integration

Inject `AuditService` and call `record({ tenantId, actorMembershipId, action,
resourceType, resourceId, result, metadata })` after a verified tenant context.
For role changes, publishing, or workflow decisions, pass the mutation's
PostgreSQL transaction client as the second argument so the event and mutation
commit or roll back together. `findById(tenantId, id)` always scopes reads to
the tenant. `findByResource(tenantId, resourceType, resourceId)` additionally
scopes history by record; consumers must check app/record authorization before
returning it to a user. Metadata is allowlisted per action and must never contain raw
requests, credentials, or sensitive business values.
App role assignment/revocation, application creation, and Builder draft
normalization/patching use this service inside the caller's transaction.
Builder audit metadata contains only app/revision IDs and version, never the
draft definition or source text. New role events use
`rbac.role.assigned` / `rbac.role.revoked`; older rows with
`app_role.assign` / `app_role.revoke` remain unchanged.

API 401/403 responses with a **verified** tenant membership are logged by
`AuditDenialFilter`. Rejections before tenant verification cannot safely be
attributed to a tenant; do not use the unverified `X-Tenant-Id` header as an
audit scope. Keycloak login/logout and APISIX-denied requests never reach this
API: Keycloak's user events are enabled in the realm (7-day retention) and
APISIX's sanitized access log records method, path (without query), status and
request ID. Gateway error logs are restricted to critical failures because
the OIDC plugin otherwise prints rejected request query strings. Neither
source is an `audit_logs` row and unverified requests must not be assigned a
tenant. Existing Keycloak realms must be updated separately because realm
imports do not overwrite an existing realm. Publish/decision endpoints are
not yet present; their owners must call `record` in the mutation transaction
when those operations are implemented.

Local gateway-denial check: run `sh infra/apisix/smoke-test.sh`, then
`docker compose logs --tail=50 gateway`. Expect a `401` access-log line for
`GET /v1/me` without the bearer token or query string. To verify login
events, sign in again through the Web and inspect Keycloak's Events tab in the
`digix` realm (or query the Keycloak Admin events API). Do not put passwords or
tokens in screenshots or issue logs. On an existing local realm, enable the
same event settings via Keycloak Admin Console if the realm import has
already run: Realm settings → Events → Save events (on), expiration 7 days,
event listener `jboss-logging`. The local running realm was updated through
the Admin API; a fresh realm will inherit the versioned import settings.

To run database integration tests against a **disposable migrated** PostgreSQL
instance:

```sh
AUDIT_INTEGRATION_DB=1 DB_HOST=... DB_PORT=... DB_USER=... DB_PASSWORD=... DB_NAME=... npm test -- --runInBand audit.integration
```
