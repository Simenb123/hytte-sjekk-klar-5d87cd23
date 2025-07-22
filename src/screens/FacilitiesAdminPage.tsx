import Layout from "@/layout/Layout";
import { FacilitiesAdmin } from "@/components/facilities/FacilitiesAdmin";

export default function FacilitiesAdminPage() {
  return (
    <Layout title="Fasilitetsadministrasjon">
      <div className="container mx-auto py-6">
        <FacilitiesAdmin />
      </div>
    </Layout>
  );
}