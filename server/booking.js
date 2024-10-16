const bodyParser = require("body-parser");
const express = require("express");
const bookingController = require("../data/booking/controller");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

function BookingRouter() {
  let router = express();

  // Rota do webhook do Stripe, com o middleware específico primeiro
  router.post(
    "/webhook",
    bodyParser.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      let event;

      try {
        // Verificar a assinatura e decodificar o evento enviado pelo Stripe
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.error("Erro ao verificar assinatura do webhook:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Manipular o evento de acordo com o tipo
      switch (event.type) {
        case "checkout.session.completed":
          const session = event.data.object;

          // Atualizar o paymentIntent com os metadados do checkout.session
          await stripe.paymentIntents.update(session.payment_intent, {
            metadata: {
              bookingId: session.metadata.bookingId,
              userId: session.metadata.userId,
              sessionId: session.metadata.sessionId,
              movieId: session.metadata.movieId,
              roomId: session.metadata.roomId,
            },
          });

          console.log("Metadados atualizados para o Payment Intent:", session.payment_intent);
          break;

        case "payment_intent.succeeded":
          const paymentIntent = event.data.object;
          console.log("Pagamento confirmado para:", paymentIntent.id);
          await bookingController.handlePaymentConfirmation(paymentIntent);
          break;
          
        default:
          console.warn(`Evento não tratado: ${event.type}`);
      }

      // Retornar uma resposta para confirmar o recebimento do evento
      res.json({ received: true });
    }
  );

  // Outros middlewares gerais para as demais rotas
  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  // Outras rotas normais
  router.post("/:id/create", bookingController.createBooking);
  router.get("/find/:id", bookingController.getBookingById);
  router.get("/findAll", bookingController.getAllBookings);
  router.delete("/remove/:id", bookingController.removeBookingById);
  router.put("/update/:id", bookingController.updateBookingById);

  return router;
}

module.exports = BookingRouter;