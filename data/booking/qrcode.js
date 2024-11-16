const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const qrCodeSchema = new Schema({
  qrCodeId: { type: String, required: true, unique: true }, // ID único para o QR Code
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true }, // ID da reserva associada
  tickets: [
    {
        ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true },
        _id: false,
    },
  ],
  products: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      _id: false,
    },
  ],
  expirationDate: { type: Date, required: true }, // Data de validade do QR Code
  remainingUses: { type: Number, default: 1 }, // Número de usos restantes
  isUsed: { type: Boolean, default: false }, // Indica se o QR Code foi usado
  usedAt: { type: Date, required: false }, // Momento em que foi utilizado
  createdAt: { type: Date, default: Date.now }, // Data de criação
  isRevoked: { type: Boolean, default: false }, // Indica se o QR Code foi revogado
  signature: { type: String, required: true }, // Assinatura criptográfica para validar autenticidade
});


const QRCode = mongoose.model("QRCode", qrCodeSchema);
module.exports = QRCode;