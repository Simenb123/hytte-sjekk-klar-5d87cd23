import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFacilities, useUpdateFacilityUsage, useFacilityUsage } from "@/hooks/useFacilities";
import ChecklistLoading from "@/components/checklist/ChecklistLoading";
import ChecklistError from "@/components/checklist/ChecklistError";
import { 
  ChefHat, 
  Wrench, 
  GamepadIcon, 
  MoreHorizontal,
  Snowflake,
  Sun,
  Clock
} from "lucide-react";

interface FacilitySelectorProps {
  bookingId: string | null;
  onFacilitiesSelected: (facilityIds: string[]) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'cooking': return ChefHat;
    case 'tools': return Wrench;
    case 'entertainment': return GamepadIcon;
    default: return MoreHorizontal;
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'cooking': return 'Matlaging';
    case 'tools': return 'Redskaper';
    case 'entertainment': return 'Fornøyelse';
    case 'other': return 'Annet';
    default: return category;
  }
};

const getSeasonIcon = (season: string) => {
  switch (season) {
    case 'winter': return Snowflake;
    case 'summer': return Sun;
    default: return Clock;
  }
};

export const FacilitySelector = ({ bookingId, onFacilitiesSelected }: FacilitySelectorProps) => {
  const { data: facilities, isLoading, error } = useFacilities();
  const { data: facilityUsage } = useFacilityUsage(bookingId);
  const updateFacilityUsage = useUpdateFacilityUsage();
  const [selectedFacilities, setSelectedFacilities] = useState<Set<string>>(new Set());

  if (isLoading) return <ChecklistLoading />;
  if (error) return <ChecklistError error={error.message} />;
  if (!facilities) return null;

  const groupedFacilities = facilities.reduce((acc, facility) => {
    if (!acc[facility.category]) {
      acc[facility.category] = [];
    }
    acc[facility.category].push(facility);
    return acc;
  }, {} as Record<string, typeof facilities>);

  const isFacilityUsed = (facilityId: string) => {
    return facilityUsage?.find(usage => usage.facility_id === facilityId)?.is_used || false;
  };

  const handleFacilityToggle = async (facilityId: string, isUsed: boolean) => {
    await updateFacilityUsage.mutateAsync({
      facilityId,
      bookingId,
      isUsed,
    });

    const newSelected = new Set(selectedFacilities);
    if (isUsed) {
      newSelected.add(facilityId);
    } else {
      newSelected.delete(facilityId);
    }
    setSelectedFacilities(newSelected);
    onFacilitiesSelected(Array.from(newSelected));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Hvilke fasiliteter brukte dere?</h2>
        <p className="text-muted-foreground mt-2">
          Velg de fasilitetene dere har brukt under oppholdet. Sjekklisten vil tilpasses basert på deres valg.
        </p>
      </div>

      {Object.entries(groupedFacilities).map(([category, categoryFacilities]) => {
        const CategoryIcon = getCategoryIcon(category);
        
        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CategoryIcon className="h-5 w-5" />
                {getCategoryLabel(category)}
              </CardTitle>
              <CardDescription>
                Fasiliteter innen {getCategoryLabel(category).toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryFacilities.map((facility) => {
                  const isUsed = isFacilityUsed(facility.id);
                  const SeasonIcon = getSeasonIcon(facility.season);
                  
                  return (
                    <div 
                      key={facility.id} 
                      className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${
                        isUsed ? 'bg-primary/5 border-primary' : 'bg-background border-border'
                      }`}
                    >
                      <Checkbox
                        id={facility.id}
                        checked={isUsed}
                        onCheckedChange={(checked) => 
                          handleFacilityToggle(facility.id, checked as boolean)
                        }
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <label 
                            htmlFor={facility.id} 
                            className="font-medium cursor-pointer"
                          >
                            {facility.name}
                          </label>
                          {facility.is_seasonal && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <SeasonIcon className="h-3 w-3" />
                              {facility.season === 'winter' ? 'Vinter' : 
                               facility.season === 'summer' ? 'Sommer' : 'Hele året'}
                            </Badge>
                          )}
                        </div>
                        {facility.description && (
                          <p className="text-sm text-muted-foreground">
                            {facility.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {selectedFacilities.size > 0 && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="font-medium mb-2">
                {selectedFacilities.size} fasilitet(er) valgt
              </p>
              <p className="text-sm text-muted-foreground">
                Sjekklisten vil nå vise relevante oppgaver for de valgte fasilitetene.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};