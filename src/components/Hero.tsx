import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Clock, Shield, Sparkles } from 'lucide-react';
import heroImage from '@/assets/hero-parking.jpg';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Modern parking facility with sleek design"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-6 py-32">
        <div className="max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-up">
            <Sparkles className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm font-medium text-primary">
              Park Smarter, Feel Better
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-gradient-primary">Park Seva</span>
            <br />
            <span className="text-foreground">Made Simple</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Experience delightfully smooth parking with beautiful animations, 
            one-click payments, and smart booking that just works.
          </p>

          {/* Feature Highlights */}
          <div className="flex flex-wrap gap-6 mb-10 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center space-x-2 bg-card/50 px-4 py-2 rounded-full border border-border/50">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">Smart Location</span>
            </div>
            <div className="flex items-center space-x-2 bg-card/50 px-4 py-2 rounded-full border border-border/50">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">Instant Booking</span>
            </div>
            <div className="flex items-center space-x-2 bg-card/50 px-4 py-2 rounded-full border border-border/50">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">Secure Payments</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <Button asChild size="lg" className="gradient-primary text-white border-0 hover:opacity-90 transition-smooth shadow-glow px-8 py-4 text-lg">
              <Link to="/book">Start Parking Now <ArrowRight className="w-5 h-5 ml-2" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground px-8 py-4 text-lg transition-smooth">
              <Link to="/map">Watch Demo</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-16 animate-fade-up" style={{ animationDelay: '0.5s' }}>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground">Happy Parkers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Parking Spots</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground">Availability</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 right-10 w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl animate-float" />
      <div className="absolute bottom-1/4 left-20 w-32 h-32 bg-gradient-to-br from-accent/10 to-primary/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
    </section>
  );
};

export default Hero;