
import Layout from "@/layout/Layout";
import InventoryList from "@/components/inventory/InventoryList";
import InventoryErrorBoundary from "@/components/inventory/InventoryErrorBoundary";
import InventoryViewToggle from "@/components/inventory/InventoryViewToggle";
import { NewItemDialog } from "@/components/inventory/NewItemDialog";
import { BulkImportButton } from "@/components/inventory/BulkImportButton";
import { AIItemDialog } from "@/components/inventory/AIItemDialog";
import { SkiImportButton } from "@/components/inventory/SkiImportButton";
import { InventorySearch } from "@/components/inventory/InventorySearch";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useInventoryView } from "@/hooks/useInventoryView";

export default function InventoryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [category, setCategory] = useState("all");
  const [familyMemberId, setFamilyMemberId] = useState("all");
  const [primaryLocation, setPrimaryLocation] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false);
  const [prefilledData, setPrefilledData] = useState<any>(null);
  
  const { data: familyMembers = [] } = useFamilyMembers();
  const { viewType, setViewType } = useInventoryView();

  // Handle navigation from AI helper with inventory item highlighting and prefilled data
  useEffect(() => {
    if (location.state?.searchTerm) {
      setSearchTerm(location.state.searchTerm);
    }
    if (location.state?.highlightItemId) {
      // TODO: Add highlighting logic when InventoryList supports it
      console.log('Highlighting item:', location.state.highlightItemId);
    }
    
    // Handle prefilled data from URL params (from AI chat)
    const urlParams = new URLSearchParams(location.search);
    const prefilledDataParam = urlParams.get('prefilledData');
    if (prefilledDataParam) {
      try {
        const data = JSON.parse(prefilledDataParam);
        setPrefilledData(data);
        setNewItemDialogOpen(true);
        
        // Clean up URL params
        navigate(location.pathname, { replace: true });
      } catch (error) {
        console.error('Error parsing prefilled data:', error);
      }
    }
  }, [location.state, location.search, navigate]);

  console.log('[InventoryPage] Render with state:', {
    searchTerm,
    sortKey,
    sortDirection,
    category,
    familyMemberId,
    primaryLocation,
    viewType,
    familyMembersCount: familyMembers?.length
  });

  return (
    <Layout
      title="Inventar"
      showBackButton
      actionBar={
        <div className="flex items-center gap-2 flex-wrap">
          <AIItemDialog />
          {/* Import functionality temporarily hidden due to duplicate entries
          <div className="hidden sm:flex items-center gap-2">
            <SkiImportButton />
            <BulkImportButton />
          </div>
          */}
          <NewItemDialog 
            open={newItemDialogOpen}
            onOpenChange={setNewItemDialogOpen}
            prefilledData={prefilledData}
          />
        </div>
      }
    >

      <div className="p-4 md:p-6 border-b bg-white space-y-4">
        <InventorySearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          category={category}
          onCategoryChange={setCategory}
          familyMemberId={familyMemberId}
          onFamilyMemberChange={setFamilyMemberId}
          primaryLocation={primaryLocation}
          onPrimaryLocationChange={setPrimaryLocation}
          familyMembers={familyMembers}
          resultCount={0} // Will be updated by InventoryList
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          sortKey={sortKey}
          onSortKeyChange={setSortKey}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
        />
        
        <div className="flex justify-end">
          <InventoryViewToggle viewType={viewType} onViewChange={setViewType} />
        </div>
      </div>
      
      <section className="flex-1 overflow-y-auto p-4 md:p-6">
        <InventoryErrorBoundary>
          <InventoryList
            searchTerm={searchTerm}
            sortConfig={{ key: sortKey, direction: sortDirection as "asc" | "desc" }} 
            category={category}
            familyMemberId={familyMemberId}
            primaryLocation={primaryLocation}
            viewType={viewType}
          />
        </InventoryErrorBoundary>
      </section>
    </Layout>
  );
}
