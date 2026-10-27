# History API

No database schema migration is required. Stock calculations and stored balances are unchanged.

## Read endpoints

Both endpoints require `Authorization: Bearer <token>` and return:

```json
{ "items": [], "total": 0, "page": 1, "limit": 50 }
```

- `GET /api/stock-movements`: ADMIN, PURCHASING or ACCOUNTING. Filters: `product_id`, `ref_type`, `search` (document number, product SKU/name).
- `GET /api/audit-logs`: ADMIN only. Filters: `user_id`, `entity`, `action`, `search` (entity, action, actor name).
- Both accept positive integer `page` (maximum 10000) and `limit` (1–100, default 50). `search` is at most 100 characters. Invalid query fields return 400.
- Records are newest first by immutable ID. Decimal stock quantities and money are serialized as strings by Prisma. Stored `balance_qty` and `balance_value` are read directly; nothing is recalculated.

## Automatic audit

Successful authenticated business POST/PUT/PATCH/DELETE JSON responses create one audit row before sending the response. Actor is taken from the verified JWT; client-supplied `created_by` never determines the audit actor. Commands such as APPROVE, SUBMIT, POST and CANCEL are distinguished. Soft deletes are DEACTIVATE.

`diff` contains a bounded, sanitized submitted request and a small result summary (ID, document number, status). It is an operation record, **not** a before/after database field diff. Passwords, tokens, secrets, cookies and authorization/API keys are redacted recursively. Authentication endpoints, GET requests and failed mutations are excluded. Existing audit records are also sanitized on read.

Audit starts after this release is deployed; it does not reconstruct past actions. Audit writes are separate from already-committed business writes. If audit storage fails, the original business response is preserved to avoid duplicate retries, and a server error is logged. This is best-effort application auditing, not a transactionally guaranteed compliance trail.

## Tests

```sh
npm run build  # Generate Prisma Client on a fresh checkout.
npm test
# Only the 14 isolated unit tests (no HTTP server or database):
npm run test:unit
```

Tests use mocked persistence and a localhost HTTP server. They do not write business data or audit rows to a real database.
