import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pizza, Calculator, ChefHat } from "lucide-react";

interface PizzaRecipe {
  flour: number;
  water: number;
  salt: number;
  yeast: number;
  oil: number;
}

interface PizzaCalculatorProps {
  className?: string;
}

export const PizzaCalculator = ({ className }: PizzaCalculatorProps) => {
  const [numberOfPizzas, setNumberOfPizzas] = useState<number>(4);
  const [pizzaSize, setPizzaSize] = useState<string>("medium");
  const [doughType, setDoughType] = useState<string>("neapolitan");

  // Base recipes per pizza (in grams)
  const baseRecipes = {
    neapolitan: {
      small: { flour: 125, water: 81, salt: 3, yeast: 0.3, oil: 6 },
      medium: { flour: 150, water: 97, salt: 4, yeast: 0.4, oil: 8 },
      large: { flour: 175, water: 114, salt: 4.5, yeast: 0.5, oil: 9 }
    },
    roman: {
      small: { flour: 125, water: 75, salt: 3, yeast: 0.5, oil: 12 },
      medium: { flour: 150, water: 90, salt: 4, yeast: 0.6, oil: 15 },
      large: { flour: 175, water: 105, salt: 4.5, yeast: 0.7, oil: 18 }
    },
    sicilian: {
      small: { flour: 150, water: 90, salt: 4, yeast: 1, oil: 15 },
      medium: { flour: 180, water: 108, salt: 5, yeast: 1.2, oil: 18 },
      large: { flour: 210, water: 126, salt: 6, yeast: 1.4, oil: 21 }
    }
  };

  const getRecipe = (): PizzaRecipe => {
    const baseRecipe = baseRecipes[doughType as keyof typeof baseRecipes][pizzaSize as keyof typeof baseRecipes.neapolitan];
    
    return {
      flour: Math.round(baseRecipe.flour * numberOfPizzas),
      water: Math.round(baseRecipe.water * numberOfPizzas),
      salt: Math.round(baseRecipe.salt * numberOfPizzas * 10) / 10,
      yeast: Math.round(baseRecipe.yeast * numberOfPizzas * 10) / 10,
      oil: Math.round(baseRecipe.oil * numberOfPizzas)
    };
  };

  const recipe = getRecipe();

  const getDoughTypeDescription = (type: string) => {
    switch (type) {
      case 'neapolitan': return 'Tynn, luftig deig med høy hydrasjon';
      case 'roman': return 'Tynn og sprø deig med lavere hydrasjon';
      case 'sicilian': return 'Tykk, luftig deig perfekt for dype former';
      default: return '';
    }
  };

  const getSizeDescription = (size: string) => {
    switch (size) {
      case 'small': return '25cm diameter';
      case 'medium': return '30cm diameter';
      case 'large': return '35cm diameter';
      default: return '';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pizza className="h-5 w-5" />
          Pizzadeig Kalkulator
        </CardTitle>
        <CardDescription>
          Beregn perfekte mengder for hjemmelaget pizzadeig
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="pizzas">Antall pizzaer</Label>
            <Input
              id="pizzas"
              type="number"
              min="1"
              max="20"
              value={numberOfPizzas}
              onChange={(e) => setNumberOfPizzas(parseInt(e.target.value) || 1)}
            />
          </div>

          <div>
            <Label htmlFor="size">Størrelse</Label>
            <Select value={pizzaSize} onValueChange={setPizzaSize}>
              <SelectTrigger>
                <SelectValue placeholder="Velg størrelse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Liten (25cm)</SelectItem>
                <SelectItem value="medium">Medium (30cm)</SelectItem>
                <SelectItem value="large">Stor (35cm)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {getSizeDescription(pizzaSize)}
            </p>
          </div>

          <div>
            <Label htmlFor="type">Deigtype</Label>
            <Select value={doughType} onValueChange={setDoughType}>
              <SelectTrigger>
                <SelectValue placeholder="Velg deigtype" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neapolitan">Napolitansk</SelectItem>
                <SelectItem value="roman">Romersk</SelectItem>
                <SelectItem value="sicilian">Siciliansk</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {getDoughTypeDescription(doughType)}
            </p>
          </div>
        </div>

        {/* Recipe Results */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Oppskrift for {numberOfPizzas} {pizzaSize === 'small' ? 'små' : pizzaSize === 'medium' ? 'medium' : 'store'} pizzaer
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{recipe.flour}g</div>
              <div className="text-sm text-muted-foreground">Mel (tipo 00)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{recipe.water}g</div>
              <div className="text-sm text-muted-foreground">Vann (lunken)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{recipe.salt}g</div>
              <div className="text-sm text-muted-foreground">Salt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{recipe.yeast}g</div>
              <div className="text-sm text-muted-foreground">Tørrgjær</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{recipe.oil}g</div>
              <div className="text-sm text-muted-foreground">Olivenolje</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-primary/5 rounded-lg p-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Fremgangsmåte
          </h4>
          <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
            <li>Bland mel og salt i en stor bolle</li>
            <li>Løs opp gjæren i lunken vann (25-30°C)</li>
            <li>Hell vannet i melblandingen og rør til en grov deig</li>
            <li>Tilsett olivenolje og elt i 8-10 minutter til deigen blir glatt</li>
            <li>La deigen heve i 1-2 timer til den dobler seg</li>
            <li>Del deigen i {numberOfPizzas} like deler og form til boller</li>
            <li>La bollene hvile 30 minutter før utbaking</li>
            <li>Strek ut deigen og bak i pizzaovnen ved 400-450°C</li>
          </ol>
        </div>

        {/* Tips */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h4 className="font-semibold mb-2 text-amber-800 dark:text-amber-200">💡 Tips for beste resultat</h4>
          <ul className="text-sm space-y-1 text-amber-700 dark:text-amber-300">
            <li>• Bruk tipo 00 mel for best resultat</li>
            <li>• La deigen heve sakte i kjøleskapet over natten for mer smak</li>
            <li>• Pizzaovnen bør være forvarmet til minimum 400°C</li>
            <li>• Bruk lite mel når du strekker ut deigen</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};