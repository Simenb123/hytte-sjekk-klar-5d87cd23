
import Layout from "@/layout/Layout";
import AiChat from "@/components/chat/AiChat";

export default function AiHelperPage() {
  return (
    <Layout title="Hyttehjelper" showBackButton>
      <div className="flex-1 overflow-hidden">
        <AiChat />
      </div>
    </Layout>
  );
}
