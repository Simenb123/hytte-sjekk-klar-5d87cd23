
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadFromStorage, saveToStorage, removeFromStorage } from "../utils/storage.utils";

const STORAGE_KEY = "departure-progress";
const COMPLETE_KEY = "departure-complete";

const areas = [
  {
    name: "Hovedhytta",
    tasks: [
      "Varmepumpe til økonomi",
      "Alle kraner lukket",
      "Vinduer og dører stengt",
    ],
  },
  {
    name: "Tilbygget",
    tasks: [
      "Etterfylt vann på bad",
      "Varmekabler sjekket",
    ],
  },
  {
    name: "Anekset",
    tasks: [
      "Strøm avslått",
      "Vinduer stengt",
    ],
  },
  {
    name: "Boblebadet",
    tasks: [
      "Temperatur justert",
      "Lokk sikret",
    ],
  },
];

type ProgressState = {
  areaIdx: number;
  checked: boolean[];
};

export default function DepartureChecklist() {
  const [areaIdx, setAreaIdx] = useState(0);
  const [checked, setChecked] = useState<boolean[]>(
    Array(areas[0].tasks.length).fill(false)
  );
  const nav = useNavigate();

  // Remove "completed" status when starting the checklist
  useEffect(() => {
    // Fjerner evt. gammel «fullført» hvis brukeren åpner sjekklisten på nytt
    localStorage.removeItem(COMPLETE_KEY);
  }, []);

  // Load progress from localStorage on component mount
  useEffect(() => {
    const savedProgress = loadFromStorage<ProgressState | null>(STORAGE_KEY, null);
    
    if (savedProgress) {
      const { areaIdx: savedAreaIdx, checked: savedChecked } = savedProgress;
      
      // Validate the saved data
      if (savedAreaIdx >= 0 && savedAreaIdx < areas.length && 
          Array.isArray(savedChecked) && 
          savedChecked.length === areas[savedAreaIdx].tasks.length) {
        setAreaIdx(savedAreaIdx);
        setChecked(savedChecked);
      }
    }
  }, []);

  const current = areas[areaIdx];
  const done = checked.every(Boolean);

  // Update checkbox state and save progress
  const handleCheckChange = (index: number) => {
    const newChecked = checked.map((v, j) => j === index ? !v : v);
    setChecked(newChecked);
    
    // Save progress to localStorage
    saveToStorage(STORAGE_KEY, { areaIdx, checked: newChecked });
  };

  const next = () => {
    if (areaIdx < areas.length - 1) {
      const nextAreaIdx = areaIdx + 1;
      const nextAreaChecked = Array(areas[nextAreaIdx].tasks.length).fill(false);
      
      setAreaIdx(nextAreaIdx);
      setChecked(nextAreaChecked);
      
      // Save progress to localStorage
      saveToStorage(STORAGE_KEY, { areaIdx: nextAreaIdx, checked: nextAreaChecked });
    } else {
      // Remove progress from localStorage when completing the checklist
      removeFromStorage(STORAGE_KEY);
      localStorage.setItem(COMPLETE_KEY, "true");
      nav("/");
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Progress indicator */}
      <div className="flex mb-4 space-x-1">
        {areas.map((_, i) => (
          <div 
            key={i} 
            className={`flex-1 h-2 rounded
              ${i < areaIdx ? "bg-green-500"
               : i === areaIdx && done ? "bg-green-500"
               : "bg-gray-200"}`} 
          />
        ))}
      </div>

      <h1 className="text-2xl font-semibold">{current.name}</h1>
      {current.tasks.map((t, i) => (
        <label key={i} className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={checked[i]}
            onChange={() => handleCheckChange(i)}
          />
          <span>{t}</span>
        </label>
      ))}
      <button
        disabled={!done}
        onClick={next}
        className={`w-full py-3 rounded-lg text-white font-semibold transition
          ${done ? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                 : "bg-gray-400 cursor-not-allowed"}`}
      >
        {areaIdx < areas.length - 1 ? "Neste område" : "Fullfør og gå hjem"}
      </button>
    </div>
  );
}
