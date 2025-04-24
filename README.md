# charging-session-api

> Seeded demo service. Fictional code created for a Devin demonstration. Not production software and not affiliated with any vehicle manufacturer.

Starts, meters and closes charging sessions for vehicles at public and home chargers, applies the tariff for the session, and issues a receipt.

## Build

```
npm ci
npm run build
```

## Test

```
npm test
```

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/sessions` | Start a charging session. |
| `POST` | `/sessions/:id/close` | Close a session and price it. |
| `GET` | `/sessions/search` | Look up sessions for a vehicle. |
| `GET` | `/receipts/:file` | Download a stored session receipt. |
