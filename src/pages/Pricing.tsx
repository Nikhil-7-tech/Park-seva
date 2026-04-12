import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, Star, Zap, Shield, Clock, MapPin, Car, CreditCard, Users, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export default function PricingPage() {
  const pricingPlans = [
    {
      name: "Pay-Per-Use",
      price: "₹0",
      period: "/month",
      description: "Perfect for occasional parking needs",
      features: [
        "Pay only when you park",
        "₹20-50 per hour (location dependent)",
        "Basic slot booking",
        "Email confirmations",
        "Standard customer support",
        "Mobile app access",
        "Real-time availability"
      ],
      buttonText: "Start Parking",
      buttonVariant: "outline" as const,
      popular: false,
      color: "from-gray-500/10 to-gray-600/10",
      borderColor: "border-gray-200"
    },
    {
      name: "Smart Parker",
      price: "₹199",
      period: "/month",
      description: "Best value for regular commuters",
      features: [
        "20% discount on all bookings",
        "Priority slot reservations",
        "Advanced booking (7 days ahead)",
        "SMS + Email notifications",
        "Premium customer support",
        "Booking history & analytics",
        "Reserved slot preferences",
        "Quick rebooking options"
      ],
      buttonText: "Choose Smart Parker",
      buttonVariant: "default" as const,
      popular: true,
      color: "from-primary/10 to-primary/20",
      borderColor: "border-primary/30"
    },
    {
      name: "Business Pro",
      price: "₹499",
      period: "/month",
      description: "Ideal for businesses and fleet management",
      features: [
        "30% discount on all bookings",
        "Unlimited advance bookings",
        "Multi-vehicle management",
        "Priority support (24/7)",
        "Custom billing & reports",
        "API access for integration",
        "Dedicated account manager",
        "Corporate invoicing",
        "Employee parking management"
      ],
      buttonText: "Contact Sales",
      buttonVariant: "default" as const,
      popular: false,
      color: "from-purple-500/10 to-purple-600/10",
      borderColor: "border-purple-200"
    }
  ];

  const features = [
    {
      icon: MapPin,
      title: "500+ Locations",
      description: "Wide network across major cities"
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Bank-grade security with Stripe"
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Book anytime, anywhere"
    },
    {
      icon: Car,
      title: "All Vehicle Types",
      description: "Cars, bikes, and commercial vehicles"
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold gradient-text mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose the perfect plan for your parking needs. No hidden fees, no surprises.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Badge variant="secondary" className="text-sm">
            <Star className="w-4 h-4 mr-1" />
            Most Popular: Smart Parker
          </Badge>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-8 md:grid-cols-3 mb-16">
        {pricingPlans.map((plan, index) => (
          <Card 
            key={plan.name} 
            className={`relative group hover:shadow-glow transition-all duration-500 hover:-translate-y-2 bg-card/80 backdrop-blur-sm border border-border/50 ${
              plan.popular ? 'ring-2 ring-primary/40 scale-[1.02]' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  <Zap className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                asChild
                variant={plan.buttonVariant}
                className="w-full mt-6"
                size="lg"
              >
                <Link to="/book">
                  {plan.buttonText}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Section */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Why Choose ParkSeva?</h2>
          <p className="text-muted-foreground">
            Experience the future of parking with our comprehensive features
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="text-center p-6 group hover:shadow-glow transition-all duration-500 hover:-translate-y-1 bg-card/80 backdrop-blur-sm border border-border/50">
                <div className="w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Pricing FAQ */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Pricing FAQ</h2>
          <p className="text-muted-foreground">
            Common questions about our pricing plans
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left">
                How does Pay-Per-Use pricing work?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                With Pay-Per-Use, you only pay when you actually park. Rates vary by location 
                (₹20-50 per hour) based on demand and location premium. No monthly fees, 
                perfect for occasional users.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left">
                Can I cancel my subscription anytime?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! You can cancel your Smart Parker or Business Pro subscription anytime. 
                You'll continue to have access until the end of your current billing period, 
                then automatically switch to Pay-Per-Use.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left">
                Are there any hidden charges?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No hidden charges! What you see is what you pay. The only additional charges 
                might be for premium locations or extended parking beyond your booked time, 
                which are clearly displayed upfront.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left">
                Do you offer discounts for businesses?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! Our Business Pro plan includes volume discounts, and we offer custom 
                enterprise solutions for large organizations. Contact our sales team for 
                tailored pricing based on your company's needs.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left">
                What payment methods do you accept?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We accept all major credit/debit cards, UPI payments, digital wallets, 
                and net banking through our secure Stripe integration. All transactions 
                are encrypted and secure.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Parking Smarter?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Join thousands of satisfied customers who have made parking hassle-free with ParkSeva. 
          Start with Pay-Per-Use and upgrade anytime.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" className="min-w-[200px]">
            <Link to="/book">
              Start Parking Now
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-w-[200px]">
            <Link to="/support">
              <Phone className="w-4 h-4 mr-2" />
              Contact Sales
            </Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          No credit card required to start • Cancel anytime • 24/7 support
        </p>
      </div>
    </div>
  );
}


