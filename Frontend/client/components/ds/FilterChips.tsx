export interface FilterChipsProps {
  chips: string[];
  selected: string[];
  onToggle: (chip: string) => void;
  className?: string;
}

export default function FilterChips({
  chips,
  selected,
  onToggle,
  className = "",
}: FilterChipsProps) {
  return (
    <div
      className={`overflow-x-auto scrollbar-hide flex gap-2 py-1 ${className}`}
    >
      {chips.map((chip) => {
        const isSelected = selected.includes(chip);
        return (
          <button
            key={chip}
            onClick={() => onToggle(chip)}
            className={[
              "rounded-full px-4 py-2 text-sm font-medium border transition-all duration-200 whitespace-nowrap cursor-pointer",
              isSelected
                ? "bg-ds-deep border-ds-deep text-ds-white"
                : "bg-ds-white border-ds-pebble text-ds-charcoal hover:border-ds-ocean hover:text-ds-ocean",
            ].join(" ")}
          >
            {chip}
          </button>
        );
      })}
    </div>
  );
}
