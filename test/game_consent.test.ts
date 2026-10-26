import assert from "node:assert/strict";
import { GameConsentService } from "../src/game_consent_service.ts";

const checked = new GameConsentService({ check: async () => ({ granted: true }) } as never);
const result = await checked.queueAsset({ asset_id: "asset-42", user_id: "player-7", title: "Sky arena skin", event_id: "event-9" });
assert.equal(result.state, "queued");
assert.equal(result.user_id, "player-7");
console.log("consent decision: queued");
