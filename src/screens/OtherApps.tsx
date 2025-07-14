import React from 'react';
import Layout from '@/layout/Layout';
import OtherAppCard from '@/components/otherApps/OtherAppCard';
import { otherApps } from '@/data/other-apps';

const OtherApps: React.FC = () => {
  return (
    <Layout title="Andre apper" showBackButton>
      <div className="w-full p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {otherApps.map((app) => (
            <OtherAppCard key={app.id} app={app} />
          ))}
        </div>
        <div className="text-center text-sm text-gray-500">
          <p>Klikk p\u00e5 app-ikonene for mer informasjon</p>
        </div>
      </div>
    </Layout>
  );
};

export default OtherApps;
