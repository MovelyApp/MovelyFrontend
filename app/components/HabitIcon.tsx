type HabitIconProps = {
  type: "water" | "steps" | "sleep" | "workout" | "study";
};

export default function HabitIcon({ type }: HabitIconProps) {
  const sharedProps = {
    "aria-hidden": true,
    fill: "none",
    height: 20,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
    width: 20,
  };

  if (type === "water") {
    return (
      <svg {...sharedProps}>
        <path d="M12 3.5s6 6.1 6 10.5a6 6 0 0 1-12 0c0-4.4 6-10.5 6-10.5Z" />
        <path d="M9.5 15.2c.6 1.3 1.6 2 3.1 2" />
      </svg>
    );
  }

  if (type === "steps") {
    return (
      <svg {...sharedProps}>
        <path d="M7.4 4.4c1.6-.2 3 1 3.2 2.6.2 1.5-.4 3.3-1.8 3.6-1.5.4-3.4-.8-3.9-2.4-.5-1.8.7-3.6 2.5-3.8Z" />
        <path d="M16.6 13.4c1.6-.2 3 1 3.2 2.6.2 1.5-.4 3.3-1.8 3.6-1.5.4-3.4-.8-3.9-2.4-.5-1.8.7-3.6 2.5-3.8Z" />
        <path d="M8.4 12.8 7.8 16" />
        <path d="m15.6 8 .6 3.2" />
      </svg>
    );
  }

  if (type === "sleep") {
    return (
      <svg {...sharedProps}>
        <path d="M19 15.5A8 8 0 0 1 8.5 5a7 7 0 1 0 10.5 10.5Z" />
        <path d="M15.5 4.5h3l-3 3h3" />
      </svg>
    );
  }

  if (type === "workout") {
    return (
      <svg {...sharedProps}>
        <path d="M6 7v10" />
        <path d="M18 7v10" />
        <path d="M3.5 9v6" />
        <path d="M20.5 9v6" />
        <path d="M6 12h12" />
      </svg>
    );
  }

  return (
    <svg {...sharedProps}>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v16H7.5A2.5 2.5 0 0 1 5 16.5v-11Z" />
      <path d="M5 16.5A2.5 2.5 0 0 0 7.5 19H19" />
      <path d="M9 7h6" />
      <path d="M9 10h4" />
    </svg>
  );
}
