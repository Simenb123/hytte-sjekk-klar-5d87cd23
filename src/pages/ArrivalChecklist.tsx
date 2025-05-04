import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const items = [
  "Slå på strøm og vann",
  "Sett varmepumpe til komfort",
  "Rask visuell sjekk innendørs",
];

const COMPLETE_KEY = "arrival-complete";

export default function ArrivalChecklist() {
  const [checked, setChecked] = useState<boolean[]>(Array(items.length).fill(false));
  const nav = useNavigate();
  const allDone = checked.every(Boolean);
  const { user } = useAuth();

  // Remove "completed" status when starting the checklist
  useEffect(() => {
    localStorage.removeItem(COMPLETE_KEY);
  }, []);

  const handleComplete = async () => {
    try {
      // Store completion in Supabase
      const { error } = await supabase.from('completion_logs').insert({
        id: crypto.randomUUID(),
        item_id: 'arrival',
        user_id: user?.id,
        completed_at: new Date().toISOString(),
        is_completed: true
      });

      if (error) throw error;
      
      // Still keep localStorage for the UI updates
      localStorage.setItem(COMPLETE_KEY, "true");
      
      toast.success('Ankomst-sjekk fullført og logget');
      nav("/");
    } catch (err) {
      console.error("Error logging completion:", err);
      toast.error('Kunne ikke lagre fullføring');
      
      // Still navigate back even if logging fails
      localStorage.setItem(COMPLETE_KEY, "true");
      nav("/");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Ankomst-sjekkliste</h1>
      {items.map((txt, i) => (
        <label key={i} className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={checked[i]}
            onChange={() => setChecked(c => c.map((v,j)=>j===i?!v:v))}
          />
          <span>{txt}</span>
        </label>
      ))}
      <button
        disabled={!allDone}
        onClick={handleComplete}
        className={`w-full py-3 rounded-lg text-white font-semibold transition
          ${allDone ? "bg-green-600 hover:bg-green-700 active:bg-green-800"
                    : "bg-gray-400 cursor-not-allowed"}`}
      >
        {allDone ? "Fullført – tilbake til dashboard" : "Huk av alle punkter"}
      </button>
    </div>
  );
}
