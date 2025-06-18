
import React, { useMemo } from "react";
import { useInventory } from "@/hooks/useInventory";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import InventoryLoading from "./InventoryLoading";
import InventoryError from "./InventoryError";
import InventoryListView from "./InventoryListView";
import { InventoryGridView } from "./InventoryGridView";

interface InventoryListProps {
  searchTerm: string;
  sortConfig: { key: string; direction: "asc" | "desc" };
  category: string;
  familyMemberId: string;
  viewType: "list" | "grid";
}

const InventoryList: React.FC<InventoryListProps> = ({
  searchTerm,
  sortConfig,
  category,
  familyMemberId,
  viewType,
}) => {
  const { data: items = [], isLoading, error } = useInventory();
  const { data: familyMembers = [] } = useFamilyMembers();

  const filteredAndSortedItems = useMemo(() => {
    let filtered = items;

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(search) ||
          item.description?.toLowerCase().includes(search) ||
          item.category?.toLowerCase().includes(search) ||
          item.brand?.toLowerCase().includes(search) ||
          item.color?.toLowerCase().includes(search) ||
          item.location?.toLowerCase().includes(search) ||
          item.notes?.toLowerCase().includes(search)
      );
    }

    // Apply category filter
    if (category !== "all") {
      filtered = filtered.filter((item) => item.category === category);
    }

    // Apply family member filter
    if (familyMemberId !== "all") {
      if (familyMemberId === "none") {
        filtered = filtered.filter((item) => !item.family_member_id);
      } else {
        filtered = filtered.filter((item) => item.family_member_id === familyMemberId);
      }
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortConfig.key as keyof typeof a];
      let bValue = b[sortConfig.key as keyof typeof b];

      // Handle special case for owner sorting
      if (sortConfig.key === "owner") {
        const aMember = familyMembers.find(m => m.id === a.family_member_id);
        const bMember = familyMembers.find(m => m.id === b.family_member_id);
        aValue = aMember?.name || a.owner || "";
        bValue = bMember?.name || b.owner || "";
      }

      // Convert to strings for comparison
      const aStr = String(aValue || "").toLowerCase();
      const bStr = String(bValue || "").toLowerCase();

      if (sortConfig.direction === "asc") {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

    return sorted;
  }, [items, searchTerm, category, familyMemberId, sortConfig, familyMembers]);

  console.log("[InventoryList] Filtering results:", {
    totalItems: items.length,
    filteredItems: filteredAndSortedItems.length,
    searchTerm,
    category,
    familyMemberId,
    sortConfig,
  });

  if (isLoading) return <InventoryLoading />;
  if (error) return <InventoryError error={error.message} />;

  if (viewType === "grid") {
    return <InventoryGridView items={filteredAndSortedItems} />;
  }

  return <InventoryListView items={filteredAndSortedItems} />;
};

export default InventoryList;
