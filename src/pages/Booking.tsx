import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
declare global {
  interface Window { Razorpay: any; }
}
import { useAuth } from "@/contexts/AuthContext";
import { useParams } from "react-router-dom";
import UPIPaymentModal from "@/components/UPIPaymentModal";
import { CreditCard, Smartphone } from "lucide-react";


type Slot = Tables<"slots"> & { lot?: Tables<"parking_lots"> };
type Lot = Tables<"parking_lots">;

function hoursBetween(startISO: string, endISO: string): number {
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
}

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export default function BookingPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { lotId: lotIdFromRoute } = useParams();
  const [vehiclePlate, setVehiclePlate] = useState("MH-XX-XXXX");
  const [startTime, setStartTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return d.toISOString().slice(0, 16);
  });
  const [selectedLotId, setSelectedLotId] = useState<string | undefined>(lotIdFromRoute);
  const [selectedSlotId, setSelectedSlotId] = useState<string | undefined>(undefined);
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'upi'>('stripe');

  // Load top 3 active lots
  const { data: lots, isLoading: isLoadingLots } = useQuery<Lot[]>({
    queryKey: ["active-lots-top3"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parking_lots")
        .select("id,name,address,hourly_rate")
        .eq("is_active", true)
        .limit(3);
      if (error) throw error;
      return (data ?? []) as Lot[];
    },
  });

  // Load slots for selected lot
  const { data: slots, isLoading: isLoadingSlots } = useQuery<Slot[]>({
    queryKey: ["slots-by-lot", selectedLotId],
    enabled: !!selectedLotId,
    queryFn: async () => {
      if (!selectedLotId) return [];
      const { data, error } = await supabase
        .from("slots")
        .select("*, parking_lots(*)")
        .eq("lot_id", selectedLotId)
        .eq("is_available", true)
        .limit(200);
      if (error) throw error;
      return (data as any[]).map((row) => ({ ...row, lot: row.parking_lots })) as Slot[];
    },
  });

  // When changing lot, reset selected slot
  useEffect(() => {
    setSelectedSlotId(undefined);
  }, [selectedLotId]);

  useEffect(() => {
    if (!selectedSlotId && slots && slots.length > 0) {
      setSelectedSlotId(slots[0].id);
    }
  }, [slots, selectedSlotId]);

  const selectedSlot = useMemo(() => slots?.find((s) => s.id === selectedSlotId), [slots, selectedSlotId]);

  const hours = useMemo(() => hoursBetween(startTime, endTime), [startTime, endTime]);
  const estimatedCost = useMemo(() => (selectedSlot ? hours * ((selectedSlot as any).price ?? selectedSlot.price_per_hour ?? 0) : 0), [hours, selectedSlot]);

  const createBooking = useMutation({
    mutationFn: async (paymentData?: { transactionId: string; paymentMode: string }) => {
      if (!selectedSlot) throw new Error("Please select a slot");
      if (!isUuid(selectedSlot.id)) throw new Error("Please select a real parking slot");

      const userId = user?.id;
      if (!userId) throw new Error("Please login to book a slot");

      let paymentIntentId: string | null = null;
let paymentStatus: string = "pending";
let paymentMode: string = "mock";
let transactionId: string | null = null;

if (paymentData) {
  paymentStatus = "paid";
  paymentMode = paymentData.paymentMode;
  transactionId = paymentData.transactionId;
} else if (paymentMethod === 'stripe') {
  // Razorpay script load karo
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay load failed'));
    document.body.appendChild(script);
  });

  // ✅ Pehle order create karo
  const { data: orderData, error: orderError } = await supabase.functions.invoke(
    'create-razorpay-order',
    { body: { amount: estimatedCost } }
  );
  if (orderError) throw new Error('Order creation failed');

  // ✅ order_id ke saath Razorpay open karo
  await new Promise<void>((resolve, reject) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: estimatedCost * 100,
      currency: 'INR',
      order_id: orderData.id, // ✅ Yeh naya line
      name: 'Park Seva',
      description: `Parking Slot #${selectedSlot.slot_number}`,
      handler: function (response: any) {
        paymentStatus = 'paid';
        paymentMode = 'razorpay';
        transactionId = response.razorpay_payment_id;
        resolve();
      },
      modal: {
  ondismiss: () => reject(new Error('Payment cancelled by user')),
  escape: false,
},
      prefill: {
        email: user?.email || '',
      },
      theme: { color: '#3B82F6' },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  });
} else {
  paymentStatus = "pending";
  paymentMode = "mock";
  transactionId = `MOCK-${Date.now()}`;
}

      const insertPayload: any = {
        slot_id: selectedSlot.id,
        user_id: userId,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        total_amount: estimatedCost,
        plate_number: vehiclePlate, 
        status: "confirmed",
        payment_status: paymentStatus as any,
        stripe_payment_intent_id: paymentIntentId,
        payment_mode: paymentMode,
        transaction_id: transactionId,
        qr_code_url: null,
      };

      let insertResp = await supabase
        .from("bookings")
        .insert([insertPayload])
        .select("id")
        .single();

      if (insertResp.error && /payment_mode|transaction_id/i.test(insertResp.error.message)) {
        const fallbackPayload = { ...insertPayload };
        delete fallbackPayload.payment_mode;
        delete fallbackPayload.transaction_id;
        insertResp = await supabase
          .from("bookings")
          .insert([fallbackPayload])
          .select("id")
          .single();
      }

      if (insertResp.error) throw insertResp.error;
      const data = insertResp.data;

      await supabase.from("slots").update({ is_available: false }).eq("id", selectedSlot.id);
      const locationName = selectedSlot.lot?.name || "your selected parking lot";

  // Fire-and-forget SMS notification
try {
  const { data: profile } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", userId)
    .single();
  
  if (profile?.phone) {
    await supabase.functions.invoke('send-sms', {
      body: {
        to: profile.phone,
        message: `Booking confirmed at ${locationName}! Your parking slot is reserved.`,
      },
    });
  }
} catch (_) {}

      return data;
    },
    onSuccess: () => {
      toast({ title: "Booking confirmed", description: "Payment received and slot reserved." });
    },
    onError: (e: any) => {
      if (e.message?.includes('cancelled')) return;
      toast({ title: "Booking failed", description: e.message, variant: "destructive" });
    },
  });

  return (
    <div className={"container mx-auto p-4 max-w-4xl space-y-4" + (selectedLotId ? " pb-24 md:pb-4" : "")}>
      <Card>
        <CardHeader>
          <CardTitle>Book a Parking Slot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedLotId ? (
            <div className="space-y-3">
              <Label>Select a Parking Lot</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(lots ?? []).map((lot) => (
                  <Card key={lot.id} className="cursor-pointer hover:shadow" onClick={() => setSelectedLotId(lot.id)}>
                    <CardHeader>
                      <CardTitle className="text-base">{lot.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">{(lot as any).address ?? ""}</div>
                      <div className="mt-2 text-sm">₹{lot.hourly_rate ?? 0}/hr</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {isLoadingLots && <div className="text-sm text-muted-foreground">Loading lots...</div>}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Available Slots</Label>
                <Button variant="ghost" onClick={() => setSelectedLotId(undefined)}>Change lot</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="mb-2 block">Pick a Slot</Label>
                  <div className="rounded-lg border p-3">
                    {isLoadingSlots ? (
                      <div className="text-sm text-muted-foreground">Loading slots...</div>
                    ) : slots && slots.length > 0 ? (
                      <>
                        <div className="grid grid-cols-6 gap-2">
                          {slots.slice(0, 36).map((s) => {
                            const isSelected = selectedSlotId === s.id;
                            const isUnavailable = s.is_available === false;
                            const isAccessible = s.is_accessible;
                            return (
                              <button
                                key={s.id}
                                disabled={isUnavailable}
                                onClick={() => setSelectedSlotId(s.id)}
                                className={
                                  `h-10 rounded-md text-xs font-medium border transition-colors ` +
                                  (isUnavailable
                                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                    : isSelected
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'bg-card hover:bg-accent hover:text-accent-foreground') +
                                  (isAccessible ? ' ring-1 ring-blue-300' : '')
                                }
                                title={`#${s.slot_number}`}
                              >
                                #{s.slot_number}
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1"><span className="inline-block h-3 w-5 rounded bg-primary/80" /> Selected</div>
                          <div className="flex items-center gap-1"><span className="inline-block h-3 w-5 rounded bg-card border" /> Available</div>
                          <div className="flex items-center gap-1"><span className="inline-block h-3 w-5 rounded bg-muted" /> Unavailable</div>
                          <div className="flex items-center gap-1"><span className="inline-block h-3 w-5 rounded ring-1 ring-blue-300" /> Accessible</div>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground">No slots available for this lot.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Vehicle Plate</Label>
                    <Input className="mt-1" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Start Time</Label>
                    <Input className="mt-1" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <Input className="mt-1" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedLotId && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant={paymentMethod === 'stripe' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('stripe')}
                    className="flex items-center justify-center gap-2 h-12"
                  >
                    <CreditCard className="w-4 h-4" />
                    Razorpay
                  </Button>
                  <Button
                    variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                    onClick={() => setPaymentMethod('upi')}
                    className="flex items-center justify-center gap-2 h-12"
                  >
                    <Smartphone className="w-4 h-4" />
                    UPI
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-md p-3 gap-3">
                <div>
                  <div className="text-sm text-muted-foreground">Estimated</div>
                  <div className="font-medium">{hours} hour(s) • ₹{estimatedCost}</div>
                </div>
                <Button
                  onClick={() => {
                    if (paymentMethod === 'upi') {
                      setShowUPIModal(true);
                    } else {
                      createBooking.mutate(undefined);
                    }
                  }}
                  disabled={createBooking.isPending || !selectedSlotId}
                  className="w-full sm:w-auto"
                >
                  {createBooking.isPending ? "Processing..." : "Confirm & Pay"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <UPIPaymentModal
        isOpen={showUPIModal}
        onClose={() => setShowUPIModal(false)}
        amount={estimatedCost}
        onPaymentSuccess={(transactionId) => {
          setShowUPIModal(false);
          createBooking.mutate({ transactionId, paymentMode: 'UPI' });
        }}
      />

      {selectedLotId && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-3 z-40">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">Estimated</div>
              <div className="text-sm font-medium">{hours}h • ₹{estimatedCost}</div>
            </div>
            <Button
              onClick={() => {
                if (paymentMethod === 'upi') {
                  setShowUPIModal(true);
                } else {
                  createBooking.mutate(undefined);
                }
              }}
              disabled={createBooking.isPending || !selectedSlotId}
              className="min-w-[140px]"
              size="sm"
            >
              {createBooking.isPending ? "Processing..." : "Confirm & Pay"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
