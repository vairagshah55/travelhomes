/**
 * Gateway-agnostic checkout.
 *
 * The server decides which provider is live (PAYMENT_GATEWAY) and says so via
 * GET /api/payments/gateway. Callers hand this module a booking payload and
 * get back a booking id — which SDK loaded and which endpoints were hit is
 * not their problem.
 *
 * The two providers prove a payment differently, and that difference is the
 * only real branch below:
 *
 *   Razorpay  the browser receives a signature and forwards it; the server
 *             verifies the HMAC locally.
 *   Cashfree  the browser receives nothing it can prove. We send only the
 *             order id and the server asks Cashfree what actually happened,
 *             so a closed-early modal or a lying client both end in the same
 *             honest answer.
 */
import axios from "axios";

export type GatewayInfo =
  | { gateway: "razorpay"; key: string | null; configured: boolean }
  | { gateway: "cashfree"; mode: "sandbox" | "production"; configured: boolean };

export interface CheckoutCustomer {
  id?: string;
  name: string;
  email: string;
  phone: string;
}

interface StartCheckoutArgs {
  baseUrl: string;
  gateway: GatewayInfo;
  /** Rupees. Both gateways are fed the right unit internally. */
  amount: number;
  customer: CheckoutCustomer;
  note?: string;
  /**
   * Builds the booking blob the verify endpoint persists. Razorpay knows the
   * payment id in the browser and passes it; Cashfree does not, so treat the
   * argument as optional.
   */
  buildBooking: (ctx: { gateway: string; transactionId?: string }) => Record<string, unknown>;
}

// `window.Razorpay` / `window.Cashfree` are declared in vite-env.d.ts — both
// SDKs are loaded at runtime from a CDN, so neither ships types.
const SDK_URLS = {
  razorpay: "https://checkout.razorpay.com/v1/checkout.js",
  cashfree: "https://sdk.cashfree.com/js/v3/cashfree.js",
};

/** Idempotent — a second call for an already-injected src resolves immediately. */
function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function fetchGateway(baseUrl: string): Promise<GatewayInfo> {
  const res = await axios.get(`${baseUrl}/api/payments/gateway`);
  return res.data.data as GatewayInfo;
}

async function payWithRazorpay({
  baseUrl,
  gateway,
  amount,
  customer,
  buildBooking,
}: StartCheckoutArgs): Promise<{ bookingId: string }> {
  if (gateway.gateway !== "razorpay") throw new Error("wrong gateway");
  if (!(await loadScript(SDK_URLS.razorpay))) throw new Error("Razorpay SDK failed to load");

  const orderResult = await axios.post(`${baseUrl}/api/payments/razor/create-order`, { amount });
  const { id, amount: orderAmount, currency } = orderResult.data;

  // Razorpay Checkout is callback-shaped; bridge it to the promise the caller
  // is awaiting so both gateways read the same way at the call site.
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: gateway.key,
      amount: orderAmount,
      currency,
      name: "Travel Homes",
      description: "Booking payment",
      order_id: id,
      handler: async (response: Record<string, string>) => {
        try {
          const verifyResult = await axios.post(`${baseUrl}/api/payments/razor/verify-payment`, {
            razorpay_signature: response.razorpay_signature,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            booking: buildBooking({
              gateway: "razorpay",
              transactionId: response.razorpay_payment_id,
            }),
          });
          if (!verifyResult.data.success) {
            reject(new Error(verifyResult.data.message || "Payment verification failed"));
            return;
          }
          resolve({ bookingId: verifyResult.data.bookingId });
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        // Without this the promise never settles when the user walks away.
        ondismiss: () => reject(new Error("Payment cancelled")),
      },
      prefill: { name: customer.name, email: customer.email, contact: customer.phone },
      theme: { color: "#3399cc" },
    });
    rzp.open();
  });
}

async function payWithCashfree({
  baseUrl,
  gateway,
  amount,
  customer,
  note,
  buildBooking,
}: StartCheckoutArgs): Promise<{ bookingId: string }> {
  if (gateway.gateway !== "cashfree") throw new Error("wrong gateway");
  if (!(await loadScript(SDK_URLS.cashfree))) throw new Error("Cashfree SDK failed to load");

  const orderResult = await axios.post(`${baseUrl}/api/payments/cashfree/create-order`, {
    amount,
    customer,
    note,
  });
  const { orderId, paymentSessionId } = orderResult.data.data;

  const cf = window.Cashfree({ mode: gateway.mode });
  const result = await cf.checkout({ paymentSessionId, redirectTarget: "_modal" });

  // A modal error means the SDK itself gave up (user closed it, network died).
  // Anything else — including "looks successful" — is still only the browser's
  // opinion, so the server gets the final word either way.
  if (result?.error) {
    throw new Error(result.error.message || "Payment was not completed");
  }

  const verifyResult = await axios.post(`${baseUrl}/api/payments/cashfree/verify-payment`, {
    cashfree_order_id: orderId,
    booking: buildBooking({ gateway: "cashfree" }),
  });
  if (!verifyResult.data.success) {
    throw new Error(verifyResult.data.message || "Payment verification failed");
  }
  return { bookingId: verifyResult.data.bookingId };
}

export async function startCheckout(args: StartCheckoutArgs): Promise<{ bookingId: string }> {
  if (!args.gateway.configured) {
    throw new Error("Payments are not configured on the server");
  }
  return args.gateway.gateway === "cashfree" ? payWithCashfree(args) : payWithRazorpay(args);
}
