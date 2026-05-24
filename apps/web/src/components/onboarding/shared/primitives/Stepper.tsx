import React from "react";
import { Minus, Plus } from "lucide-react";
import {
  BLACK,
  WHITE,
  TEAL,
  TEAL_BG,
  GRAY_400,
  GRAY_200,
  ERROR,
} from "./tokens";

interface StepperProps {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  min?: number;
  max?: number;
  // Increment button uses teal-filled variant by default. Pass `outlined` to
  // render both buttons as neutral outlined circles (used in activity/PricingStep).
  outlined?: boolean;
}

const Stepper: React.FC<StepperProps> = ({
  value,
  onDecrease,
  onIncrease,
  min = 0,
  max = 99,
  outlined,
}) => {
  const minusDisabled = value <= min;
  const plusDisabled = value >= max;
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onDecrease}
        disabled={minusDisabled}
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: `1.5px solid ${GRAY_200}`,
          backgroundColor: WHITE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: minusDisabled ? "not-allowed" : "pointer",
          opacity: minusDisabled ? 0.35 : 1,
          transition: "all 0.15s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
        onMouseEnter={(e) => {
          if (!minusDisabled) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = ERROR;
            (e.currentTarget as HTMLButtonElement).style.color = ERROR;
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = GRAY_200;
          (e.currentTarget as HTMLButtonElement).style.color = BLACK;
        }}
      >
        <Minus size={14} />
      </button>

      <span
        style={{
          width: 36,
          textAlign: "center",
          fontSize: 17,
          fontWeight: 700,
          color: value > 0 ? BLACK : GRAY_400,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        disabled={plusDisabled}
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: `1.5px solid ${outlined ? GRAY_200 : TEAL}`,
          backgroundColor: outlined ? WHITE : TEAL_BG,
          color: outlined ? BLACK : TEAL,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: plusDisabled ? "not-allowed" : "pointer",
          opacity: plusDisabled ? 0.35 : 1,
          transition: "all 0.15s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
        onMouseEnter={(e) => {
          if (plusDisabled) return;
          if (outlined) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = TEAL;
            (e.currentTarget as HTMLButtonElement).style.color = TEAL;
          } else {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "rgba(24, 95, 165, 0.18)";
          }
        }}
        onMouseLeave={(e) => {
          if (outlined) {
            (e.currentTarget as HTMLButtonElement).style.borderColor = GRAY_200;
            (e.currentTarget as HTMLButtonElement).style.color = BLACK;
          } else {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = TEAL_BG;
          }
        }}
      >
        <Plus size={14} />
      </button>
    </div>
  );
};

export default Stepper;
