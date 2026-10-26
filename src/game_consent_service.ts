import { z } from "zod";
import { InfraiConsentClient } from "./infrai_consent.ts";

export const assetRequest = z.object({ asset_id: z.string(), user_id: z.string(), title: z.string(), event_id: z.string() });
export type AssetRequest = z.infer<typeof assetRequest>;
export type ModerationItem = AssetRequest & { state: "queued" };

export class GameConsentService {
  private client: InfraiConsentClient;
  constructor(client: InfraiConsentClient) { this.client = client; }

  async queueAsset(input: unknown): Promise<ModerationItem> {
    const asset = assetRequest.parse(input);
    const consent = await this.client.check(asset.user_id, "game_assets");
    if (!consent) throw new Error("consent_required");
    return { ...asset, state: "queued" };
  }
}
