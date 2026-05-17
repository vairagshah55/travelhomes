import SuperhostBadge from "./SuperhostBadge";

export interface HostCardProps {
  name: string;
  avatarUrl?: string;
  hostedSince?: string;
  responseRate?: number;
  responseTime?: string;
  isSuperhost?: boolean;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function HostCard({
  name,
  avatarUrl,
  hostedSince,
  responseRate,
  responseTime,
  isSuperhost = false,
  className = "",
}: HostCardProps) {
  return (
    <div
      className={`bg-ds-white font-sans flex flex-col gap-4 ${className}`}
      style={{
        border: "1.5px solid var(--ds-pebble)",
        borderRadius: 12,
        padding: 20,
        boxShadow: "var(--ds-shadow-card)",
      }}
    >
      {/* Top row: avatar + info */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${name}'s avatar`}
            className="w-16 h-16 object-cover shrink-0"
            style={{ borderRadius: 999 }}
          />
        ) : (
          <div
            className="w-16 h-16 shrink-0 bg-ds-sky text-ds-deep flex items-center justify-center font-sans font-semibold text-[20px] select-none"
            style={{ borderRadius: 999 }}
            aria-label={`${name} initials`}
          >
            {getInitials(name)}
          </div>
        )}

        {/* Host info */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-serif text-[18px] font-medium text-ds-navy leading-tight truncate">
              {name}
            </span>
            {isSuperhost && <SuperhostBadge />}
          </div>

          {hostedSince && (
            <span className="text-[13px] text-ds-slate leading-none">
              Hosted since {hostedSince}
            </span>
          )}

          {/* Response stats */}
          {(responseRate !== undefined || responseTime) && (
            <div className="flex flex-col gap-1 mt-1">
              {responseRate !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-ds-slate shrink-0">
                    Response rate:
                  </span>
                  <div
                    className="flex-1 h-1.5 rounded-full bg-ds-mist overflow-hidden"
                    style={{ maxWidth: 80 }}
                    role="progressbar"
                    aria-valuenow={responseRate}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Response rate ${responseRate}%`}
                  >
                    <div
                      className="h-full bg-ds-deep rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, responseRate))}%` }}
                    />
                  </div>
                  <span className="text-[12px] font-semibold text-ds-charcoal shrink-0">
                    {responseRate}%
                  </span>
                </div>
              )}
              {responseTime && (
                <span className="text-[12px] text-ds-slate">
                  Responds{" "}
                  <span className="text-ds-charcoal font-medium">{responseTime}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Contact button */}
      <button
        type="button"
        className="
          w-full h-10 rounded-[8px]
          bg-ds-deep text-ds-white
          font-sans font-medium text-[14px]
          transition-colors duration-200
          hover:bg-ds-navy
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-ocean focus-visible:ring-offset-2
          active:opacity-90
        "
      >
        Contact Host
      </button>
    </div>
  );
}
