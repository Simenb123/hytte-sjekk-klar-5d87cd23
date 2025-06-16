
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
      <div className="mb-4">{icon}</div>
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p>{description}</p>
    </div>
  );
};

export default DashboardCard;
