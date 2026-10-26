import { InfraiConsentClient } from "./infrai_consent.ts";
import { GameConsentService } from "./game_consent_service.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("INFRAI_API_KEY is required");
const infrai = new InfraiConsentClient(key);
const service = new GameConsentService(infrai);
const queued = await service.queueAsset({ asset_id: "asset-42", user_id: "player-7", title: "Sky arena skin", event_id: "event-9" });
console.log(JSON.stringify(queued));
