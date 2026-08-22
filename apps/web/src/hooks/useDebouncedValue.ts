import { useEffect, useState } from "react";

/**
 * Trailing-edge debounce for a value that drives a request.
 *
 * Added for the /blogs search box once matching moved to the server: without
 * it, every keystroke was its own `GET /api/blogs?search=…`, and the responses
 * could land out of order.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
}

export default useDebouncedValue;
