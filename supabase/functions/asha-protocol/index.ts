import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { visitType, patient, measurements } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a clinical decision support assistant for ASHA workers in India following NHM protocols. Given the visit type and patient measurements, identify red flag signs, suggest the next protocol step, and decide if referral is recommended. Keep the language simple and action-oriented in English.`;

    const userMsg = `Visit type: ${visitType}
Patient: ${patient?.name} (age ${patient?.age})
Measurements:
${Object.entries(measurements || {}).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `- ${k}: ${v}`).join('\n')}`;

    const tools = [{
      type: "function",
      function: {
        name: "asha_assessment",
        description: "Output the ASHA visit assessment.",
        parameters: {
          type: "object",
          properties: {
            red_flags: { type: "array", items: { type: "string" }, description: "Specific red flag findings" },
            protocol_next_step: { type: "string", description: "What ASHA should do next per NHM protocol" },
            referral_recommended: { type: "boolean" },
            referral_reason: { type: "string" },
            visit_notes_summary: { type: "string", description: "Concise visit summary suitable for the record" },
          },
          required: ["red_flags", "protocol_next_step", "referral_recommended", "referral_reason", "visit_notes_summary"],
        },
      },
    }];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userMsg }],
        tools,
        tool_choice: { type: "function", function: { name: "asha_assessment" } },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI error:", resp.status, t);
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({
        red_flags: ["Assessment temporarily unavailable"],
        protocol_next_step: "Continue the visit using standard protocol and review the patient manually.",
        referral_recommended: false,
        referral_reason: "",
        visit_notes_summary: "AI assessment unavailable; manual clinical review advised.",
        fallback: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No assessment returned");

    const args = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(args), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("asha-protocol error:", e);
    return new Response(JSON.stringify({
      red_flags: ["Assessment temporarily unavailable"],
      protocol_next_step: "Continue the visit using standard protocol and review the patient manually.",
      referral_recommended: false,
      referral_reason: "",
      visit_notes_summary: "AI assessment unavailable; manual clinical review advised.",
      fallback: true,
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
