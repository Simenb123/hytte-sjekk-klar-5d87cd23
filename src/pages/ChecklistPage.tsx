import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getChecklistForCategory } from "@/services/checklist.service";
import { useAuth } from '@/state/auth';
import { ChecklistCategory, checklistCategories } from "@/models/checklist";
import ChecklistItem from "@/components/ChecklistItem";
import { logItemCompletion } from "@/services/checklist.service";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { Progress } from "@/components/ui/progress";

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
      refetch();
      toast.success("Status oppdatert");
    } catch (error) {
      toast.error("Kunne ikke oppdatere status");
      console.error("Error toggling item", error);
    }
  };

  const totalItems = areas?.reduce((acc, area) => acc + area.items.length, 0) || 0;
  const completedItems = areas?.reduce((acc, area) => acc + area.items.filter(item => item.isCompleted).length, 0) || 0;
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
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
    <div className="min-h-screen bg-gray-50">
      <Header 
        title={pageTitle} 
        showBackButton={true} 
        rightContent={
          areas && areas.length > 0 && totalItems > 0 && (
            <div className="flex items-center gap-2 w-24">
              <Progress value={progress} className="h-2 w-full" />
              <span className="text-xs font-semibold text-gray-600">{progress}%</span>
            </div>
          )
        }
      />
      <main className="p-4 sm:p-6 max-w-lg mx-auto pt-20">
        {areas && areas.length > 0 ? (
          <Accordion type="multiple" defaultValue={areas.map(area => area.id)} className="w-full space-y-3">
            {areas.map((area) => (
              <AccordionItem value={area.id} key={area.id} className="bg-white rounded-xl shadow-sm border-0">
                <AccordionTrigger className="flex items-center justify-between w-full p-4 font-medium text-left hover:bg-gray-50 text-base rounded-xl">
                  <div className="flex items-center">
                    {area.isCompleted && <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />}
                    <span className="text-lg text-gray-800">{area.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0">
                  <div className="divide-y divide-gray-100 border-t border-gray-100">
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
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center text-gray-500 mt-8 bg-white p-8 rounded-lg shadow-sm">
            <p>Ingen punkter funnet for denne sjekklisten.</p>
          </div>
        )}
      </main>
    </div>
  );
}
