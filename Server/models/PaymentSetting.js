// Which payment gateway the checkout drives, chosen by an admin at runtime.
//
// Singleton by construction: `key` is fixed to "gateway" and unique, so
// findOneAndUpdate({ key: "gateway" }, ..., { upsert: true }) can never race
// two documents into existence.
//
// Absent document = "no admin has chosen", which the payments service reads as
// "fall back to the PAYMENT_GATEWAY env var". That keeps a fresh deployment
// behaving exactly as it did before this table existed.
const mongoose = require("mongoose");
const { Schema } = mongoose;

const PaymentSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "gateway" },
    gateway: { type: String, required: true, enum: ["razorpay", "cashfree"] },
    // Audit trail — switching gateways mid-flight is worth being able to trace.
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.PaymentSetting || mongoose.model("PaymentSetting", PaymentSettingSchema);
