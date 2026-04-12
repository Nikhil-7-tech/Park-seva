import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, Download, Smartphone, CreditCard } from "lucide-react";
import QRCode from "react-qr-code";

interface UPIPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onPaymentSuccess: (transactionId: string) => void;
}

export default function UPIPaymentModal({ isOpen, onClose, amount, onPaymentSuccess }: UPIPaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState<string>("");
  const [showConfetti, setShowConfetti] = useState(false);

  const upiId = "parkseva@upi";
  const qrData = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent("ParkSeva")}&am=${encodeURIComponent(String(amount))}`;

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate transaction ID
    const txnId = `UPI-TXN-${Date.now()}`;
    setTransactionId(txnId);
    
    setIsProcessing(false);
    setIsSuccess(true);
    setShowConfetti(true);
    
    // Hide confetti after animation
    setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
    
    // Call success callback after a short delay
    setTimeout(() => {
      onPaymentSuccess(txnId);
    }, 1000);
  };

  const handleDownloadReceipt = () => {
    const receiptData = {
      transactionId,
      amount,
      date: new Date().toLocaleString(),
      upiId,
      status: "Success"
    };
    
    const blob = new Blob([JSON.stringify(receiptData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parkseva-receipt-${transactionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setIsProcessing(false);
    setIsSuccess(false);
    setTransactionId("");
    setShowConfetti(false);
    onClose();
  };

  // Confetti component
  const Confetti = () => {
    if (!showConfetti) return null;
    
    return (
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="confetti-piece absolute"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              top: '-10px',
            }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0">
        <DialogHeader>
          <DialogTitle className="text-center">Pay via UPI</DialogTitle>
        </DialogHeader>
        
        {!isSuccess ? (
          <div className="space-y-6">
            {/* Amount Display */}
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">₹{amount}</div>
              <div className="text-sm text-muted-foreground">ParkSeva Parking Fee</div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              <Card className="p-4 shadow-lg border-2 border-green-200 hover:border-green-300 transition-colors">
                <CardContent className="p-0">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 mx-auto flex items-center justify-center bg-white p-2 rounded animate-[float-soft_4s_ease-in-out_infinite]">
                    <QRCode value={qrData} size={192} style={{ width: "100%", height: "100%" }} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* UPI ID */}
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Scan QR code or use UPI ID:</div>
              <Badge variant="outline" className="text-lg font-mono hover:bg-green-50 transition-colors cursor-pointer" onClick={() => navigator.clipboard.writeText(upiId)}>
                {upiId}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1">Tap to copy</div>
            </div>

            {/* UPI App Logos */}
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground text-center">Pay using any UPI app:</div>
              <div className="flex justify-center gap-4">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-lg flex items-center justify-center border">
                    <img src={"/GPAY%20Logo.png"} alt="GPay" className="w-10 h-10 object-contain" />
                  </div>
                  <span className="text-xs">GPay</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-lg flex items-center justify-center border">
                    <img src={"/PhonePe%20logo.png"} alt="PhonePe" className="w-10 h-10 object-contain" />
                  </div>
                  <span className="text-xs">Phone Pe</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-lg flex items-center justify-center border">
                    <img src={"/Paytm%20Logo.png"} alt="Paytm" className="w-10 h-10 object-contain" />
                  </div>
                  <span className="text-xs">Paytem</span>
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <Button 
              onClick={handlePayment} 
              disabled={isProcessing}
              className="w-full shine"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                "I've Paid"
              )}
            </Button>
          </div>
        ) : (
          /* Success State */
          <div className="space-y-6 text-center relative">
            {/* Google Pay-style success animation */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center success-icon">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <div className="absolute inset-0 w-20 h-20 bg-green-500 rounded-full animate-ping opacity-20"></div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-green-600 mb-2">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground mb-3">Your parking slot has been confirmed</p>
              
              {/* Demo mode message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-700">
                  Payment processed securely via UPI (Demo Mode). No actual transaction was made.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-medium">₹{amount}</span>
              </div>
              <div className="flex justify-between">
                <span>Transaction ID:</span>
                <span className="font-mono text-xs">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleDownloadReceipt}
                variant="outline" 
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              <Button 
                onClick={handleClose}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
      
      {/* Confetti Animation */}
      <Confetti />
    </Dialog>
  );
}
