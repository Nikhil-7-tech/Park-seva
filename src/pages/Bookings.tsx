import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Booking = Tables<"bookings"> & { slot?: Tables<"slots">; lot?: Tables<"parking_lots"> };

export default function BookingsPage() {
  const userId = "00000000-0000-0000-0000-000000000000";
  const { data: bookings } = useQuery({
    queryKey: ["my-bookings", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, slots(*, parking_lots(*))")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]).map((b) => ({ ...b, slot: b.slots, lot: b.slots?.parking_lots })) as Booking[];
    },
  });

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>My Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lot / Slot</TableHead>
                <TableHead className="hidden sm:table-cell">Start → End</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Payment</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings?.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.lot?.name} — #{b.slot?.slot_number}</TableCell>
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
    </div>
  );
}


