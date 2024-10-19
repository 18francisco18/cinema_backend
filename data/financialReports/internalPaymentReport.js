const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InternalPaymentReportSchema = new Schema({
  paymentId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  created_at: { type: Date, required: true },
  report_generated_at: { type: Date, default: Date.now },
});

const FinancialReport = mongoose.model("InternalPaymentReport", InternalPaymentReportSchema);

module.exports = FinancialReport;
