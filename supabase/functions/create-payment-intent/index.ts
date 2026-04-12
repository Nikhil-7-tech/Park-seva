// deno-lint-ignore-file no-explicit-any
import Stripe from "https://esm.sh/stripe@16.6.0?target=deno";

export async function createPaymentIntent(amountInRupees: number): Promise<{ clientSecret: string; piId: string }> {
  const secret = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secret) throw new Error("Missing STRIPE_SECRET_KEY");
  const stripe = new Stripe(secret, { apiVersion: "2024-06-20" });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.max(50, Math.floor(amountInRupees * 100)),
    currency: "inr",
    automatic_payment_methods: { enabled: true },
  });

  return { clientSecret: paymentIntent.client_secret as string, piId: paymentIntent.id };
}

// Supabase Edge Function handler
// Endpoint: POST /create-payment-intent { amount }
export default async (req: Request): Promise<Response> => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
    const { amount } = await req.json();
    if (typeof amount !== "number" || !isFinite(amount)) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), { status: 400 });
    }
    const { clientSecret, piId } = await createPaymentIntent(amount);
    return new Response(JSON.stringify({ clientSecret, paymentIntentId: piId }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || "Server error" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
};


