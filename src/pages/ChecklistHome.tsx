
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getLatestCompletion, resetCompletion } from "../services/logs.service";
import { getFirstArrivalItemId, getFirstDepartureItemId } from "../services/checklist.service";
import { CheckCircle } from "lucide-react";

type CompletionInfo = {
  completed_at: string;
  user_name: string;
} | null;

export default function ChecklistHome() {
  const arrivalDone = localStorage.getItem("arrival-complete") === "true";
  const departureDone = localStorage.getItem("departure-complete") === "true";
  const [arrivalItemId, setArrivalItemId] = useState<string | null>(null);
  const [departureItemId, setDepartureItemId] = useState<string | null>(null);
  const [arrivalInfo, setArrivalInfo] = useState<CompletionInfo>(null);
  const [departureInfo, setDepartureInfo] = useState<CompletionInfo>(null);
  const [loading, setLoading] = useState(true);

  // Fetch item IDs and latest completion status
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get item IDs
        const arrId = await getFirstArrivalItemId();
        const depId = await getFirstDepartureItemId();
        
        setArrivalItemId(arrId);
        setDepartureItemId(depId);
        
        // If we have valid IDs, get the latest completion info
        if (arrId) {
          const arrivalCompletion = await getLatestCompletion(arrId);
          setArrivalInfo(arrivalCompletion);
        }
        
        if (depId) {
          const departureCompletion = await getLatestCompletion(depId);
          setDepartureInfo(departureCompletion);
        }
      } catch (error) {
        console.error("Error fetching checklist data:", error);
        toast.error("Kunne ikke hente sjekkliste-informasjon");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handle reset for arrival checklist
  const handleArrivalReset = async () => {
    if (!arrivalItemId) return;
    
    try {
      await resetCompletion(arrivalItemId);
      setArrivalInfo(null);
      toast.success("Status nullstilt");
    } catch (error) {
      console.error("Error resetting arrival completion:", error);
      toast.error("Kunne ikke nullstille status");
    }
  };

  // Handle reset for departure checklist
  const handleDepartureReset = async () => {
    if (!departureItemId) return;
    
    try {
      await resetCompletion(departureItemId);
      setDepartureInfo(null);
      toast.success("Status nullstilt");
    } catch (error) {
      console.error("Error resetting departure completion:", error);
      toast.error("Kunne ikke nullstille status");
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Laster sjekklister...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Sjekklister</h1>

      {(arrivalInfo || departureInfo) && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <CheckCircle className="text-green-500 mr-2" />
            <p className="font-medium">Status nullstilt</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <Link
            to="/checklists/arrival"
            className={`block w-full py-4 text-center text-white text-xl font-medium rounded-lg transition
              ${arrivalInfo ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            Ankomst-sjekk
          </Link>
          
          {arrivalInfo && (
            <p className="text-sm text-gray-600 mt-2 flex items-center">
              <CheckCircle className="text-green-500 mr-1" size={16} />
              Ankomst registrert {format(new Date(arrivalInfo.completed_at), "dd.MM.yyyy HH:mm")} 
              av {arrivalInfo.user_name}
              <button
                onClick={handleArrivalReset}
                className="ml-2 text-blue-600 underline"
              >
                Nullstill
              </button>
            </p>
          )}
        </div>

        <div>
          <Link
            to="/checklists/departure"
            className={`block w-full py-4 text-center text-white text-xl font-medium rounded-lg transition
              ${departureInfo ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            Avreise-sjekk
          </Link>
          
          {departureInfo && (
            <p className="text-sm text-gray-600 mt-2 flex items-center">
              <CheckCircle className="text-green-500 mr-1" size={16} />
              Avreise registrert {format(new Date(departureInfo.completed_at), "dd.MM.yyyy HH:mm")} 
              av {departureInfo.user_name}
              <button
                onClick={handleDepartureReset}
                className="ml-2 text-blue-600 underline"
              >
                Nullstill
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
