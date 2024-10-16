const sessionModel = require("../sessions/sessions");
const RoomModel = require("../rooms/rooms");
const bookingModel = require("./booking");
const userModel = require("../users/user");
const QRCode = require("qrcode");
const seatStatus = require("../sessions/seatStatus");
const sessionStatus = require("../sessions/sessionStatus");
const nodeMailer = require("nodemailer");
const dotenv = require("dotenv");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

dotenv.config();

const transporter = nodeMailer.createTransport({
  service: "outlook",
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

function bookingService(bookingModel) {
  let service = {
    create,
    findById,
    findAll,
    removeById,
    updateById,
    handlePaymentConfirmation,
  };

  async function create(booking, sessionId) {
    try {
      // Buscar a sessão associada à reserva.
      const session = await sessionModel.findById(sessionId);

      // Caso a sessão não exista, lançar um erro.
      if (!session) {
        throw new Error("Session not found");
      }

      // Caso a sessão esteja cheia, lançar um erro.
      if (session.status === sessionStatus.soldOut) {
        throw new Error("Session is already sold out");
      }

      // Caso a sessão esteja cancelada, lançar um erro.
      if (session.status === sessionStatus.cancelled) {
        throw new Error("Session is cancelled");
      }

      // Caso a sessão esteja finalizada, lançar um erro.
      if (session.status === sessionStatus.finished) {
        throw new Error("Session is finished");
      }

      // Caso a sessão esteja em andamento, lançar um erro.
      if (new Date(session.endTime) < new Date()) {
        throw new Error("Cannot book a session in the past");
      }

      // Obter a lista de assentos da sessão especificada.
      // Junta todas as fileiras de assentos em uma única lista.
      const sessionSeats = session.seats.flat();

      // Filtrar os assentos solicitados na reserva que não estão disponíveis.
      // O invalidSeats vai filtrar na array de assentos do booking um a um, e verificar
      // se o assento existe na sessão. No fim, irá retornar os assentos que não existem
      // ou que não estão disponíveis.
      const invalidSeats = booking.seats.filter((seat) => {
        const sessionSeat = sessionSeats.find((s) => s.seat === seat);
        return !sessionSeat || sessionSeat.status !== seatStatus.available;
      });

      // Se existirem assentos inválidos, lançar um erro.
      if (invalidSeats.length > 0) {
        throw new Error(
          `The following seats are invalid or unavailable: ${invalidSeats.join(
            ", "
          )}`
        );
      }

      // Calcular o valor total da reserva multiplicando o número de assentos com
      // o preço de cada bilhete da sessão.
      const totalAmount = booking.seats.length * session.price;

      // Criar a nova reserva, inserindo os dados de booking e reescreve o totalAmount
      // de forma a inserir o valor total da reserva que foi calculado em cima.
      let newBooking = new bookingModel({
        ...booking,
        totalAmount,
        paymentStatus: "pending",
      });

      const savedBooking = await save(newBooking); // Salvar a reserva no banco de dados.

      // Atualizar o status dos assentos reservados para "reservado".
      // Ao buscar os assentos da sessão, é feito um mapeamento para verificar dentro de cada
      // array de assentos, se o assento está presente na reserva.
      // Caso esteja, o status do assento é atualizado para "reservado".
      session.seats = session.seats.map((row) =>
        row.map((seat) => {
          if (booking.seats.includes(seat.seat)) {
            return { ...seat, status: seatStatus.reserved };
          }
          return seat;
        })
      );

      // Verificar se ainda existem assentos disponíveis na sessão
      // juntando as arrays de assentos da sessão em uma só array.
      // Utilizando o método some, é possível verificar se existe pelo menos um assento
      // disponível na sessão. Caso seja falso, a sessão é marcada como esgotada.
      const remainingAvailableSeats = session.seats
        .flat()
        .some((seat) => seat.status === seatStatus.available);

      if (!remainingAvailableSeats) {
        session.status = sessionStatus.soldOut; // Marcar a sessão como esgotada
      }

      await session.save(); // Salvar a sessão com os assentos atualizados.

      console.log("Session updated with reserved seats");

      const paymentConfirmation = await createPaymentSession(savedBooking); // Criar a sessão de pagamento no Stripe.

      // Retornar a reserva.
      return { booking: savedBooking, paymentUrl: paymentConfirmation.url };
    } catch (error) {
      console.log(error);

      if (error.message === "Session not found") {
        throw new Error("Session not found");
      }

      if (error.message === "Session is already sold out") {
        throw new Error("Session is already sold out");
      }

      if (error.message === "Session is cancelled") {
        throw new Error("Session is cancelled");
      }

      if (error.message === "Session is finished") {
        throw new Error("Session is finished");
      }

      if (error.message === "Cannot book a session in the past") {
        throw new Error("Cannot book a session in the past");
      }

      if (
        error.message.includes("The following seats are invalid or unavailable")
      ) {
        throw new Error(error.message);
      }

      throw new Error("Check for missing fields or wrong fields");
    }
  }

  async function handlePaymentConfirmation(paymentIntentId) {
    try {
      // Buscar a sessão de pagamento no Stripe usando o sessionId
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId.id
      );
      if (!paymentIntent) {
        throw new Error("Payment Intent não encontrado");
      }

      // Verificar se o pagamento foi realizado com sucesso
      // Verificar se o pagamento foi realizado com sucesso
      if (paymentIntent.status === "succeeded") {
        const bookingId = paymentIntent.metadata
          ? paymentIntent.metadata.bookingId
          : null;
        if (!bookingId) {
          console.log("Booking ID não encontrado nos metadados");
        }

        // Buscar a reserva com o ID fornecido
        const booking = await bookingModel.findById(bookingId).populate("user");
        if (!booking) {
          throw new Error("Booking not found");
        }

        // Atualizar o status de pagamento para "paid"
        booking.paymentStatus = "paid";

        // Gerar o QR Code usando a função existente
        const qrCode = await generateQRCode(booking);

        // Configurar as opções de e-mail para enviar o QR Code
        const mailOptions = {
          from: process.env.EMAIL_ADDRESS,
          to: booking.user.email,
          subject: "Your Movie Booking - QR Code",
          text: `Your booking is confirmed for ${booking.seats.length} seat(s). Please find your QR Code attached.`,
          html: `
          <p>Dear ${booking.user.name},</p>
          <p>Thank you for booking your tickets! Here are the details:</p>
          <ul>
            <li><strong>Booking ID:</strong> ${booking._id}</li>
            <li><strong>Seats:</strong> ${booking.seats.join(", ")}</li>
          </ul>
          <p>Please use the QR code below for entry:</p>
          <img src="${qrCode}" alt="QR Code" />
          <p>Enjoy your movie!</p>
        `,
        };

        // Enviar o e-mail com o QR Code
        await transporter.sendMail(mailOptions);

        // Salvar a reserva atualizada com o status de pagamento
        await booking.save();

        return { message: "Payment confirmed, QR Code sent", booking };
      } else {
        throw new Error("Payment not confirmed");
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      throw new Error("Error during payment confirmation");
    }
  }

  // Função para criar o pagamento de uma reserva
  async function createPaymentSession(booking) {
    console.log("Creating payment session for booking");
    try {
      console.log("Booking:", booking);
      // Buscar a sessão associada à reserva para obter detalhes como preço.
      const session = await sessionModel
        .findById(booking.session)
        .populate("movie");
      if (!session) {
        throw new Error("Session not found");
      }

      // Criar uma sessão de pagamento no Stripe
      const paymentSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"], // Para aceitar cartões de crédito/débito
        line_items: [
          {
            price_data: {
              currency: "eur", // Substitua pela moeda desejada (ex: eur, brl)
              product_data: {
                name: `Movie Ticket for ${session.movie.title}`,
                description: `Seats: ${booking.seats.join(", ")}`,
              },
              unit_amount: session.price * 100, // O Stripe lida com valores em centavos
            },
            quantity: booking.seats.length,
          },
        ],
        mode: "payment",
        success_url: "http://localhost:4000/success", // Redirecionamento após o sucesso
        cancel_url: "http://localhost:4000/cancel",
        metadata: {
          bookingId: booking._id.toString(), // Certifique-se de que o bookingId é uma string
          userId: booking.user._id.toString(), // Certifique-se de que o userId é uma string
          sessionId: booking.session._id.toString(), // Certifique-se de que o sessionId é uma string
          movieId: booking.movie._id.toString(), // Certifique-se de que o movieId é uma string
          roomId: booking.room._id.toString(), // Certifique-se de que o roomId é uma string
        },
      });

      const retrievedSession = await stripe.checkout.sessions.retrieve(
        paymentSession.id
      );
      console.log("Checkout Session Metadata:", retrievedSession.metadata);
      console.log("Payment session created:", paymentSession.id);
      return { url: paymentSession.url };
    } catch (error) {
      console.error("Error creating payment session:", error);
      throw new Error("Failed to create payment session");
    }
  }

  // Função para gerar um QR Code a partir de uma reserva
  async function generateQRCode(booking) {
    try {
      const populatedBooking = await bookingModel
        .findById(booking._id)
        .populate({
          path: "session",
          populate: [
            { path: "movie", select: "title" }, // Popula o nome do filme
            {
              path: "room",
              select: "name",
              populate: { path: "cinema", select: "name" },
            }, // Popula o nome da sala e do cinema
          ],
        })
        .exec();

      // Dados que serão codificados no QR Code
      const qrData = {
        reservationId: populatedBooking._id,
        userId: populatedBooking.user._id,
        sessionId: populatedBooking.session._id,
        movie: populatedBooking.session.movie._id,
        room: populatedBooking.session.room._id,
        cinema: populatedBooking.session.room.cinema._id,
        seats: populatedBooking.seats,
        startTime: populatedBooking.session.startTime,
        totalAmount: populatedBooking.totalAmount,
        printedTime: populatedBooking.date,
        qrStatus: populatedBooking.status,
      };

      console.log("Dados do QR Code:", qrData);

      // Gera o QR Code como uma string base64
      const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

      return qrCode; // Retorna o QR Code gerado (em formato base64)
    } catch (error) {
      console.error("Erro ao gerar QR Code:", error);
      throw new Error("Falha ao gerar o QR Code");
    }
  }

  // Salva um modelo
  async function save(model) {
    return new Promise(function (resolve, reject) {
      model
        .save()
        .then(() => resolve(model))
        .catch((err) =>
          reject(`There was a problem creating the booking ${err}`)
        );
    });
  }

  async function findById(id) {
    try {
      const booking = await bookingModel
        .findById(id)
        .populate("user")
        .populate("room")
        .populate("session");
      if (!booking) {
        throw new Error("Booking not found");
      }
      return booking;
    } catch (err) {
      if (err.message === "Booking not found") {
        throw err;
      }
      throw new Error("Error fetching booking");
    }
  }

  // Encontra todas as reservas
  async function findAll() {
    try {
      const bookings = await bookingModel.find();
      return bookings;
    } catch (err) {
      throw new Error("Error fetching bookings");
    }
  }

  // Remove uma reserva por id
  async function removeById(id) {
    try {
      const booking = await bookingModel.findByIdAndDelete(id);
      if (!booking) {
        throw new Error("Booking not found");
      }
      return booking;
    } catch (err) {
      if (err.message === "Booking not found") {
        throw err;
      }
      throw new Error("Error removing booking");
    }
  }

  // Atualiza uma reserva por id
  async function updateById(id, booking) {
    try {
      const bookingUpdate = await bookingModel.findByIdAndUpdate(id, booking, {
        new: true,
      });
      if (!bookingUpdate) {
        throw new Error("Booking not found");
      }
    } catch (error) {
      if (error.message === "Booking not found") {
        throw error;
      }
      throw new Error("Error updating booking");
    }
  }

  return service;
}

module.exports = bookingService;
