
import { Link } from "react-router-dom";
import { checklistCategories } from "../models/checklist";
import { ChevronRight } from "lucide-react";

export default function ChecklistHome() {
  const categories = Object.entries(checklistCategories);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Sjekklister</h1>
      <div className="space-y-4">
        {categories.map(([key, value]) => (
          <Link
            key={key}
            to={`/checklists/${key}`}
            className="flex items-center justify-between w-full p-4 text-lg font-medium text-left text-gray-800 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition"
          >
            <span>{value}</span>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}
