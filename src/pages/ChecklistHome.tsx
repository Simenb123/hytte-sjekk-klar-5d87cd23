
import { Link } from "react-router-dom";

export default function ChecklistHome() {
  const actions = [
    { path: "/checklists/arrival",  color: "green",  label: "Ankomst-sjekk" },
    { path: "/checklists/departure", color: "red",    label: "Avreise-sjekk" },
  ];

  return (
    <div className="grid gap-4 p-6">
      {actions.map(a => (
        <Link
          key={a.path}
          to={a.path}
          className={`block rounded-lg bg-${a.color}-600 py-6 text-center text-white text-xl font-semibold hover:bg-${a.color}-700 active:bg-${a.color}-800 transition`}
        >
          {a.label}
        </Link>
      ))}
    </div>
  );
}
