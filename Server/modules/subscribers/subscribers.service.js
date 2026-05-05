/**
 * Subscribers service — newsletter signup.
 *
 * Re-subscribes a previously-unsubscribed email instead of erroring; that
 * matches the legacy contract.
 */
const Subscriber = require("../../models/Subscriber");
const { ConflictError } = require("../../shared/errors");

async function subscribe({ email }) {
  const existing = await Subscriber.findOne({ email });
  if (existing) {
    if (existing.status === "unsubscribed") {
      existing.status = "active";
      await existing.save();
      return {
        message: "Welcome back! You have successfully resubscribed.",
        data: existing,
      };
    }
    throw new ConflictError("Email is already subscribed");
  }

  const created = await Subscriber.create({ email });
  return { message: "Successfully subscribed to newsletter", data: created };
}

async function list() {
  const subscribers = await Subscriber.find().sort({ createdAt: -1 });
  return { count: subscribers.length, data: subscribers };
}

module.exports = { subscribe, list };
