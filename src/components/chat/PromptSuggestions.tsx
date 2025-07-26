import React, { useState, useEffect } from "react";
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
  const [currentSuggestions, setCurrentSuggestions] = useState<PromptSuggestion[]>([]);

  const getRandomSuggestions = () => {
    const shuffled = [...suggestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  useEffect(() => {
    setCurrentSuggestions(getRandomSuggestions());
  }, []);

  const refreshSuggestions = () => {
    setCurrentSuggestions(getRandomSuggestions());
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between text-muted-foreground">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Foreslåtte spørsmål</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshSuggestions}
          className="h-6 w-6 p-0 hover:bg-muted/50"
        >
          <Sparkles className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="grid gap-1.5">
        {currentSuggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <Button
              key={`${suggestion.text}-${index}`}
              variant="outline"
              size="sm"
              onClick={() => onSuggestionClick(suggestion.text)}
              className="justify-start h-auto p-2 text-left hover:bg-muted/50 transition-colors text-xs"
            >
              <Icon className="h-3 w-3 mr-2 text-muted-foreground flex-shrink-0" />
              <span className="leading-relaxed">{suggestion.text}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default PromptSuggestions;