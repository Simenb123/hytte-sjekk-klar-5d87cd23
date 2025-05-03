
import { Link } from "react-router-dom";

export default function ChecklistHome() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sjekklister</h1>

      <Link to="/checklists/arrival" className="block bg-green-600 hover:bg-green-700 text-white rounded py-3 text-center">
        Ankomst-sjekk
      </Link>

      <Link to="/checklists/departure" className="block bg-blue-600 hover:bg-blue-700 text-white rounded py-3 text-center">
        Avreise-sjekk
      </Link>
    </div>
  );
}
