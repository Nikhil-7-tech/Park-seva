import Hero from "@/components/Hero";
import Features from "@/components/Features";
import { useEffect } from "react";
import { seedSampleData } from "@/integrations/supabase/seed";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  useEffect(() => {
    seedSampleData();
  }, []);

  return (
    <>
      <Hero />
      <Features />
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/book">Book a Slot</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/admin">Admin</Link>
          </Button>
        </div>
      </div>
    </>
  );
};

export default Index;