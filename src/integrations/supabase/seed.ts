import { supabase } from "./client";

function isDev(): boolean {
  return import.meta.env.MODE !== "production";
}

export async function seedSampleData(): Promise<void> {
  if (!isDev()) return;

  const seededKey = "sample-data-seeded-v2";
  if (localStorage.getItem(seededKey)) return;

  const { data: lotsExisting } = await supabase.from("parking_lots").select("id").limit(1);
  if (lotsExisting && lotsExisting.length > 0) {
    localStorage.setItem(seededKey, "true");
    return;
  }

  // Create a demo user profile if not present
  const demoUserId = crypto.randomUUID();
  await supabase.from("profiles").upsert([
    {
      id: demoUserId,
      email: "demo@easypark.dev",
      full_name: "Demo User",
      role: "user",
      vehicle_plate: "DEMO-1234",
    },
    {
      id: "00000000-0000-0000-0000-000000000001",
      email: "admin@easypark.dev",
      full_name: "Admin",
      role: "admin",
    },
  ]);

  // Insert Pune city demo lots
  const lotOwnerId = demoUserId;
  const { data: lots, error: lotErr } = await supabase
    .from("parking_lots")
    .insert([
      {
        name: "Phoenix Marketcity Pune Parking",
        address: "Viman Nagar, Pune",
        latitude: 18.5616,
        longitude: 73.9187,
        owner_id: lotOwnerId,
        hourly_rate: 40,
        total_slots: 30,
        is_active: true,
      },
      {
        name: "FC Road Public Parking",
        address: "Fergusson College Rd, Pune",
        latitude: 18.5204,
        longitude: 73.8567,
        owner_id: lotOwnerId,
        hourly_rate: 35,
        total_slots: 30,
        is_active: true,
      },
      {
        name: "Shivajinagar Multi-level Parking",
        address: "Shivajinagar, Pune",
        latitude: 18.5308,
        longitude: 73.8470,
        owner_id: lotOwnerId,
        hourly_rate: 30,
        total_slots: 30,
        is_active: true,
      },
    ])
    .select("id");

  if (lotErr || !lots) {
    console.warn("Seed lots error", lotErr);
    return;
  }

  // Create 30 slots per lot
  // - Mark some reserved for women (prefix W- in slot_number)
  // - Mark some reserved for disabled (prefix D- and is_accessible=true)
  const slotsPayload = lots.flatMap((lot, lotIdx) => {
    const perLot = 30;
    const womenReservedCount = 6; // W-01..W-06
    const disabledReservedCount = 4; // D-01..D-04
    return Array.from({ length: perLot }).map((_, i) => {
      const idx = i + 1;
      const isWomen = idx <= womenReservedCount;
      const isDisabled = idx > womenReservedCount && idx <= womenReservedCount + disabledReservedCount;
      const prefix = isDisabled ? "D-" : isWomen ? "W-" : "S-";
      return {
        lot_id: lot.id,
        slot_number: `${prefix}${String(idx).padStart(2, "0")}`,
        price_per_hour: lotIdx === 0 ? 40 : lotIdx === 1 ? 35 : 30,
        is_available: true,
        is_accessible: isDisabled ? true : false,
        is_covered: idx % 2 === 0,
        ev_supported: idx % 3 === 0 ? "level2" : "none",
        width_inches: 96,
        length_inches: 216,
      };
    });
  });

  await supabase.from("slots").insert(slotsPayload);

  localStorage.setItem(seededKey, "true");
}


