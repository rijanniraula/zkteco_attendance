import React from "react";
import { Airplane, CloseCircle, Coffee, TickCircle, Timer1 } from "iconsax-reactjs";
import Figures from "./Figures";

const FIGURES = [
  { key: "present", label: "Present", icon: TickCircle },
  { key: "late", label: "Late", icon: Timer1 },
  { key: "absent", label: "Absent", icon: CloseCircle },
  { key: "leave", label: "Leave", icon: Airplane },
  { key: "holiday", label: "Holidays", icon: Coffee },
];

// Day totals for a date range
const TotalsCards = ({ totals }) => (
  <Figures
    items={FIGURES.map(({ key, label, icon }) => ({
      label: (totals?.[key] ?? 0) === 1 && key === "holiday" ? "Holiday" : label,
      value: totals?.[key] ?? 0,
      tone: key,
      icon,
    }))}
  />
);

export default TotalsCards;
