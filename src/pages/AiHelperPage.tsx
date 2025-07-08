
import Header from "@/components/Header";
import AiChat from "@/components/AiChat";

export default function AiHelperPage() {
  return (
    <main className="flex flex-col h-screen bg-gray-100">
      <Header title="Hyttehjelper" showBackButton={true} />
      <div className="flex-1 overflow-hidden">
        <AiChat />
      </div>
    </main>
  );
}
