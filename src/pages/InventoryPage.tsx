
import AppHeader from "@/components/AppHeader";
import InventoryList from "@/components/inventory/InventoryList";
import InventoryErrorBoundary from "@/components/inventory/InventoryErrorBoundary";
import InventoryViewToggle from "@/components/inventory/InventoryViewToggle";
import { NewItemDialog } from "@/components/inventory/NewItemDialog";
import { BulkImportButton } from "@/components/inventory/BulkImportButton";
import { AIItemDialog } from "@/components/inventory/AIItemDialog";
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
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useInventoryView } from "@/hooks/useInventoryView";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [category, setCategory] = useState("all");
  const [familyMemberId, setFamilyMemberId] = useState("all");
  
  const { data: familyMembers } = useFamilyMembers();
  const { viewType, setViewType } = useInventoryView();

  console.log('[InventoryPage] Render with state:', {
    searchTerm,
    sortKey,
    sortDirection,
    category,
    familyMemberId,
    viewType,
    familyMembersCount: familyMembers?.length
  });

  return (
    <div className="flex flex-col h-screen bg-hytte-snow">
      <AppHeader title="Inventar" showBackButton={true} rightContent={
        <div className="flex items-center gap-2">
          <AIItemDialog />
          <SkiImportButton />
          <BulkImportButton />
          <NewItemDialog />
        </div>
      } />
      <div className="p-4 md:p-6 border-b bg-white">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Input
              placeholder="Søk i inventar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex items-center gap-2 ml-auto">
               <Select value={familyMemberId} onValueChange={setFamilyMemberId}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Velg familiemedlem" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">Alle familiemedlemmer</SelectItem>
                      <SelectItem value="none">Ingen spesifikk eier</SelectItem>
                      {familyMembers?.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name} {member.nickname ? `(${member.nickname})` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
               </Select>
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
                      <SelectItem value="Verktøy">Verktøy</SelectItem>
                      <SelectItem value="Kjøkkenutstyr">Kjøkkenutstyr</SelectItem>
                      <SelectItem value="Møbler">Møbler</SelectItem>
                      <SelectItem value="Elektronikk">Elektronikk</SelectItem>
                      <SelectItem value="Sport">Sport</SelectItem>
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
          <div className="flex justify-end">
            <InventoryViewToggle viewType={viewType} onViewChange={setViewType} />
          </div>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <InventoryErrorBoundary>
          <InventoryList 
            searchTerm={searchTerm} 
            sortConfig={{ key: sortKey, direction: sortDirection as "asc" | "desc" }} 
            category={category}
            familyMemberId={familyMemberId}
            viewType={viewType}
          />
        </InventoryErrorBoundary>
      </main>
    </div>
  );
}
