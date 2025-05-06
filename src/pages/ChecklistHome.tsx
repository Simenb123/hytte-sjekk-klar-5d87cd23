
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getLatestCompletion, resetCompletion } from "../services/logs.service";
import { getFirstArrivalItemId, getFirstDepartureItemId } from "../services/checklist.service";

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

  const baseBtn = "block rounded py-3 text-center text-white transition";
  const blue = "bg-blue-600 hover:bg-blue-700";
  const green = "bg-green-600 hover:bg-green-700";

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sjekklister</h1>

      <div>
        <Link
          to="/checklists/arrival"
          className={`${baseBtn} ${arrivalInfo ? green : blue}`}
        >
          Ankomst-sjekk
        </Link>
        {arrivalInfo && arrivalItemId && (
          <p className="text-xs text-gray-600 mt-1">
            ✅ Ankomst registrert {format(new Date(arrivalInfo.completed_at), "dd.MM.yyyy HH:mm")} av {arrivalInfo.user_name}
            <button
              onClick={async (e) => {
                e.preventDefault();
                try {
                  await resetCompletion(arrivalItemId);
                  setArrivalInfo(null);
                  toast.success("Status nullstilt");
                } catch (error) {
                  console.error("Error resetting arrival completion:", error);
                }
              }}
              className="ml-2 underline"
            >
              Nullstill
            </button>
          </p>
        )}
      </div>

      <div>
        <Link
          to="/checklists/departure"
          className={`${baseBtn} ${departureInfo ? green : blue}`}
        >
          Avreise-sjekk
        </Link>
        {departureInfo && departureItemId && (
          <p className="text-xs text-gray-600 mt-1">
            ✅ Avreise registrert {format(new Date(departureInfo.completed_at), "dd.MM.yyyy HH:mm")} av {departureInfo.user_name}
            <button
              onClick={async (e) => {
                e.preventDefault();
                try {
                  await resetCompletion(departureItemId);
                  setDepartureInfo(null);
                  toast.success("Status nullstilt");
                } catch (error) {
                  console.error("Error resetting departure completion:", error);
                }
              }}
              className="ml-2 underline"
            >
              Nullstill
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
