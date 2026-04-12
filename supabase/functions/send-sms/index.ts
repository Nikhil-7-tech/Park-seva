// deno-lint-ignore-file no-explicit-any

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type SmsRequest = {
  to: string;
  message: string;
};

const FAST2SMS_API_KEY = Deno.env.get("FAST2SMS_API_KEY");

export default async function handler(req: Request): Promise<Response> {
 if (req.method === 'OPTIONS') {
  return new Response(null, { 
    status: 204,
    headers: corsHeaders 
  });
}

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { to, message } = (await req.json()) as SmsRequest;

    if (!to || !message) {
      return new Response(JSON.stringify({ error: "to and message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!FAST2SMS_API_KEY) {
      throw new Error("Missing FAST2SMS_API_KEY");
    }

    const phone = to.replace(/^\+91/, "");

    const resp = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": FAST2SMS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message: message,
        language: "english",
        flash: 0,
        numbers: phone,
      }),
    });

    const json = await resp.json().catch(() => ({}));

    if (!json.return) {
      throw new Error(json.message?.[0] || "Fast2SMS error");
    }

    return new Response(JSON.stringify({ ok: true, result: json }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}