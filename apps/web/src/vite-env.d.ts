/// <reference types="vite/client" />

interface Window {
  Razorpay: any;
  // Injected by the Cashfree v3 checkout SDK — see lib/checkout.ts.
  Cashfree: any;
}
