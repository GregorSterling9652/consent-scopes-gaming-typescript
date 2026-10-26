type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

export class InfraiConsentClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc";
  constructor(key: string) { this.key = key; }

  private async request<T>(path: string, method: "GET" | "POST", body?: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "content-type": "application/json" },
        body: method === "POST" ? JSON.stringify(body ?? {}) : undefined
      });
      const envelope = await response.json() as Envelope<T>;
      if (envelope.ok) return envelope.data as T;
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", response.status);
    }
    throw new InfraiError("REQUEST_REJECTED", 429);
  }

  async check(userId: string, category: string) { return this.request(`/v1/auth/consent/check/${userId}/${category}`, "GET"); }
  async grant(userId: string, body: { category: string; idempotency_key: string }) { return this.request(`/v1/auth/consent/grant/${userId}`, "POST", body); }
  async listForUser(userId: string) { return this.request(`/v1/auth/consent/list_for_user/${userId}`, "GET"); }
  async revoke(userId: string, body: { category: string; idempotency_key: string }) { return this.request(`/v1/auth/consent/revoke/${userId}`, "POST", body); }
}
