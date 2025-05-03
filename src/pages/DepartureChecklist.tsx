
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const areas = [
  {
    name: "Hovedhytta",
    tasks: [
      "Varmepumpe til økonomi",
      "Alle kraner lukket",
      "Vinduer + dører stengt",
    ],
  },
];

export default function DepartureChecklist() {
  const [areaIdx, setAreaIdx] = useState(0);
  const [checked, setChecked] = useState<boolean[]>(
    Array(areas[0].tasks.length).fill(false)
  );
  const nav = useNavigate();

  const current = areas[areaIdx];
  const done = checked.every(Boolean);

  const next = () => {
    if (areaIdx < areas.length - 1) {
      setAreaIdx(i => i + 1);
      setChecked(Array(areas[areaIdx + 1].tasks.length).fill(false));
    } else {
      nav("/");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{current.name}</h1>
      {current.tasks.map((t, i) => (
        <label key={i} className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={checked[i]}
            onChange={() => setChecked(c => c.map((v,j)=>j===i?!v:v))}
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
