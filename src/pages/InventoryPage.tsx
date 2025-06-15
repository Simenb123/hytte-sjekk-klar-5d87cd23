
import AppHeader from "@/components/AppHeader";
import InventoryList from "@/components/inventory/InventoryList";
import { NewItemDialog } from "@/components/inventory/NewItemDialog";
import { BulkImportButton } from "@/components/inventory/BulkImportButton";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkiImportButton } from "@/components/inventory/SkiImportButton";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [category, setCategory] = useState("all");

  return (
    <div className="flex flex-col h-screen bg-hytte-snow">
      <AppHeader title="Inventar" showBackButton={true} showHomeButton={true} rightContent={
        <div className="flex items-center gap-2">
          <SkiImportButton />
          <BulkImportButton />
          <NewItemDialog />
        </div>
      } />
      <div className="p-4 md:p-6 border-b bg-white">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Input
            placeholder="Søk i inventar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex items-center gap-2 ml-auto">
             <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Velg kategori" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Alle kategorier</SelectItem>
                    <SelectItem value="Klær">Klær</SelectItem>
                    <SelectItem value="Langrennski">Langrennski</SelectItem>
                    <SelectItem value="Langrennstaver">Langrennstaver</SelectItem>
                    <SelectItem value="Alpint">Alpint</SelectItem>
                    <SelectItem value="Annet">Annet</SelectItem>
                </SelectContent>
             </Select>
             <Select value={sortKey} onValueChange={setSortKey}>
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Sorter etter" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="created_at">Dato lagt til</SelectItem>
                    <SelectItem value="name">Navn</SelectItem>
                    <SelectItem value="category">Kategori</SelectItem>
                    <SelectItem value="brand">Merke</SelectItem>
                    <SelectItem value="color">Farge</SelectItem>
                    <SelectItem value="owner">Eier</SelectItem>
                </SelectContent>
             </Select>
             <Select value={sortDirection} onValueChange={(value) => setSortDirection(value as "asc" | "desc")}>
                <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Retning" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="desc">Synkende</SelectItem>
                    <SelectItem value="asc">Stigende</SelectItem>
                </SelectContent>
             </Select>
          </div>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <InventoryList 
          searchTerm={searchTerm} 
          sortConfig={{ key: sortKey, direction: sortDirection as "asc" | "desc" }} 
          category={category}
        />
      </main>
    </div>
  );
}
