
import AppHeader from "@/components/AppHeader";
import AiChat from "@/components/AiChat";

export default function AiHelperPage() {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <AppHeader title="Hyttehjelper" showBackButton={true} />
      <div className="flex-1 overflow-hidden">
        <AiChat />
      </div>
    </div>
  );
}

