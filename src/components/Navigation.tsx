import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Scale, Shield, Brain, Users, Mail, Linkedin, Github } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  // Check user role
  useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setUserRole(null);
        return;
      }
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (!error && data) {
        setUserRole(data.role);
      }
    };
    
    checkRole();
  }, [user]);

  const navItems = [
    { name: "Home", href: "#home" },
    { name: "Features", href: "#features" },
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" },
  ];

  const handleNavClick = (href: string) => {
    if (location.pathname !== '/') {
      // Navigate to home page first, then scroll
      navigate('/');
      setTimeout(() => {
        const element = document.querySelector(href);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      // Already on home page, just scroll
      const element = document.querySelector(href);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer flex-shrink-0"
            onClick={() => {
              // Only navigate to home if user is not a lawyer
              if (userRole !== 'lawyer') {
                navigate('/');
              }
              // Do nothing for lawyers (they stay on current page)
            }}
          >
            <div className="relative">
              <Scale className="h-8 w-8 text-primary animate-float" />
              <div className="absolute inset-0 h-8 w-8 text-primary/30 animate-glow-pulse" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              NyaAI
            </span>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            {/* Only show navigation items if user is not a lawyer */}
            {userRole !== 'lawyer' && navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className="text-foreground hover:text-primary transition-smooth hover:scale-105"
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
            <ThemeToggle />
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate(userRole === 'lawyer' ? '/lawyer-dashboard' : '/dashboard')}
                >
                  Dashboard
                </Button>
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
                  Login
                </Button>
                <Button variant="hero" size="sm" onClick={() => navigate('/auth')}>
                  Sign Up
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-foreground hover:text-primary transition-smooth"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden glass border-t border-border/50 animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Only show navigation items if user is not a lawyer */}
            {userRole !== 'lawyer' && navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className="block w-full text-left px-3 py-2 text-foreground hover:text-primary transition-smooth"
              >
                {item.name}
              </button>
            ))}
            <div className="flex flex-col space-y-2 pt-4 px-3">
              {user ? (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full" 
                    onClick={() => {
                      navigate(userRole === 'lawyer' ? '/lawyer-dashboard' : '/dashboard');
                      setIsMenuOpen(false);
                    }}
                  >
                    Dashboard
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => signOut()}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/auth')}>
                    Login
                  </Button>
                  <Button variant="hero" size="sm" className="w-full" onClick={() => navigate('/auth')}>
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;