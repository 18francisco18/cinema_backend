const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const simplePaymentReport = new Schema({
    receiptNumber: { type: Number, unique: true },
    paymentDate : { type: Date, default: Date.now },
    description: { type: String, required: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    issuedAt: { type: Date, default: Date.now },
    amountPaid: { type: Number, required: true },
    currency : { type: String, default: "eur" },
});

const SimplePaymentReport = mongoose.model('SimplePaymentReport', simplePaymentReport);

module.exports = SimplePaymentReport;