import { getStore } from "@netlify/blobs";

const STORE_NAME = "prado-challenge";
const STATE_KEY = "wtf-spain-2026";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const sitePassword = process.env.SPAIN_2026_SITE_PASSWORD;
  if (!sitePassword) {
    return jsonResponse({ error: "Prado sync not configured (missing SPAIN_2026_SITE_PASSWORD)." }, 503);
  }

  const store = getStore(STORE_NAME);

  if (req.method === "GET") {
    const url = new URL(req.url);
    const password = url.searchParams.get("password");
    if (password !== sitePassword) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const state = await store.get(STATE_KEY, { type: "json" });
    return jsonResponse({ state: state ?? null });
  }

  if (req.method === "PUT") {
    let body;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    if (body.password !== sitePassword) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const incoming = body.state;
    if (!incoming || typeof incoming !== "object") {
      return jsonResponse({ error: "state object required" }, 400);
    }

    const existing = await store.get(STATE_KEY, { type: "json" });
    const nextUpdated = Number(incoming.updatedAt) || Date.now();
    if (existing?.updatedAt && nextUpdated < existing.updatedAt) {
      return jsonResponse({ state: existing, conflict: true });
    }

    const toSave = {
      version: 3,
      updatedAt: nextUpdated,
      players: Array.isArray(incoming.players) ? incoming.players : [],
      sharedCustom: Array.isArray(incoming.sharedCustom) ? incoming.sharedCustom : [],
    };

    await store.setJSON(STATE_KEY, toSave);
    return jsonResponse({ state: toSave });
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
};
