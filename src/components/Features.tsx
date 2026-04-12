import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Smartphone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  QrCode, 
  Bell,
  BarChart3,
  Shield
} from 'lucide-react';

const features = [
  {
    icon: Smartphone,
    title: 'Seamless Sign-In',
    description: 'Email, Google, or phone OTP with sleek animated forms that feel delightful.',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    icon: MapPin,
    title: 'Interactive Map View',
    description: 'Gorgeous slot cards and filters that glide into view with smooth animations.',
    color: 'from-purple-500 to-pink-500'
  },
  {
    icon: Calendar,
    title: 'Smart Calendar Booking',
    description: 'Pick date and time with a fluid, animated calendar interface.',
    color: 'from-green-500 to-teal-500'
  },
  {
    icon: CreditCard,
    title: 'One-Click Payments',
    description: 'Stripe integration with stylish confirmation modals and instant processing.',
    color: 'from-orange-500 to-red-500'
  },
  {
    icon: QrCode,
    title: 'QR Check-In/Out',
    description: 'Scan your booking QR, gate opens, timer starts — completely frictionless.',
    color: 'from-indigo-500 to-purple-500'
  },
  {
    icon: Bell,
    title: 'Instant Notifications',
    description: 'Elegant emails and SMS updates keep you perfectly in the loop.',
    color: 'from-pink-500 to-rose-500'
  },
  {
    icon: BarChart3,
    title: 'Owner Dashboard',
    description: 'Stunning charts and cards for slots, pricing, and analytics management.',
    color: 'from-teal-500 to-green-500'
  },
  {
    icon: Shield,
    title: 'Security First',
    description: 'Advanced encryption and secure payments ensure your data stays protected.',
    color: 'from-slate-500 to-gray-600'
  }
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="text-sm font-medium text-primary">
              ✨ Why users love it
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-gradient-primary">Features</span> that Feel
            <br />
            <span className="text-foreground">Amazing</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Every interaction is crafted to be smooth, modern, and joyful — 
            not just functional.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="group hover:shadow-glow transition-all duration-500 hover:-translate-y-2 bg-card/80 backdrop-blur-sm border-border/50 animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-full h-full text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-6">
            Ready to experience parking that feels amazing?
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;