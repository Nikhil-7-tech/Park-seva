import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, User, LogOut, Settings, Calendar, Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <img
            src="/logo.png"
            alt="Park Seva"
            className="h-8 w-auto"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target.src.indexOf('/placeholder.svg') === -1) {
                target.src = '/placeholder.svg';
              }
            }}
          />
          <span className="text-xl font-bold gradient-text">Park Seva</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/map" className="text-sm font-medium hover:text-primary transition-colors">
            Find Parking
          </Link>
          <a href="/#features" className="text-sm font-medium hover:text-primary transition-colors">
            How it Works
          </a>
          <Link to="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
            Pricing
          </Link>
          <Link to="/support" className="text-sm font-medium hover:text-primary transition-colors">
            Support
          </Link>
          <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">
            About
          </Link>
          <Link to="/ai-dashboard" className="text-sm font-medium hover:text-primary transition-colors">
           AI Insights
          </Link>
        </nav>

        <div className="flex items-center space-x-2 md:space-x-4">
          <ThemeToggle />
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <button aria-label="Open menu" className="md:hidden inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] sm:w-80">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-4 grid gap-2">
                <Link to="/map" className="px-2 py-2 rounded hover:bg-accent" onClick={() => navigate('/map')}>Find Parking</Link>
                <a href="/#features" className="px-2 py-2 rounded hover:bg-accent">How it Works</a>
                <Link to="/pricing" className="px-2 py-2 rounded hover:bg-accent" onClick={() => navigate('/pricing')}>Pricing</Link>
                <Link to="/support" className="px-2 py-2 rounded hover:bg-accent" onClick={() => navigate('/support')}>Support</Link>
                <Link to="/about" className="px-2 py-2 rounded hover:bg-accent" onClick={() => navigate('/about')}>About</Link>
                <div className="h-px bg-border my-2" />
                {user ? (
                  <div className="grid gap-2">
                    <button className="px-2 py-2 rounded hover:bg-accent text-left" onClick={() => navigate('/bookings')}>
                      <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" /> My Bookings</span>
                    </button>
                    <button className="px-2 py-2 rounded hover:bg-accent text-left" onClick={() => navigate('/profile')}>
                      <span className="inline-flex items-center gap-2"><User className="h-4 w-4" /> Profile</span>
                    </button>
                    {profile?.role === 'admin' && (
                      <button className="px-2 py-2 rounded hover:bg-accent text-left" onClick={() => navigate('/admin')}>
                        <span className="inline-flex items-center gap-2"><Settings className="h-4 w-4" /> Admin Dashboard</span>
                      </button>
                    )}
                    <button className="px-2 py-2 rounded hover:bg-accent text-left" onClick={signOut}>
                      <span className="inline-flex items-center gap-2"><LogOut className="h-4 w-4" /> Sign out</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <AuthModal
                      trigger={<button className="w-full px-3 py-2 rounded-md border">Sign In</button>}
                      defaultMode="signin"
                    />
                    <AuthModal
                      trigger={<button className="w-full px-3 py-2 rounded-md bg-primary text-primary-foreground">Get Started</button>}
                      defaultMode="signup"
                    />
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {profile?.full_name?.[0] || user.email?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{profile?.full_name || 'User'}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/bookings')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  My Bookings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                {profile?.role === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/admin')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <AuthModal
                trigger={<Button variant="ghost">Sign In</Button>}
                defaultMode="signin"
              />
              <AuthModal
                trigger={<Button>Get Started</Button>}
                defaultMode="signup"
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}