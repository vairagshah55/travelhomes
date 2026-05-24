import React from "react";
import { ERROR } from "./tokens";

interface ErrorMsgProps {
  message?: string | null;
  size?: 11 | 11.5 | 12 | 13;
  iconSize?: 11 | 12 | 14;
  marginTop?: number;
}

const ErrorMsg: React.FC<ErrorMsgProps> = ({
  message,
  size = 11.5,
  iconSize = 12,
  marginTop,
}) => {
  if (!message) return null;
  return (
    <div
      className="flex items-center gap-1.5"
      style={marginTop != null ? { marginTop } : undefined}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5.25" stroke={ERROR} strokeWidth="1.5" />
        <path
          d="M6 3.5v3M6 8.25v.25"
          stroke={ERROR}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <p style={{ fontSize: size, color: ERROR }}>{message}</p>
    </div>
  );
};

export default ErrorMsg;
