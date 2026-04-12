import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

export default function ProfilePage() {
  const { user, profile, loading, updateProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState<string>(profile?.full_name || "");
  const [phone, setPhone] = useState<string>(profile?.phone || "");
  const email = user?.email || "-";
  const initials = useMemo(() => {
    const name = (profile?.full_name || email).trim();
    const parts = name.split(" ").filter(Boolean);
    return (parts[0]?.[0] || "").concat(parts[1]?.[0] || "").toUpperCase() || "U";
  }, [profile?.full_name, email]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const updates: any = {};
    if (fullName && fullName !== profile?.full_name) updates.full_name = fullName;
    if (phone !== (profile?.phone || "")) updates.phone = phone || null;
    if (Object.keys(updates).length === 0) return;
    await updateProfile(updates);
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin,
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold gradient-text">Your Profile</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Identity Card */}
        <Card className="group hover:shadow-glow transition-all duration-500 hover:-translate-y-1 bg-card/80 backdrop-blur-sm border border-border/50">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 border-4 border-primary/20 shadow-sm">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || email} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-2xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold">{profile?.full_name || "User"}</h2>
              <p className="text-sm text-muted-foreground">{email}</p>
              {/* Phone number display */}
              {profile?.phone && (
                <p className="text-xs text-muted-foreground mt-1">📱 {profile.phone}</p>
              )}
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Badge variant="secondary" className="text-xs">{profile?.role || "user"}</Badge>
                {profile?.role === "admin" && (
                  <Badge variant="outline" className="text-xs">Admin</Badge>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" asChild>
                  <Link to="/bookings">View Bookings</Link>
                </Button>
                {profile?.role === "admin" && (
                  <Button size="sm" variant="secondary" asChild>
                    <Link to="/admin">Admin Panel</Link>
                  </Button>
                )}
              </div>
              <Separator className="my-6" />
              <Button variant="outline" onClick={signOut}>Sign out</Button>
            </div>
          </CardContent>
        </Card>

        {/* Right: Tabs */}
        <div className="md:col-span-2">
          <Card className="group hover:shadow-glow transition-all duration-500 hover:-translate-y-1 bg-card/80 backdrop-blur-sm border border-border/50">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="account">
                <TabsList className="mb-4">
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>
                <TabsContent value="account">
                  <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full name</Label>
                        <Input
                          id="full_name"
                          placeholder="Your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={email} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          Mobile Number
                          <span className="ml-1 text-xs text-muted-foreground">(SMS reminders ke liye)</span>
                        </Label>
                        <Input
                          id="phone"
                          placeholder="+91 98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={loading}
                          type="tel"
                        />
                        <p className="text-xs text-muted-foreground">
                          Format: <code>+919876543210</code> — isi pe 15-min expiry reminder aayega
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={loading}>
                        Save changes
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setFullName(profile?.full_name || "");
                          setPhone(profile?.phone || "");
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                </TabsContent>
                <TabsContent value="security">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Password</h3>
                      <p className="text-sm text-muted-foreground">Send a password reset link to your email.</p>
                      <div className="mt-3">
                        <Button variant="secondary" onClick={handlePasswordReset} disabled={!user?.email}>
                          Send reset link
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}