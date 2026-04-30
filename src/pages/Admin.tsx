import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

type Slot = Tables<"slots"> & { lot?: Tables<"parking_lots"> };
type Lot = Tables<"parking_lots">;
type Booking = Tables<"bookings"> & { slot?: Tables<"slots">; lot?: Tables<"parking_lots"> };

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [paymentModeFilter, setPaymentModeFilter] = useState<string>("all");
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const { data: slots } = useQuery({
    queryKey: ["admin-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("slots")
        .select("*, parking_lots(name)")
        .limit(100);
      if (error) throw error;
      return (data as any[]).map((row) => ({ ...row, lot: row.parking_lots })) as Slot[];
    },
  });

  const { data: lots } = useQuery({
    queryKey: ["admin-lots"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parking_lots").select("*").limit(50);
      if (error) throw error;
      return data as Lot[];
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ["admin-bookings", paymentModeFilter],
    queryFn: async () => {
      let query = supabase
        .from("bookings")
        .select("*, slots(*, parking_lots(*))")
        .order("start_time", { ascending: false })
        .limit(50);
      
      // Do not filter by payment_mode at DB level to support environments
      // where the column may not yet exist. We'll filter client-side.
      
      const { data, error } = await query;
      if (error) throw error;
      const rows = (data as any[]).map((b) => ({ ...b, slot: b.slots, lot: b.slots?.parking_lots })) as Booking[];
      return rows;
    },
  });

  const toggleAvailability = useMutation({
    mutationFn: async (slot: Slot) => {
      const { error } = await supabase.from("slots").update({ is_available: !slot.is_available }).eq("id", slot.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-slots"] });
      toast({ title: "Updated", description: "Slot availability updated" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const putOnMaintenance = useMutation({
    mutationFn: async (slot: Slot) => {
      const { error } = await supabase
        .from("slots")
        .update({ is_available: false, is_maintenance: true } as any)
        .eq("id", slot.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-slots"] });
      toast({ title: "Maintenance", description: "Slot marked as maintenance (unavailable)" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Tabs defaultValue="slots">
        <TabsList>
          <TabsTrigger value="lots">Lots</TabsTrigger>
          <TabsTrigger value="slots">Slots</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="lots">
          <Card>
            <CardHeader>
              <CardTitle>Parking Lots</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Hourly Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots?.map((lot) => (
                    <TableRow key={lot.id}>
                      <TableCell className="font-medium">{lot.name}</TableCell>
                      <TableCell>{lot.address}</TableCell>
                      <TableCell>{lot.is_active ? "Yes" : "No"}</TableCell>
                      <TableCell>₹{lot.hourly_rate ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

    <TabsContent value="slots">
    {/* Group slots by lot */}
    {lots?.map((lot) => {
    const lotSlots = slots?.filter((s) => s.lot_id === lot.id) ?? [];
    const booked = lotSlots.filter((s) => !s.is_available).length;
    const total = lotSlots.length;

    return (
      <Card key={lot.id} className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{lot.name}</CardTitle>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
                Available: {total - booked}
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
                Booked: {booked}
              </span>
              <span className="text-muted-foreground">Total: {total}</span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-muted rounded-full h-2 mt-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all"
              style={{ width: total > 0 ? `${(booked / total) * 100}%` : '0%' }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {total > 0 ? Math.round((booked / total) * 100) : 0}% occupancy
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {lotSlots.map((s) => (
              <div
               key={s.id}
               title={`#${s.slot_number} — ${s.is_available ? 'Available' : 'Booked'}`}
               onClick={() => setSelectedSlot(s)}
                  className={`
                  h-12 rounded-md flex items-center justify-center text-xs font-medium border cursor-pointer transition-all hover:scale-105
                  ${s.is_available
                    ? 'bg-green-500/20 border-green-500 text-green-400'
                     : (s as any).is_maintenance
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                     : 'bg-red-500/20 border-red-500 text-red-400'}
                  ${s.is_accessible ? 'ring-1 ring-blue-400' : ''}
                `}
              >
                #{s.slot_number}
              </div>
            ))}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 rounded bg-green-500/20 border border-green-500" />
              Available
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 rounded bg-red-500/20 border border-red-500" />
              Booked
            </span>
            <span className="flex items-center gap-1">
             <span className="inline-block w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500" />
              Maintenance
             </span>
             <span className="flex items-center gap-1">
             <span className="inline-block w-4 h-4 rounded ring-1 ring-blue-400" />
              Accessible
             </span>
          </div>
        </CardContent>
      </Card>
    );
  })}
{/* Slot Detail Popup */}
  {selectedSlot && (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setSelectedSlot(null)}>
      <div className="bg-card border rounded-xl p-6 w-80 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Slot #{(selectedSlot as any).slot_number}</h3>
          <button onClick={() => setSelectedSlot(null)} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className={selectedSlot.is_available ? 'text-green-400' : (selectedSlot as any).is_maintenance ? 'text-yellow-400' : 'text-red-400'}>
              {selectedSlot.is_available ? '🟢 Available' : (selectedSlot as any).is_maintenance ? '🟡 Maintenance' : '🔴 Booked'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Accessible</span>
            <span>{selectedSlot.is_accessible ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Covered</span>
            <span>{selectedSlot.is_covered ? 'Yes' : 'No'}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => { toggleAvailability.mutate(selectedSlot); setSelectedSlot(null); }}
          >
            {selectedSlot.is_available ? '🔴 Mark as Unavailable' : '🟢 Mark as Available'}
          </Button>
          <Button
            variant="outline"
            className="w-full border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
            onClick={() => { putOnMaintenance.mutate(selectedSlot); setSelectedSlot(null); }}
          >
            🟡 Put on Maintenance
          </Button>
        </div>
      </div>
    </div>
  )}
</TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Bookings</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Filter by payment:</span>
                  <Select value={paymentModeFilter} onValueChange={setPaymentModeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="mock">Mock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lot / Slot</TableHead>
                  <TableHead className="hidden sm:table-cell">User</TableHead>
                  <TableHead className="hidden sm:table-cell">Time</TableHead>
                    <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Payment</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(bookings ?? []).filter((b) => {
                    if (paymentModeFilter === 'all') return true;
                    const mode = (b as any).payment_mode
                      || (b as any).stripe_payment_intent_id ? 'stripe'
                      : (b as any).transaction_id?.startsWith('UPI-TXN-') ? 'UPI'
                      : (b as any).transaction_id?.startsWith('MOCK-') ? 'mock'
                      : 'N/A';
                    return mode === paymentModeFilter;
                  }).map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.lot?.name} — #{b.slot?.slot_number}</TableCell>
                      <TableCell className="hidden sm:table-cell">{b.user_id.slice(0, 8)}…</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {new Date(b.start_time).toLocaleString()} → {new Date(b.end_time).toLocaleString()}
                      </TableCell>
                      <TableCell>{b.status}</TableCell>
                      <TableCell className="hidden sm:table-cell">{b.payment_status}</TableCell>
                      <TableCell>
                        {(() => {
                          const mode = (b as any).payment_mode
                            || (b as any).stripe_payment_intent_id ? 'stripe'
                            : (b as any).transaction_id?.startsWith('UPI-TXN-') ? 'UPI'
                            : (b as any).transaction_id?.startsWith('MOCK-') ? 'mock'
                            : 'N/A';
                          return (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{mode}</span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>₹{b.total_amount}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
              </Table>
            </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


