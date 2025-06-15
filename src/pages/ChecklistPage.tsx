
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getChecklistForCategory } from "@/services/checklist.service";
import { useAuth } from "@/context/AuthContext";
import { ChecklistCategory, checklistCategories } from "@/models/checklist";
import ChecklistItem from "@/components/ChecklistItem";
import { logItemCompletion } from "@/services/checklist.service";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Loader2 } from "lucide-react";

export default function ChecklistPage() {
  const { category } = useParams<{ category: ChecklistCategory }>();
  const { user } = useAuth();

  const { data: areas, isLoading, error, refetch } = useQuery({
    queryKey: ['checklist', category, user?.id],
    queryFn: () => {
      if (!user?.id || !category) throw new Error("User or category not defined");
      return getChecklistForCategory(user.id, category);
    },
    enabled: !!user?.id && !!category,
  });

  const handleToggleItem = async (itemId: string, isCompleted: boolean) => {
    if (!user) {
      toast.error('Du må være logget inn for å fullføre sjekklister');
      return;
    }
    try {
      await logItemCompletion(user.id, itemId, !isCompleted);
      // Invalidate and refetch to show the latest state
      refetch();
      toast.success("Status oppdatert");
    } catch (error) {
      toast.error("Kunne ikke oppdatere status");
      console.error("Error toggling item", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-4 text-lg">Laster sjekkliste...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">Feil: {error.message}</div>;
  }

  const pageTitle = category ? checklistCategories[category] : "Sjekkliste";

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">{pageTitle}</h1>
      
      {areas && areas.length > 0 ? (
        <Accordion type="multiple" defaultValue={areas.map(area => area.id)} className="w-full space-y-4">
          {areas.map((area) => (
            <AccordionItem value={area.id} key={area.id} className="border-none">
              <Card className="bg-white rounded-xl shadow-lg overflow-hidden">
                <CardHeader className="p-0">
                  <AccordionTrigger className="flex items-center justify-between w-full p-4 font-medium text-left hover:bg-gray-50">
                    <div className="flex items-center">
                       {area.isCompleted && <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />}
                      <span className="text-lg">{area.name}</span>
                    </div>
                  </AccordionTrigger>
                </CardHeader>
                <AccordionContent>
                  <CardContent className="p-0">
                    <div className="border-t border-gray-100">
                      {area.items.map((item) => (
                        <ChecklistItem
                          key={item.id}
                          id={item.id}
                          text={item.text}
                          isCompleted={item.isCompleted}
                          onToggle={() => handleToggleItem(item.id, item.isCompleted)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-center text-gray-500 mt-8 bg-white p-8 rounded-lg shadow-sm">
          <p>Ingen punkter funnet for denne sjekklisten.</p>
        </div>
      )}
    </div>
  );
}
