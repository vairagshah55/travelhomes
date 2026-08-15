/**
 * Cashfree Payment Gateway REST client.
 *
 * Deliberately not the `cashfree-pg` SDK — the two calls we need are plain
 * JSON over HTTPS, and Node 22 ships global fetch, so a dependency would buy
 * nothing but version churn.
 *
 * The important asymmetry with Razorpay: Cashfree Checkout hands the browser
 * no signature to forward. The only trustworthy confirmation is asking
 * Cashfree directly what happened to the order — see `fetchOrderPayments`,
 * which the verify path uses as its source of truth.
 */
const env = require("../../config/env");
const { AppError } = require("../../shared/errors");

const HOSTS = {
  TEST: "https://sandbox.cashfree.com",
  PROD: "https://api.cashfree.com",
};

// Pinned rather than floating: Cashfree changes response shapes between API
// versions, and `payment_status` below is version-specific.
const API_VERSION = "2023-08-01";

const REQUEST_TIMEOUT_MS = 15_000;

function credentials() {
  if (!env.CASHFREE_APP_ID || !env.CASHFREE_SECRET_KEY) {
    throw new AppError(
      "CASHFREE_NOT_CONFIGURED",
      503,
      "Payment gateway is not configured on the server.",
    );
  }
  return {
    baseUrl: HOSTS[env.CASHFREE_ENV] || HOSTS.TEST,
    appId: env.CASHFREE_APP_ID,
    secretKey: env.CASHFREE_SECRET_KEY,
  };
}

async function call(method, path, body) {
  const { baseUrl, appId, secretKey } = credentials();

  let res;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "x-api-version": API_VERSION,
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "content-type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    // Network failure or timeout — never a client error, so 502 not 400.
    throw new AppError("CASHFREE_UNREACHABLE", 502, `Could not reach Cashfree: ${err.message}`);
  }

  const text = await res.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new AppError("CASHFREE_BAD_RESPONSE", 502, "Cashfree returned a non-JSON response.");
  }

  if (!res.ok) {
    const message = payload?.message || `Cashfree request failed (${res.status})`;
    throw new AppError("CASHFREE_ERROR", 502, message);
  }
  return payload;
}

/**
 * Create an order. `amount` is in RUPEES — unlike Razorpay, which wants paise.
 * Getting this backwards is the classic Cashfree bug, so the conversion lives
 * only here and the service layer always speaks rupees.
 */
async function createOrder({ orderId, amount, customer, note, returnUrl }) {
  const body = {
    order_id: orderId,
    order_amount: Number(Number(amount).toFixed(2)),
    order_currency: "INR",
    customer_details: {
      customer_id: customer.id,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
    },
  };
  if (note) body.order_note = note.slice(0, 200);
  if (returnUrl) body.order_meta = { return_url: returnUrl };

  return call("POST", "/pg/orders", body);
}

/** Every payment attempt against an order, newest attempts included. */
async function fetchOrderPayments(orderId) {
  const payments = await call("GET", `/pg/orders/${encodeURIComponent(orderId)}/payments`);
  return Array.isArray(payments) ? payments : [];
}

function isConfigured() {
  return Boolean(env.CASHFREE_APP_ID && env.CASHFREE_SECRET_KEY);
}

module.exports = {
  createOrder,
  fetchOrderPayments,
  isConfigured,
  API_VERSION,
};
