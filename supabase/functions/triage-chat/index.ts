import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Msg { role: 'assistant' | 'user'; content?: string; text?: string }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages: rawMessages = [], language = "Hindi" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const messages = (rawMessages as Msg[]).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content ?? m.text ?? '',
    }));

    const userTurns = messages.filter((m) => m.role === 'user').length;
    const shouldFinalize = userTurns >= 3; // ask up to ~3-5 then finalize

    const systemPrompt = `You are a compassionate rural health triage assistant in India. Speak in simple ${language} (script natural to that language). Ask ONE short question at a time. Maximum 5 questions total. Be warm and use everyday words. Never diagnose definitively. Always err on the side of caution.

When you have enough information OR when the user has answered ${shouldFinalize ? '3+' : '5'} questions, you MUST call the finalize_triage tool with your assessment. Otherwise, just reply with your next single question as plain text.`;

    const tools = [{
      type: "function",
      function: {
        name: "finalize_triage",
        description: "Output the final triage assessment. Call this when you have enough information.",
        parameters: {
          type: "object",
          properties: {
            urgency_tier: { type: "string", enum: ["1", "2", "3"], description: "1=home care, 2=visit ASHA, 3=hospital urgently" },
            condition_guess: { type: "string", description: "Likely condition in simple words (English)" },
            home_remedy: { type: "string", description: "Brief care/remedy advice in simple English" },
            referral_reason: { type: "string", description: "Reason for referral if tier 2 or 3" },
            confidence_score: { type: "number", description: "0 to 1" },
          },
        },
      },
    }];

    const body: any = {
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      tools,
    };
    if (shouldFinalize) {
      body.tool_choice = { type: "function", function: { name: "finalize_triage" } };
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("AI error:", resp.status, txt);

      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded", fallback: false }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required", fallback: false }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        done: false,
        fallback: true,
        message: language === "Hindi"
          ? "नमस्ते। मुझे अभी तकनीकी दिक्कत आ रही है। कृपया बताइए, आपको सबसे ज़्यादा तकलीफ़ किस बात से है?"
          : "Hello. I'm having a technical issue right now. Please tell me what is bothering you the most.",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const choice = data.choices?.[0];
    const toolCall = choice?.message?.tool_calls?.[0];

    if (toolCall?.function?.name === "finalize_triage") {
      const args = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ done: true, result: { ...args, urgency_tier: Number(args.urgency_tier) || 1 } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = choice?.message?.content ?? "क्या आप अपने लक्षण थोड़ा और बता सकते हैं?";
    return new Response(JSON.stringify({ done: false, message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("triage-chat error:", e);
    return new Response(JSON.stringify({
      done: false,
      fallback: true,
      message: "नमस्ते। कृपया अपने लक्षण बताइए।",
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
