const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sessionReportSchema = new Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    required: true,
  },
  sessionTicketPrice: { type: Number, required: true },
  ticketsSold: { type: Number, required: true, default: 0 },
  totalTicketsSold: { type: Number, required: true, default: 0 },
  cancellationsTotal: { type: Number, required: true, default: 0 },
  cancellationsPeriods: {
    before2Hours: { type: Number, required: true, default: 0 },
    between2HoursAnd30Minutes: { type: Number, required: true, default: 0 },
    after30Minutes: { type: Number, required: true, default: 0 },
  },
  ticketAmountGenerated: { type: Number, required: true, default: 0 },
  cancellationAmountGenerated: { type: Number, required: true, default: 0 },
  totalAmountGenerated: { type: Number, required: true, default: 0 },
  seatsUnsold: { type: Number, required: true, default: 0 },
  reportGeneratedAt: { type: Date, default: Date.now },
});