import React from "react";

const StatsCard = ({ title, value, icon }) => {
  const Icon = icon;
  return (
    <div className="flex flex-col border shadow-sm p-5 rounded-md hover:shadow-lg transition-all duration-300">
      <div className="flex items-center gap-2 mb-2">
        <Icon name={icon} className="w-4 h-4" />
        <h3>{title}</h3>
      </div>
      <p className="text-lg font-bold">{value || "N/A"}</p>
    </div>
  );
};

export default StatsCard;
