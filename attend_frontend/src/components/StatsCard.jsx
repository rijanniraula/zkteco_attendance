import React from "react";

const StatsCard = ({
  title,
  value,
  icon,
  className,
  iconClassName,
  subText,
}) => {
  return (
    <div
      className={`flex flex-col space-y-3 border p-5 rounded-xl hover:shadow-lg hover:translate-y-[-2px] transition-all duration-300 ${
        className ? className : "bg-card"
      }`}
    >
      <div className="flex justify-between ">
        <div
          className="space-y-1
        "
        >
          <h3 className="text-sm text-muted-foreground font-semibold">
            {title}
          </h3>
          <div className="text-2xl font-bold">{value || "N/A"}</div>
        </div>
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconClassName}`}
        >
          {icon}
        </div>
      </div>
      <span className="text-xs text-muted-foreground">{subText}</span>
    </div>
  );
};

export default StatsCard;
