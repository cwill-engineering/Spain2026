import agentContext from "../../agent-context.json" with { type: "json" };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function buildSystemPrompt(pageContext) {
  const sections = (agentContext.sections || [])
    .map((s) => `## ${s.title}\n\n${s.content}`)
    .join("\n\n---\n\n");

  const tabHint = pageContext?.activeTab
    ? `The user is currently viewing the "${pageContext.activeTab}" tab.`
    : "";

  return `You are the trip assistant for the Williams Thomas Family Spain trip (May 26 – Jun 7, 2026), including Joe's wedding in Barcelona.

RULES:
1. For bookings, trains, lodging, times, and confirmations: answer ONLY from the trip data below. If not found, say you don't have it and suggest checking the Plan tab on the site.
2. General Spain travel tips (metro, siesta, food culture) are OK when clearly labeled as general advice — never present them as confirmed bookings.
3. Never invent confirmation numbers, seat assignments, prices, or times.
4. Be concise, family-friendly, and practical. Use bullet lists for schedules.
5. Trip involves two families: Williams and Thomas. Some train tickets may differ between groups — note when data says "to confirm."

${tabHint}

TRIP DATA (generated ${agentContext.generatedAt || "unknown"}):

${sections}`;
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const sitePassword = process.env.SPAIN_2026_SITE_PASSWORD;

  if (!apiKey) {
    return jsonResponse({ error: "Chat is not configured (missing OPENAI_API_KEY)." }, 503);
  }
  if (!sitePassword) {
    return jsonResponse({ error: "Chat is not configured (missing SPAIN_2026_SITE_PASSWORD)." }, 503);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { password, messages, pageContext } = body;

  if (password !== sitePassword) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return jsonResponse({ error: "messages array required" }, 400);
  }

  if (messages.length > 24) {
    return jsonResponse({ error: "Conversation too long. Clear chat and try again." }, 400);
  }

  const validMessages = messages.filter(
    (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
  );

  if (!validMessages.length || validMessages[validMessages.length - 1].role !== "user") {
    return jsonResponse({ error: "Last message must be from user" }, 400);
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: buildSystemPrompt(pageContext) }, ...validMessages],
        max_tokens: 800,
        temperature: 0.4,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.error?.message || `OpenAI error (${res.status})`;
      return jsonResponse({ error: msg }, 502);
    }

    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      return jsonResponse({ error: "Empty response from model" }, 502);
    }

    return jsonResponse({ reply });
  } catch (err) {
    return jsonResponse({ error: err.message || "Request failed" }, 500);
  }
};
