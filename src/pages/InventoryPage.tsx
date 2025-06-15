
import AppHeader from "@/components/AppHeader";
import InventoryList from "@/components/inventory/InventoryList";
import { NewItemDialog } from "@/components/inventory/NewItemDialog";

export default function InventoryPage() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <AppHeader title="Inventar" showBackButton={true}>
        <NewItemDialog />
      </AppHeader>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <InventoryList />
      </main>
    </div>
  );
}
