import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Filter, Car, Zap, Umbrella, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ParkingLot {
  id: string;
  name: string;
  address: string;
  hourly_rate: number;
  available_slots: number;
  total_slots: number;
  has_ev: boolean;
  has_covered: boolean;
  has_accessible: boolean;
}

export default function Map() {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  const [filterEV, setFilterEV] = useState(false);
  const [filterCovered, setFilterCovered] = useState(false);
  const [filterAccessible, setFilterAccessible] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchParkingLots();
  }, []);

  const fetchParkingLots = async () => {
    try {
      setLoading(true);

      // Step 1: fetch active lots
      const { data: lots, error: lotsErr } = await supabase
        .from('parking_lots')
        .select('id,name,address,hourly_rate,total_slots')
        .eq('is_active', true);
      if (lotsErr) throw lotsErr;

      // Step 2: fetch slots for those lots and compute features client-side
      const lotIds = (lots ?? []).map((l: any) => l.id);
      let slotsByLot: Record<string, any[]> = {};
      if (lotIds.length > 0) {
        const { data: slots, error: slotsErr } = await supabase
          .from('slots')
          .select('id,lot_id,is_available,ev_supported,is_covered,is_accessible')
          .in('lot_id', lotIds);
        if (slotsErr) throw slotsErr;
        for (const s of slots ?? []) {
          (slotsByLot[s.lot_id] ||= []).push(s);
        }
      }

      let processedLots = (lots ?? []).map((lot: any) => {
        const ss = slotsByLot[lot.id] ?? [];
        return {
          id: lot.id,
          name: lot.name,
          address: lot.address,
          hourly_rate: lot.hourly_rate,
          total_slots: lot.total_slots,
          available_slots: ss.filter((s: any) => s.is_available).length,
          has_ev: ss.some((s: any) => s.ev_supported !== 'none'),
          has_covered: ss.some((s: any) => s.is_covered),
          has_accessible: ss.some((s: any) => s.is_accessible),
        } as ParkingLot;
      });

      // Fallback demo data if DB is empty or inaccessible
      if (!processedLots || processedLots.length === 0) {
        processedLots = [
          {
            id: 'demo-1',
            name: 'Phoenix Marketcity Pune Parking',
            address: 'Viman Nagar, Pune',
            hourly_rate: 40,
            total_slots: 30,
            available_slots: 26,
            has_ev: true,
            has_covered: true,
            has_accessible: true,
          },
          {
            id: 'demo-2',
            name: 'FC Road Public Parking',
            address: 'Fergusson College Rd, Pune',
            hourly_rate: 35,
            total_slots: 30,
            available_slots: 24,
            has_ev: true,
            has_covered: false,
            has_accessible: true,
          },
          {
            id: 'demo-3',
            name: 'Shivajinagar Multi-level Parking',
            address: 'Shivajinagar, Pune',
            hourly_rate: 30,
            total_slots: 30,
            available_slots: 28,
            has_ev: false,
            has_covered: true,
            has_accessible: true,
          },
        ];
      }

      setParkingLots(processedLots);
    } catch (error: any) {
      console.error('Error fetching parking lots:', error);
      toast({
        title: 'Error loading parking lots',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLots = parkingLots.filter((lot) => {
    const matchesSearch = lot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lot.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEV = !filterEV || lot.has_ev;
    const matchesCovered = !filterCovered || lot.has_covered;
    const matchesAccessible = !filterAccessible || lot.has_accessible;
    
    return matchesSearch && matchesEV && matchesCovered && matchesAccessible;
  });

  const sortedLots = [...filteredLots].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.hourly_rate - b.hourly_rate;
      case 'availability':
        return b.available_slots - a.available_slots;
      default:
        return 0; // Default distance sorting would require coordinates
    }
  });

  const handleBookSlot = (lotId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to book a parking slot.',
        variant: 'destructive',
      });
      return;
    }
    navigate(`/book/${lotId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search parking lots or addresses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="availability">Availability</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={filterEV ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterEV(!filterEV)}
              >
                <Zap className="h-4 w-4 mr-1" />
                EV
              </Button>

              <Button
                variant={filterCovered ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterCovered(!filterCovered)}
              >
                <Umbrella className="h-4 w-4 mr-1" />
                Covered
              </Button>

              <Button
                variant={filterAccessible ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterAccessible(!filterAccessible)}
              >
                <Users className="h-4 w-4 mr-1" />
                Accessible
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold gradient-text mb-2">Find Parking</h1>
          <p className="text-muted-foreground">
            {loading ? 'Loading...' : `${sortedLots.length} parking lots available`}
          </p>
        </div>

        {/* Parking Lots Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedLots.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No parking lots found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedLots.map((lot) => (
              <Card 
                key={lot.id} 
                className="hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in"
                onClick={() => handleBookSlot(lot.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{lot.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {lot.address}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        ₹{lot.hourly_rate}
                      </div>
                      <div className="text-xs text-muted-foreground">per hour</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Availability */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Available slots</span>
                      <Badge variant={lot.available_slots > 0 ? "default" : "secondary"}>
                        <Car className="h-3 w-3 mr-1" />
                        {lot.available_slots} / {lot.total_slots}
                      </Badge>
                    </div>

                    {/* Features */}
                    <div className="flex gap-2 flex-wrap">
                      {lot.has_ev && (
                        <Badge variant="outline">
                          <Zap className="h-3 w-3 mr-1" />
                          EV Charging
                        </Badge>
                      )}
                      {lot.has_covered && (
                        <Badge variant="outline">
                          <Umbrella className="h-3 w-3 mr-1" />
                          Covered
                        </Badge>
                      )}
                      {lot.has_accessible && (
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          Accessible
                        </Badge>
                      )}
                    </div>

                    {/* Book Button */}
                    <Button 
                      className="w-full" 
                      disabled={lot.available_slots === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookSlot(lot.id);
                      }}
                    >
                      {lot.available_slots === 0 ? 'No Slots Available' : 'Book Now'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}