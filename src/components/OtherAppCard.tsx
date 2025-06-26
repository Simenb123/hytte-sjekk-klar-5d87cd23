import React from 'react';
import { toast } from 'sonner';
import { OtherApp } from '@/types/other-app';
import AppDescriptionDialog from './AppDescriptionDialog';

interface OtherAppCardProps {
  app: OtherApp;
}

const OtherAppCard: React.FC<OtherAppCardProps> = ({ app }) => {
  const openExternalLink = () => {
    if (app.url) {
      window.open(app.url, '_blank');
      toast.success(`\u00c5pner ${app.name} i App Store`, {
        description: 'Installer appen for full funksjonalitet',
      });
    }
  };

  const CardContent = (
    <div
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden h-full cursor-pointer"
    >
      <div className={`${app.color} p-4 text-white flex items-center justify-center`}>
        <app.icon size={32} />
      </div>
      <div className="p-3">
        <h3 className="text-base font-semibold mb-1">{app.name}</h3>
        <p className="text-gray-600 text-xs">{app.shortDescription}</p>
      </div>
    </div>
  );

  if (app.url) {
    return <div onClick={openExternalLink}>{CardContent}</div>;
  }

  if (app.longDescription) {
    return (
      <AppDescriptionDialog
        title={app.name}
        description={app.longDescription}
        trigger={CardContent}
      />
    );
  }

  return CardContent;
};

export default OtherAppCard;
