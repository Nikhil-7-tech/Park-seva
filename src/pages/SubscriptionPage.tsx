import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Smartphone, CheckCircle } from "lucide-react";
import UPIPaymentModal from "@/components/UPIPaymentModal";

const PLANS = {
  smart_parker: { label: "Smart Parker", amount: 199, discount: 20 },
  business_pro: { label: "Business Pro", amount: 499, discount: 30 },
};

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const defaultPlan = (searchParams.get("plan") as keyof typeof PLANS) || "smart_parker";

  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [plan, setPlan] = useState<keyof typeof PLANS>(defaultPlan);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "upi">("razorpay");
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const selectedPlan = PLANS[plan];

  async function saveSubscription(transactionId: string, paymentMode: string) {
    const { error } = await (supabase as any).from("subscriptions").insert([{
      user_id: user?.id,
      name,
      email,
      plan,
      amount: selectedPlan.amount,
      payment_mode: paymentMode,
      transaction_id: transactionId,
      payment_status: "paid",
    }]);
    if (error) throw error;
  }

  async function handleRazorpay() {
    setLoading(true);
    try {
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "create-razorpay-order",
        { body: { amount: selectedPlan.amount } }
      );
      if (orderError) throw new Error(orderError.message);

      await new Promise<void>((resolve, reject) => {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: selectedPlan.amount * 100,
          currency: "INR",
          order_id: orderData.id,
          name: "Park Seva",
          description: `${selectedPlan.label} Subscription`,
          handler: async function (response: any) {
            await saveSubscription(response.razorpay_payment_id, "razorpay");
            resolve();
          },
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
          prefill: { name, email },
          theme: { color: "#3B82F6" },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      });

      toast({ title: "Subscription activated! 🎉", description: `${selectedPlan.label} plan shuru ho gaya.` });
      navigate("/book");
    } catch (e: any) {
      if (!e.message?.includes("cancelled")) {
        toast({ title: "Payment failed", description: e.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUPISuccess(transactionId: string) {
    setLoading(true);
    try {
      await saveSubscription(transactionId, "UPI");
      toast({ title: "Subscription activated! 🎉", description: `${selectedPlan.label} plan shuru ho gaya.` });
      navigate("/book");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
      setShowUPIModal(false);
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subscribe to a Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Plan Select */}
          <div className="space-y-2">
            <Label>Select Plan</Label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(PLANS) as [keyof typeof PLANS, typeof PLANS[keyof typeof PLANS]][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setPlan(key)}
                  className={`rounded-lg border p-4 text-left transition-all ${
                    plan === key ? "border-primary bg-primary/10" : "border-border hover:bg-accent"
                  }`}
                >
                  <div className="font-semibold">{val.label}</div>
                  <div className="text-2xl font-bold mt-1">₹{val.amount}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                  <div className="text-xs text-green-500 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> {val.discount}% discount on bookings
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Name & Email */}
          <div className="space-y-3">
            <div>
              <Label>Full Name</Label>
              <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aapka naam" />
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="aap@email.com" />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={paymentMethod === "razorpay" ? "default" : "outline"}
                onClick={() => setPaymentMethod("razorpay")}
                className="h-12 gap-2"
              >
                <CreditCard className="w-4 h-4" /> Razorpay
              </Button>
              <Button
                variant={paymentMethod === "upi" ? "default" : "outline"}
                onClick={() => setPaymentMethod("upi")}
                className="h-12 gap-2"
              >
                <Smartphone className="w-4 h-4" /> UPI
              </Button>
            </div>
          </div>

          {/* Summary & Pay */}
          <div className="flex items-center justify-between border rounded-lg p-4">
            <div>
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-xl font-bold">₹{selectedPlan.amount}/month</div>
              <div className="text-xs text-green-500">{selectedPlan.discount}% off on all bookings</div>
            </div>
            <Button
              disabled={loading || !name || !email}
              onClick={() => paymentMethod === "upi" ? setShowUPIModal(true) : handleRazorpay()}
              className="min-w-[130px]"
            >
              {loading ? "Processing..." : "Subscribe & Pay"}
            </Button>
          </div>

        </CardContent>
      </Card>

      <UPIPaymentModal
        isOpen={showUPIModal}
        onClose={() => setShowUPIModal(false)}
        amount={selectedPlan.amount}
        onPaymentSuccess={handleUPISuccess}
      />
    </div>
  );
}