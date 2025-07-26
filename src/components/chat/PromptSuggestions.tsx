import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Cloud, 
  Shirt, 
  Mountain, 
  Calendar, 
  Pizza, 
  Thermometer,
  Wind,
  Activity,
  Sparkles
} from "lucide-react";

interface PromptSuggestion {
  text: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

const suggestions: PromptSuggestion[] = [
  {
    text: "Hva bør jeg ha på meg i dag?",
    icon: Shirt,
    category: "klær"
  },
  {
    text: "Hvordan blir været i morgen?",
    icon: Cloud,
    category: "vær"
  },
  {
    text: "Hva slags fasiliteter er det i området?",
    icon: Mountain,
    category: "aktiviteter"
  },
  {
    text: "Hva slags aktiviteter kan vi gjøre i morgen?",
    icon: Calendar,
    category: "aktiviteter"
  },
  {
    text: "Hva har vi av alpintutstyr på hytta?",
    icon: Activity,
    category: "inventar"
  },
  {
    text: "Hvordan bruker man pizzaovnen?",
    icon: Pizza,
    category: "instruksjoner"
  },
  {
    text: "Hvordan lager vi den perfekte napolitanske pizzaen i pizzaovnen på hytta?",
    icon: Pizza,
    category: "instruksjoner"
  },
  {
    text: "Er alpinbakkene åpen i morgen?",
    icon: Mountain,
    category: "aktiviteter"
  },
  {
    text: "Hva bør vi smøre skia med i morgen?",
    icon: Thermometer,
    category: "ski"
  },
  {
    text: "Hvilke langrennsløyper er kjørt opp?",
    icon: Wind,
    category: "ski"
  }
];

interface PromptSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ 
  onSuggestionClick, 
  className = "" 
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">Foreslåtte spørsmål</span>
      </div>
      
      <div className="grid gap-2">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => onSuggestionClick(suggestion.text)}
              className="justify-start h-auto p-3 text-left hover:bg-muted/50 transition-colors"
            >
              <Icon className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
              <span className="text-sm leading-relaxed">{suggestion.text}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default PromptSuggestions;