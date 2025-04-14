
import React from 'react';
import { Link } from 'react-router-dom';

interface DashboardCardProps {
  linkTo: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  linkTo, 
  icon, 
  title, 
  description, 
  color = "bg-blue-500" // Default color if none provided
}) => {
  return (
    <Link to={linkTo} className="block">
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
        <div className={`${color} p-4 text-white flex items-center justify-center`}>
          {icon}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className="text-gray-600 text-sm">{description}</p>
        </div>
      </div>
    </Link>
  );
};

export default DashboardCard;
