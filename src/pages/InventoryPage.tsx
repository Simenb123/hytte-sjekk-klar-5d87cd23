
import AppHeader from "@/components/AppHeader";
import InventoryList from "@/components/inventory/InventoryList";
import InventoryErrorBoundary from "@/components/inventory/InventoryErrorBoundary";
import InventoryViewToggle from "@/components/inventory/InventoryViewToggle";
import { NewItemDialog } from "@/components/inventory/NewItemDialog";
import { BulkImportButton } from "@/components/inventory/BulkImportButton";
import { AIItemDialog } from "@/components/inventory/AIItemDialog";
import { SkiImportButton } from "@/components/inventory/SkiImportButton";
import { InventorySearch } from "@/components/inventory/InventorySearch";
import { useState } from "react";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useInventoryView } from "@/hooks/useInventoryView";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [category, setCategory] = useState("all");
  const [familyMemberId, setFamilyMemberId] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  const { data: familyMembers = [] } = useFamilyMembers();
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
      
      <div className="p-4 md:p-6 border-b bg-white space-y-4">
        <InventorySearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          category={category}
          onCategoryChange={setCategory}
          familyMemberId={familyMemberId}
          onFamilyMemberChange={setFamilyMemberId}
          familyMembers={familyMembers}
          resultCount={0} // Will be updated by InventoryList
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />
        
        <div className="flex justify-end">
          <InventoryViewToggle viewType={viewType} onViewChange={setViewType} />
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
