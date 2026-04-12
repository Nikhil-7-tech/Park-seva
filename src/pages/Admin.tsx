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
        .order("created_at", { ascending: false })
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
        .update({ is_available: false, is_covered: slot.is_covered })
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
          <Card>
            <CardHeader>
              <CardTitle>Slots</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {slots?.map((s) => (
                <div key={s.id} className="flex items-center justify-between border rounded-md p-3">
                  <div className="space-y-0.5">
                    <div className="font-medium">{s.lot?.name} — #{s.slot_number}</div>
                    <div className="text-sm text-muted-foreground">
                      ₹{s.price_per_hour}/hr • Accessible: {s.is_accessible ? "Yes" : "No"} • Covered: {s.is_covered ? "Yes" : "No"}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">Available</span>
                    <Switch checked={Boolean(s.is_available)} onCheckedChange={() => toggleAvailability.mutate(s)} />
                    <Button variant="outline" size="sm" onClick={() => putOnMaintenance.mutate(s)}>Maintenance</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
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


