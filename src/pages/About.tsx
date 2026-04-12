import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Heart, Users, Shield } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-4">About Us</h1>
        <p className="text-xl text-muted-foreground">
          Learn more about ParkSeva and our mission
        </p>
      </div>

      <div className="space-y-6">
        {/* About Section */}
        <Card className="group hover:shadow-glow transition-all duration-500 hover:-translate-y-2 bg-card/80 backdrop-blur-sm border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              About ParkSeva
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              ParkSeva is an automated parking management system designed for smart cities. 
              It allows users to book parking slots online, get SMS/email notifications, 
              and pay securely via Payment Gateway. With features like reserved slots for women and 
              disabled users, and multiple location support, ParkSeva aims to make urban 
              parking stress-free and efficient.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
                <Users className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-semibold">10K+ Users</p>
                  <p className="text-sm text-muted-foreground">Happy customers</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-500/5 rounded-lg">
                <MapPin className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-semibold">500+ Slots</p>
                  <p className="text-sm text-muted-foreground">Across multiple locations</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-500/5 rounded-lg">
                <Shield className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="font-semibold">24/7 Security</p>
                  <p className="text-sm text-muted-foreground">Safe & monitored</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Developer Section */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Developer</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">ParkSeva is designed and developed end-to-end by Sneha Mishra.</p>

          <div className="grid grid-cols-1 gap-6">
            {/* Sneha Mishra - Founder (Highlighted) */}
            <Card className="group hover:shadow-glow transition-all duration-500 hover:-translate-y-2 bg-card/80 backdrop-blur-sm border border-border/50">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <Avatar className="w-32 h-32 border-4 border-primary/30 shadow-md">
                    <AvatarImage src="/Sneha Mishra.jpg" alt="Sneha Mishra" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-2xl font-bold">SM</AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <h3 className="text-3xl font-bold">Sneha Mishra</h3>
                      <div className="flex flex-wrap justify-center sm:justify-end gap-2">
                        <Badge variant="secondary" className="text-xs">Lead Developer</Badge>
                        <Badge variant="outline" className="text-xs">Founder</Badge>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      A final-year Bachelor of Engineering student with strong proficiency in full-stack development. Skilled in crafting dynamic web applications with seamless front-end and back-end integration, I am passionate about building scalable solutions and continuously expanding my technical expertise.
                    </p>
                    {/* Skills / Focus Areas */}
                    <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                      <Badge variant="outline" className="text-xs">React</Badge>
                      <Badge variant="outline" className="text-xs">TypeScript</Badge>
                      <Badge variant="outline" className="text-xs">Tailwind</Badge>
                      <Badge variant="outline" className="text-xs">Supabase</Badge>
                      <Badge variant="outline" className="text-xs">UI/UX</Badge>
                    </div>
                    <div className="mt-3 flex justify-center sm:justify-start items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>Pune</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Acknowledgements */}
        <Card className="group hover:shadow-glow transition-all duration-500 hover:-translate-y-2 bg-card/80 backdrop-blur-sm border border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              Acknowledgements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">This project proudly uses the following open-source tools:</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">React</Badge>
              <Badge variant="outline" className="text-xs">Vite</Badge>
              <Badge variant="outline" className="text-xs">TypeScript</Badge>
              <Badge variant="outline" className="text-xs">Tailwind CSS</Badge>
              <Badge variant="outline" className="text-xs">shadcn/ui</Badge>
              <Badge variant="outline" className="text-xs">Lucide Icons</Badge>
              <Badge variant="outline" className="text-xs">Supabase</Badge>
              <Badge variant="outline" className="text-xs">React Query</Badge>
              <Badge variant="outline" className="text-xs">Stripe (optional)</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
