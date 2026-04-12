// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import { createClient } from "jsr:@supabase/supabase-js@2";

const FAST2SMS_API_KEY          = Deno.env.get("FAST2SMS_API_KEY");
const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const REMIND_BEFORE_END_MINUTES = 15;

interface ReminderRow {
  booking_id: string;
  start_time: string;
  end_time: string;
  vehicle_plate: string | null;
  lot_name: string | null;
  slot_number: string | null;
  phone: string | null;
  user_id: string;
}

async function sendSmsViaFast2SMS(to: string, message: string): Promise<void> {
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
    throw new Error(json.message?.[0] || `Fast2SMS error: ${resp.status}`);
  }
}

function buildMessage(row: ReminderRow): string {
  const endFormatted = new Date(row.end_time).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
  const lot = row.lot_name || "your parking lot";
  const slot = row.slot_number ? ` (Slot #${row.slot_number})` : "";
  const vehicle = row.vehicle_plate ? ` for ${row.vehicle_plate}` : "";
  return (
    `ParkSeva Alert: Your parking time${vehicle} at ${lot}${slot}` +
    ` is ending in ${REMIND_BEFORE_END_MINUTES} minutes (${endFormatted} IST).` +
    ` Please move your vehicle or extend your booking to avoid extra charges.`
  );
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();
  const windowStart = new Date(now.getTime() + (REMIND_BEFORE_END_MINUTES - 2) * 60 * 1000);
  const windowEnd   = new Date(now.getTime() + (REMIND_BEFORE_END_MINUTES + 3) * 60 * 1000);

  const { data: bookings, error: fetchError } = await supabase
    .from("bookings")
    .select(`
      id,
      start_time,
      end_time,
      plate_number,
      user_id,
      slots (
        slot_number,
        parking_lots ( name )
      ),
      profiles!inner ( phone )
    `)
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gte("end_time", windowStart.toISOString())
    .lte("end_time", windowEnd.toISOString());

  if (fetchError) {
    console.error("Fetch error:", fetchError.message);
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!bookings || bookings.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, sent: 0, message: "No expiry reminders due right now" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const results: { booking_id: string; status: string; error?: string }[] = [];

  for (const b of bookings as any[]) {
    const phone: string | null = b.profiles?.phone ?? null;
    if (!phone) {
      results.push({ booking_id: b.id, status: "skipped_no_phone" });
      continue;
    }
    const row: ReminderRow = {
      booking_id:    b.id,
      start_time:    b.start_time,
      end_time:      b.end_time,
      vehicle_plate: b.plate_number,
      user_id:       b.user_id,
      lot_name:      b.slots?.parking_lots?.name ?? null,
      slot_number:   b.slots?.slot_number ?? null,
      phone,
    };
    try {
      await sendSmsViaFast2SMS(phone, buildMessage(row));
      await supabase
        .from("bookings")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", b.id);
      results.push({ booking_id: b.id, status: "sent" });
      console.log(`Reminder sent → booking ${b.id} | phone ${phone}`);
    } catch (e: any) {
      results.push({ booking_id: b.id, status: "failed", error: e.message });
      console.error(`SMS failed for booking ${b.id}:`, e.message);
    }
  }

  const sentCount = results.filter((r) => r.status === "sent").length;
  return new Response(
    JSON.stringify({ ok: true, sent: sentCount, total: bookings.length, results }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}