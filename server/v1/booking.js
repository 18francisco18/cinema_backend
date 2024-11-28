const bodyParser = require("body-parser");
const express = require("express");
const bookingController = require("../../data/booking/controller");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const bookingService = require("../../data/booking");

function BookingRouter() {
  let router = express();

  // Rota do webhook do Stripe, com o middleware específico primeiro
  router.post(
    "/webhook",
    bodyParser.raw({ type: "application/json" }),
    async (req, res) => {
      console.log("Webhook received:", req.headers["stripe-signature"]);
      const sig = req.headers["stripe-signature"];
      let event;

      try {
        console.log("Constructing Stripe event...");
        // Verificar a assinatura e decodificar o evento enviado pelo Stripe
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        console.log("Webhook event type:", event.type);
      } catch (err) {
        console.error("Erro ao verificar assinatura do webhook:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Manipular o evento de acordo com o tipo
      switch (event.type) {
        case "payment_intent.created":
          const paymentIntentCreated = event.data.object;
          console.log("bookingId:", paymentIntentCreated.metadata.bookingId);
          console.log("paymentIntentId:", paymentIntentCreated.id);

          // Encontrar o booking associado ao paymentIntentId
          const booking = await bookingService.findById(
            paymentIntentCreated.metadata.bookingId
          );
          if (!booking) {
            console.error(
              "Booking não encontrado para o paymentIntentId:",
              paymentIntentCreated.id
            );
            return res.status(404).send("Booking não encontrado");
          }

          booking.paymentIntentId = paymentIntentCreated.id;
          await booking.save();
          break;

        case "checkout.session.completed":
          const session = event.data.object;
          console.log("session:", session);
          console.log(
            "Metadados atualizados para o Payment Intent:",
            session.payment_intent
          );
          break;

        case "payment_intent.succeeded":
          const paymentIntent = event.data.object;
          console.log("Payment Intent Succeeded - Full Details:", {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            metadata: paymentIntent.metadata,
            bookingId: paymentIntent.metadata?.bookingId,
            created: new Date(paymentIntent.created * 1000).toISOString(),
          });

          try {
            console.log("Initiating payment confirmation handling...");
            // Handle payment confirmation through the service which will update status
            // and handle all necessary side effects (emails, QR codes, etc)
            await bookingController.handlePaymentConfirmation(
              paymentIntent.id,
              null
            );
            console.log("Payment confirmation handled successfully");
          } catch (error) {
            console.error("Detailed error in payment confirmation:", {
              message: error.message,
              stack: error.stack,
              name: error.name,
            });
            // Don't throw here - we want to acknowledge the webhook
          }
          break;

        case "charge.updated":
          const charge = event.data.object;
          console.log("Cobrança atualizada para:", charge.id);
          break;

        default:
          console.warn(`Evento não tratado: ${event.type}`);
      }

      // Retornar uma resposta para confirmar o recebimento do evento
      console.log("Sending webhook response");
      res.json({ received: true });
    }
  );

  // Outros middlewares gerais para as demais rotas
  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  // Outras rotas normais
  router.get("/find/:id", bookingController.getBookingById);
  router.get("/findAll", bookingController.findAllBookings);
  router.get(
    "/:sessionId/findAll",
    bookingController.findAllBookingsForSession
  );

  router.put("/update/:id", bookingController.updateBookingById);

  router.post("/:id/create", bookingController.createBooking);
  router.post("/:id/cancelReservation", bookingController.cancelReservation);
  router.post(
    "/:bookingId/refundTickets",
    bookingController.refundTicketsFromBooking
  );

  router.delete("/remove/:id", bookingController.removeBookingById);

  return router;
}

module.exports = BookingRouter;
