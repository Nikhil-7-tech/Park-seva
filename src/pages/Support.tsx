import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, Clock } from "lucide-react";
import { useState } from "react";

export default function SupportPage() {
  const [openItems, setOpenItems] = useState<string[]>([]);
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-4">Help & Support</h1>
        <p className="text-xl text-muted-foreground">
          Everything you need to know about ParkSeva
        </p>
      </div>

      <div className="space-y-6">
          {/* Support Section */}
          <Card className="group hover:shadow-glow transition-all duration-500 hover:-translate-y-2 bg-card/80 backdrop-blur-sm border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                Contact Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Our team is here to help you 24/7.
              </p>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card/60 backdrop-blur-sm border border-border/50 hover:shadow-glow transition-all">
                <Mail className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Email Support</p>
                  <a 
                    href="mailto:parkseva.help@gmail.com" 
                    className="text-primary hover:underline font-medium"
                  >
                    parkseva.help@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card/60 backdrop-blur-sm border border-border/50 hover:shadow-glow transition-all">
                <Clock className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">Response Time</p>
                  <p className="text-sm text-muted-foreground">Usually within 2-4 hours</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card className="group hover:shadow-glow transition-all duration-500 hover:-translate-y-2 bg-card/80 backdrop-blur-sm border border-border/50">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Find quick answers to common questions
              </p>
            </CardHeader>
            <CardContent>
              <Accordion 
                type="multiple" 
                value={openItems} 
                onValueChange={setOpenItems} 
                className="w-full"
              >
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left">
                    How do I book a parking slot?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Booking a parking slot is simple! Just select your desired location on the map, 
                    choose your preferred time slot, select an available parking space, and confirm 
                    your payment. You'll receive a confirmation email and SMS with your booking details.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left">
                    Can I cancel my booking?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, cancellations are allowed up to 30 minutes before your slot start time. 
                    You can cancel from your bookings page and receive a full refund. Cancellations 
                    within 30 minutes may incur a small processing fee.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left">
                    Which payment methods are supported?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We accept all major credit and debit cards through Stripe's secure payment gateway. 
                    We also support UPI payments and digital wallets. All transactions are encrypted 
                    and secure.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left">
                    Can women and disabled users reserve special slots?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Absolutely! We have dedicated parking slots reserved for women and differently-abled 
                    users. These slots are located closer to entrances and are well-lit for safety. 
                    You can filter for these special slots when booking.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left">
                    What if I can't find my booked parking slot?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Each booking comes with a QR code and detailed directions to your slot. 
                    If you're having trouble locating it, our support team can guide you via 
                    phone or you can ask the on-site parking attendant for assistance.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-left">
                    Is my vehicle safe in your parking lots?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes! All our parking locations are equipped with 24/7 CCTV surveillance, 
                    security personnel, and proper lighting. We also provide insurance coverage 
                    for any damages that occur within our facilities.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}


