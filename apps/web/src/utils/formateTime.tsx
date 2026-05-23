// Date only: 01 Jan 2024
export const formatDate = (dateString?: string) => {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Date + time: 01 Jan 2024, 05:30 AM
export const formatDateTime = (dateString?: string) => {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Date only without timezone shift (safe for UTC Z dates)
export const formatDateOnlyUTC = (dateString?: string) => {
  if (!dateString) return "-";

  const [date] = dateString.split("T");
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
