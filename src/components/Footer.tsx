import { Scale, Mail, Phone, MapPin, Github, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  const footerSections = [
    {
      title: "Product",
      links: [
        { name: "Features", href: "#features" },
        { name: "Pricing", href: "#pricing" },
        { name: "AI Assistant", href: "#ai" },
        { name: "Document Analysis", href: "#docs" },
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Cookie Policy", href: "/cookies" },
        { name: "Legal Notice", href: "/legal" },
      ]
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", href: "/help" },
        { name: "Contact Us", href: "#contact" },
        { name: "API Documentation", href: "/docs" },
        { name: "Status", href: "/status" },
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "#about" },
        { name: "Careers", href: "/careers" },
        { name: "Press", href: "/press" },
        { name: "Blog", href: "/blog" },
      ]
    }
  ];

  return (
    <footer className="relative bg-card border-t border-border/50">
      {/* Background Pattern */}
      <div className="absolute inset-0 cyber-grid opacity-20" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative">
                <Scale className="h-8 w-8 text-primary animate-float" />
                <div className="absolute inset-0 h-8 w-8 text-primary/30 animate-glow-pulse" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                LegalAI
              </span>
            </div>
            
            <p className="text-muted-foreground mb-6 max-w-md">
              Empowering justice through artificial intelligence. Making legal services 
              accessible, affordable, and efficient for everyone.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>contact@legalai.com</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index} className="lg:col-span-1">
              <h3 className="text-foreground font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-smooth text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border/50 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-sm text-muted-foreground">
              © 2024 LegalAI. All rights reserved. | Built with advanced AI technology.
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-smooth hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-smooth hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-smooth hover:scale-110"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;