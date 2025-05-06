
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const tiles = [
  { path: "/checklists", label: "Sjekklister" },
  { path: "/weather", label: "Værmelding" },
  { path: "/calendar", label: "Kalender" },
  { path: "/ai-helper", label: "AI-Hjelper" },
  { path: "/inventory", label: "Lageroversikt" },
];

export default function Dashboard() {
  const { user } = useAuth();
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Velkommen{user?.user_metadata?.first_name ? `, ${user.user_metadata.first_name}` : ''}!</h1>
        <p className="text-gray-600">Velg en funksjon under for å komme i gang</p>
      </div>
      
      <div className="grid gap-4">
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
    </div>
  );
}
