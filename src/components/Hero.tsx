import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Shield, Brain } from "lucide-react";

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden cyber-grid">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-glow opacity-50" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 opacity-20">
        <Shield className="h-12 w-12 text-primary animate-float" style={{ animationDelay: '0s' }} />
      </div>
      <div className="absolute top-40 right-20 opacity-20">
        <Brain className="h-16 w-16 text-accent animate-float" style={{ animationDelay: '1s' }} />
      </div>
      <div className="absolute bottom-40 left-20 opacity-20">
        <Sparkles className="h-10 w-10 text-primary-glow animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full glass border border-primary/20 mb-8">
            <Sparkles className="h-4 w-4 text-primary mr-2" />
            <span className="text-sm text-primary font-medium">Powered by Advanced AI</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="block text-foreground">Empowering</span>
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Justice Through AI
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Revolutionary legal technology platform that combines artificial intelligence 
            with legal expertise to democratize access to justice.
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
            <div className="glass p-4 rounded-lg hover-lift">
              <Brain className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-foreground">AI Legal Assistant</h3>
              <p className="text-sm text-muted-foreground">24/7 intelligent legal guidance</p>
            </div>
            <div className="glass p-4 rounded-lg hover-lift">
              <Shield className="h-8 w-8 text-accent mx-auto mb-2" />
              <h3 className="font-semibold text-foreground">Document Analysis</h3>
              <p className="text-sm text-muted-foreground">Instant legal document insights</p>
            </div>
            <div className="glass p-4 rounded-lg hover-lift">
              <Sparkles className="h-8 w-8 text-primary-glow mx-auto mb-2" />
              <h3 className="font-semibold text-foreground">Expert Network</h3>
              <p className="text-sm text-muted-foreground">Connect with qualified lawyers</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" className="group">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="neon" size="xl">
              Watch Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 opacity-60">
            <div className="text-sm text-muted-foreground">Trusted by 10,000+ users</div>
            <div className="h-4 w-px bg-border" />
            <div className="text-sm text-muted-foreground">SOC 2 Compliant</div>
            <div className="h-4 w-px bg-border" />
            <div className="text-sm text-muted-foreground">Enterprise Grade Security</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;