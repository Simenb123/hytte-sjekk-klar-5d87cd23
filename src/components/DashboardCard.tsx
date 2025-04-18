
import React from 'react';
import { Link } from 'react-router-dom';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  linkTo: string;
  color: string;
}

const DashboardCard = ({ title, description, icon, linkTo, color }: DashboardCardProps) => {
  return (
    <Link to={linkTo} className="block">
      <div className={`${color} text-white rounded-lg shadow-lg p-6 transition-all hover:shadow-xl hover:scale-105`}>
        <div className="mb-4">{icon}</div>
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p>{description}</p>
      </div>
    </Link>
  );
};

export default DashboardCard;
