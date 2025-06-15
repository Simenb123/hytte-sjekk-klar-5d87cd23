
import { Link } from "react-router-dom";
import { checklistCategories, ChecklistCategory } from "../models/checklist";
import { ChevronRight, Home, KeyRound, LogOut, Luggage, Wrench, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCategoriesSummary } from "@/services/checklist.service";
import { useAuth } from "@/context/AuthContext";
import { Progress } from "@/components/ui/progress";
import AppHeader from "@/components/AppHeader";

const categoryIcons: Record<ChecklistCategory, React.ElementType> = {
  før_ankomst: Luggage,
  ankomst: KeyRound,
  opphold: Home,
  avreise: LogOut,
  årlig_vedlikehold: Wrench,
};

export default function ChecklistHome() {
  const { user } = useAuth();
  const categories = Object.entries(checklistCategories) as [ChecklistCategory, string][];

  const { data: summaryData, isLoading, error } = useQuery({
    queryKey: ['checklistsSummary', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error("User not defined");
      return getCategoriesSummary(user.id);
    },
    enabled: !!user?.id,
  });
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Sjekklister" showHomeButton={true} />
      <main className="p-4 sm:p-6 max-w-lg mx-auto">
        {isLoading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="ml-4 text-lg">Laster...</p>
          </div>
        )}
        {error && <div className="text-center text-red-500 p-4 bg-red-50 rounded-lg">Kunne ikke laste sjekklistene.</div>}
        
        <div className="space-y-4">
          {summaryData && categories.map(([key, value]) => {
            const summary = summaryData[key];
            if (!summary) return null;

            const Icon = categoryIcons[key];
            const isCompleted = summary.progress === 100;

            return (
              <Link
                key={key}
                to={`/checklists/${key}`}
                className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-full mr-4 ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-lg text-gray-800">{value}</h2>
                      {summary.totalItems > 0 ? (
                         <p className="text-sm text-gray-500">{summary.completedItems} av {summary.totalItems} fullført</p>
                      ) : (
                         <p className="text-sm text-gray-500">Ingen oppgaver</p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                  {summary.totalItems > 0 && (
                    <div className="mt-3">
                      <Progress value={summary.progress} className="h-2" />
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  );
}
