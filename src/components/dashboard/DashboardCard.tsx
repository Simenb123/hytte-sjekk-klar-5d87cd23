
import React from 'react';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const DashboardCard = ({ title, description, icon, color }: DashboardCardProps) => {
  return (
    <div className={`${color} text-white rounded-lg shadow-lg p-6 transition-all hover:shadow-xl hover:scale-105`}>
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <p>{description}</p>
    </div>
  );
};

export default DashboardCard;
