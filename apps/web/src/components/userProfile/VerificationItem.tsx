interface VerificationItemProps {
  confirmed: boolean;
  label: string;
}

const VerificationItem = ({ confirmed, label }: VerificationItemProps) => (
  <div className="flex items-center gap-3">
    {confirmed ? (
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 19 20">
        <path
          d="M3.16699 10L7.91699 14.75L15.8337 5.25"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    )}
    <span className="text-sm font-plus-jakarta">{label}</span>
  </div>
);

export default VerificationItem;
