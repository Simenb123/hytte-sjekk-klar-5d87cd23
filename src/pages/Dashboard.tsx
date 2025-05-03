
import { Link } from "react-router-dom";

const tiles = [
  { path: "/checklists", label: "Sjekklister" },
  { path: "/weather",    label: "Værmelding" },
  { path: "/calendar",   label: "Kalender" },
  { path: "/ai-helper",  label: "AI-Hjelper" },
  { path: "/inventory",  label: "Lageroversikt" },
];

export default function Dashboard() {
  return (
    <div className="grid gap-4 p-6">
      {tiles.map(t => (
        <Link
          key={t.path}
          to={t.path}
          className="block rounded-lg bg-blue-600 py-6 text-center text-white text-xl font-semibold hover:bg-blue-700 active:bg-blue-800 transition"
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
