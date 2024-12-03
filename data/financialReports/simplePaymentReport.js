const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const simplePaymentReport = new Schema({
    type: { type: String, required: true, default: "simplePaymentReport"},
    paymentId: { type: String, required: true },
    receiptNumber: { type: Number, unique: true },
    description: { type: String, required: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    issuedAt: { type: Date, default: Date.now },
    amountPaid: { type: Number, required: true },
    currency : { type: String, default: "eur" },
});

const SimplePaymentReport = mongoose.model('SimplePaymentReport', simplePaymentReport);

module.exports = SimplePaymentReport;