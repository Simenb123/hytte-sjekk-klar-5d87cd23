
import { Link } from "react-router-dom";

export default function ChecklistHome() {
  const arrivalDone = localStorage.getItem("arrival-complete") === "true";
  const departureDone = localStorage.getItem("departure-complete") === "true";

  const baseBtn = "block rounded py-3 text-center text-white transition";
  const blue = "bg-blue-600 hover:bg-blue-700";
  const green = "bg-green-600 hover:bg-green-700";

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sjekklister</h1>

      <Link
        to="/checklists/arrival"
        className={`${baseBtn} ${arrivalDone ? green : blue}`}
      >
        Ankomst-sjekk
      </Link>

      <Link
        to="/checklists/departure"
        className={`${baseBtn} ${departureDone ? green : blue}`}
      >
        Avreise-sjekk
      </Link>
    </div>
  );
}
