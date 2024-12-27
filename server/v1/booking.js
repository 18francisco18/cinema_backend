const bodyParser = require("body-parser");
const express = require("express");
const bookingController = require("../../data/booking/controller");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const bookingService = require("../../data/booking");
const Booking = require("../../data/booking/booking"); // Importando o modelo correto

function BookingRouter() {
  let router = express();

  // Outros middlewares gerais para as demais rotas
  router.use((req, res, next) => {
    if (req.originalUrl === '/api/v1/bookings/webhook') {
      next();
    } else {
      bodyParser.json({ limit: "100mb" })(req, res, next);
    }
  });
  router.use((req, res, next) => {
    if (req.originalUrl === '/api/v1/bookings/webhook') {
      next();
    } else {
      bodyParser.urlencoded({ limit: "100mb", extended: true })(req, res, next);
    }
  });

  // Rota do webhook do Stripe, com o middleware específico primeiro
  router.post(
    "/webhook",
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      console.log("Webhook received:", sig);
      
      if (!sig) {
        console.error("No stripe signature found");
        return res.status(400).send("No stripe signature found");
      }

      let event;
      try {
        console.log("Constructing Stripe event...");
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        console.log("Webhook event constructed successfully:", event.type);
      } catch (err) {
        console.error("Erro ao verificar assinatura do webhook:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Manipular o evento de acordo com o tipo
      switch (event.type) {
        case "payment_intent.created":
          const paymentIntentCreated = event.data.object;
          console.log("Payment Intent Created - Full Details:", {
            id: paymentIntentCreated.id,
            status: paymentIntentCreated.status,
            amount: paymentIntentCreated.amount,
            metadata: paymentIntentCreated.metadata,
            bookingId: paymentIntentCreated.metadata?.bookingId,
            created: new Date(paymentIntentCreated.created * 1000).toISOString(),
          });

          // Se não tiver bookingId nos metadados, é provavelmente um evento de teste
          if (!paymentIntentCreated.metadata?.bookingId) {
            console.log("Evento de teste recebido - ignorando");
            return res.json({ received: true });
          }

          try {
            // Apenas registrar o paymentIntentId no booking
            const booking = await Booking.findByIdAndUpdate(
              paymentIntentCreated.metadata.bookingId,
              { paymentIntentId: paymentIntentCreated.id },
              { new: true }
            );
            
            if (!booking) {
              console.error(
                "Booking não encontrado para o ID:",
                paymentIntentCreated.metadata.bookingId
              );
              // Não retornamos erro para o Stripe, apenas logamos
              return res.json({ received: true });
            }

            console.log("PaymentIntentId atualizado no booking:", booking._id);
          } catch (error) {
            console.error("Erro ao processar payment_intent.created:", error);
            // Não retornamos erro para o Stripe, apenas logamos
            return res.json({ received: true });
          }
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

          // Se não tiver bookingId nos metadados, é provavelmente um evento de teste
          if (!paymentIntent.metadata?.bookingId) {
            console.log("Evento de teste recebido para payment_intent.succeeded - ignorando");
            return res.json({ received: true });
          }

          try {
            console.log("Initiating payment confirmation handling...");
            // Handle payment confirmation through the service which will update status
            // and handle all necessary side effects (emails, QR codes, etc)
            await bookingController.handlePaymentConfirmation(paymentIntent.metadata.bookingId);
            console.log("Payment confirmation handled successfully");
          } catch (error) {
            console.error("Erro ao confirmar pagamento:", error.message);
            // Não retornamos erro para o Stripe, apenas logamos
            return res.json({ received: true });
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
