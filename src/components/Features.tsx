import { Brain, FileText, Users, MapPin, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "AI Legal Chatbot",
      description: "Get instant legal advice from our advanced AI assistant trained on comprehensive legal databases.",
      highlights: ["24/7 Availability", "Multilingual Support", "Case Law References"],
      color: "text-primary"
    },
    {
      icon: FileText,
      title: "Document Summarizer",
      description: "Upload legal documents and receive AI-powered summaries highlighting key points and potential issues.",
      highlights: ["PDF & DOCX Support", "Key Points Extraction", "Risk Assessment"],
      color: "text-accent"
    },
    {
      icon: Shield,
      title: "Government Schemes Advisor",
      description: "Discover relevant government schemes and benefits based on your personal and financial profile.",
      highlights: ["Personalized Matching", "Eligibility Checker", "Application Guidance"],
      color: "text-primary-glow"
    },
    {
      icon: MapPin,
      title: "Nearby Lawyer Finder",
      description: "Connect with qualified lawyers in your area specializing in your specific legal needs.",
      highlights: ["Location-Based Search", "Specialization Filters", "Verified Professionals"],
      color: "text-success"
    }
  ];

  return (
    <section id="features" className="py-20 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 cyber-grid opacity-30" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 rounded-full glass border border-primary/20 mb-6">
            <Zap className="h-4 w-4 text-primary mr-2" />
            <span className="text-sm text-primary font-medium">Powerful Features</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            <span className="text-foreground">Advanced NyaAI Technology</span>
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              At Your Fingertips
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Harness the power of artificial intelligence to streamline your legal processes 
            and make informed decisions with confidence.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="glass p-8 rounded-xl hover-lift group animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg bg-card border border-border/50 group-hover:shadow-glow transition-smooth`}>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-smooth">
                    {feature.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <div className="space-y-2 mb-6">
                    {feature.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <div className={`h-1.5 w-1.5 rounded-full ${feature.color.replace('text-', 'bg-')}`} />
                        <span className="text-sm text-muted-foreground">{highlight}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="ghost" size="sm" className="group">
                    Learn More
                    <Zap className="ml-2 h-4 w-4 group-hover:text-primary transition-smooth" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center glass p-8 rounded-xl">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Ready to Transform Your Legal Experience?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of users who are already benefiting from our AI-powered legal platform. 
            Start your journey towards smarter legal solutions today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="lg">
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg">
              Schedule Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;