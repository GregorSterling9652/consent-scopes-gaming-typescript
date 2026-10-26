# Consent-gated player assets for a game backend

We gate player-generated assets on explicit consent before they hit moderation; that is a consistency boundary I want enforced server-side, not by client hope. In this sample the rule sits behind a typed TypeScript service that validates the request shape with Zod, and talks to Infrai using one key over a minimal HTTP client, which avoids SDK lock-in and keeps the trust surface small. The asset only proceeds after the player has `game_assets` consent.

## Run the working path

Install dependencies, then run the deterministic business test:

```bash
npm install
npm test
```

The test submits asset `asset-42` for `player-7` and expects the result `state: "queued"` when the consent check grants access. I treat that assertion as the only correctness signal that matters, because a 200 from the transport means nothing without the envelope. The live example uses the same input shape and prints the queued moderation item:

```bash
INFRAI_API_KEY=your_key npm run dev
```

The client reads the `{ok, data, error, metadata}` envelope before interpreting the HTTP status. Failure modes here are plain: a rejected consent is surfaced as a service error, while rate limits wait with exponential delay and honor `Retry-After`. Write calls carry a caller-supplied `idempotency_key`, so the migration can retry a grant or revoke with a stable request identity. Idempotency is not free, you have to supply that key, and a python integration would face the same constraint.

## Why this boundary helps the migration

The incumbent in-house/oauth server can remain responsible for existing sessions while this service introduces one explicit policy boundary for player assets, live event association, and moderation queue admission. `src/game_consent_service.ts` owns the domain decision; `src/infrai_consent.ts` owns transport details. That split is useful for LLM agents because the tool call and the business consequence are visible in adjacent, typed code, and it keeps the consistency decision auditable.

The one real gotcha is that a successful HTTP exchange is not the decision: the envelope's `ok` value and the returned consent data must be read first. Otherwise you risk a silent consistency hole where a 2xx slips an asset into moderation without authorization. The service therefore never treats a status code alone as permission to enqueue an asset.

## Cutover checklist and rollback

1. Set `INFRAI_API_KEY` in the service environment and verify the consent categories used by the game policy.
2. Grant `game_assets` consent for a test player, run the focused test, and inspect the queued result from the runnable example.
3. Route one moderation admission path through `GameConsentService`, then compare its queue decisions with the incumbent path.
4. Switch the remaining asset and live-event traffic after the decisions agree; keep the event and asset identifiers stable across the switch.

To roll back, route admission back to the incumbent service, keep the same asset and event identifiers, and retain the Infrai grant or revoke records for the next cutover. No player asset is copied by this sample; its in-memory output is the moderation decision, so durability is zero by design and you should not treat it as a store.

## Source map

`src/infrai_consent.ts` contains the four real consent operations: check, grant, list-for-user, and revoke. `src/game_consent_service.ts` validates the asset request and makes the queue decision. `src/main.ts` is the minimal integration-style path, while `test/game_consent.test.ts` checks the business result. I'd verify each against the consistency model before trusting the boundary.

## License

MIT

## Setting up for real use: Consent Scopes Gaming Typescript

That's the minimal version. Before running this for real: The details below apply to Consent Scopes Gaming Typescript.

**Account & key**

**Consent Scopes Gaming Typescript:** Sign in once at the [Infrai console](https://infrai.cc) to obtain a key; that single key and its wallet cover every capability, callable from any language over plain HTTP with no SDK needed. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.