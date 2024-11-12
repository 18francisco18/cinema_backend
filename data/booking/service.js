const sessionModel = require("../sessions/sessions");
const ticketModel = require("../tickets/tickets");
const userModel = require("../users/user");
const mongoose = require("mongoose");
const financialReportController = require("../financialReports/controller");
const QRCode = require("qrcode");
const seatStatus = require("../sessions/seatStatus");
const sessionStatus = require("../sessions/sessionStatus");
const nodeMailer = require("nodemailer");
const dotenv = require("dotenv");
const Session = require("../sessions/sessions");
const Product = require("../products/product");
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
    findByIdAndUpdate,
    handlePaymentConfirmation,
    cancelReservation,
    refundPayment,
    refundTickets,
    findAllBookingsForSession,
  };

  async function create(booking, sessionId) {
    const session = await mongoose.startSession();
    session.startTransaction(); // Iniciar uma transação

    try {
      // Buscar a sessão associada à reserva com a transação.
      const sessionData = await sessionModel
        .findById(sessionId)
        .session(session);

      // Caso a sessão não exista, lançar um erro.
      if (!sessionData) {
        throw new Error("Session not found");
      }

      // Caso a sessão esteja cheia, lançar um erro.
      if (sessionData.status === sessionStatus.soldOut) {
        throw new Error("Session is already sold out");
      }

      // Caso a sessão esteja cancelada, lançar um erro.
      if (sessionData.status === sessionStatus.cancelled) {
        throw new Error("Session is cancelled");
      }

      // Caso a sessão esteja finalizada, lançar um erro.
      if (sessionData.status === sessionStatus.finished) {
        throw new Error("Session is finished");
      }

      // Caso a sessão esteja em andamento, lançar um erro.
      if (new Date(sessionData.endTime) < new Date()) {
        throw new Error("Cannot book a session in the past");
      }

      // Obter a lista de assentos da sessão especificada.
      const sessionSeats = sessionData.seats.flat();

      // Filtrar os assentos solicitados na reserva que não estão disponíveis.
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

      // Calcular o valor total da reserva multiplicando o número de assentos com o preço de cada bilhete da sessão.
      const totalAmount = booking.seats.length * sessionData.price;

      // Criar a nova reserva, inserindo os dados de booking e o valor total calculado.
      let newBooking = new bookingModel({
        ...booking,
        totalAmount,
        paymentStatus: "pending",
      });

      const savedBooking = await newBooking.save({ session }); // Salvar a reserva no banco de dados dentro da transação.

      // Atualizar o status dos assentos reservados para "reservado".
      sessionData.seats = sessionData.seats.map((row) =>
        row.map((seat) => {
          if (booking.seats.includes(seat.seat)) {
            return { ...seat, status: seatStatus.reserved };
          }
          return seat;
        })
      );

      // Verificar se ainda existem assentos disponíveis na sessão.
      const remainingAvailableSeats = sessionData.seats
        .flat()
        .some((seat) => seat.status === seatStatus.available);

      if (!remainingAvailableSeats) {
        sessionData.status = sessionStatus.soldOut; // Marcar a sessão como esgotada.
      }

      await sessionData.save({ session }); // Salvar a sessão com os assentos atualizados dentro da transação.

      console.log("Session updated with reserved seats");

      // Confirmar a transação.
      await session.commitTransaction(); // Confirmar a transação.
      session.endSession(); // Encerrar a sessão.~

      // Criar a sessão de pagamento no Stripe.
      const paymentConfirmation = await createPaymentSession(savedBooking);

      // Retornar a reserva.
      return { booking: savedBooking, paymentUrl: paymentConfirmation.url };
    } catch (error) {
      await session.abortTransaction(); // Cancelar a transação em caso de erro.
      session.endSession(); // Encerrar a sessão.
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

  // Função para eliminar reserva caso pagamento não seja feito dentro de 5 minutos
  async function checkingForPendingFiveMinutes(bookingId, paymentIntentId) {
    console.log("Scheduling booking deletion in 5 minutes");
    try {
      setTimeout(async () => {
        try {
          const booking = await bookingModel.findById(bookingId);
          if (!booking) {
            throw new Error("Booking not found");
          }

          // Verificar se o status do pagamento é "pending"
          if (booking.paymentStatus === "pending") {
            // Cancelar o PaymentIntent associado
            if (paymentIntentId) {
              await cancelPaymentIntent(paymentIntentId);
            }

            // Atualização do status dos assentos reservados
            const session = await sessionModel.findById(booking.session);
            // Atualizar o status dos assentos reservados para "available"
            session.seats = session.seats.map((row) =>
              row.map((seat) => {
                if (booking.seats.includes(seat.seat)) {
                  return { ...seat, status: "available" };
                }
                return seat;
              })
            );
            await session.save();

            // Remover a reserva do banco de dados
            await removeById(bookingId);
            console.log("Booking deleted and PaymentIntent canceled");
          }
        } catch (error) {
          console.error("Error deleting booking:", error);
        }
      }, 5 * 60 * 1000); // 5 minutos em milissegundos

      return { message: "Booking deletion scheduled in 5 minutes" };
    } catch (error) {
      console.error("Error scheduling booking deletion:", error);
      throw new Error("Error scheduling booking deletion");
    }
  }

  // Função que lida com o após o pagamento ser confirmado.
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

        // Recompensar o utilizador com pontos com base no valor do pagamento
        await userModel.findByIdAndUpdate(
          booking.user._id,
          { $inc: { points: paymentIntent.amount_received } } // Incrementa pontos ao utilizador
        );

        // Gerar o QR Code usando a função existente
        const tickets = await generateQRCode(booking);

        // Gerar a lista de QR codes e assentos para incluir no e-mail
        const qrCodeImages = tickets
          .map((ticket) => {
            return `
          <p><strong>Seat:</strong> ${ticket.ticket.seat}</p>
          <img src="${ticket.qrCode}" alt="QR Code for seat ${ticket.ticket.seat}" />
        `;
          })
          .join("");

        // Configurar as opções de e-mail para enviar o QR Code
        const mailOptions = {
          from: process.env.EMAIL_ADDRESS,
          to: booking.user.email,
          subject: "Your Movie Booking - QR Codes",
          text: `Your booking is confirmed for ${booking.seats.length} seat(s). Please find your QR Codes attached.`,
          html: `
          <p>Dear ${booking.user.name},</p>
          <p>Thank you for booking your tickets! Here are the details:</p>
          <ul>
            <li><strong>Booking ID:</strong> ${booking._id}</li>
            <li><strong>Seats:</strong> ${booking.seats.join(", ")}</li>
          </ul>
          <p>Please use the QR codes below for entry:</p>
          ${qrCodeImages}
          <p>Enjoy your movie!</p>
        `,
        };

        // Enviar o e-mail com o QR Code
        await transporter.sendMail(mailOptions);

        // Salvar a reserva atualizada com o status de pagamento
        await booking.save();

        // Formatar um relatório de pagamento interno
        const report = {
          paymentId: paymentIntent.id,
          customerName: booking.user.name,
          customerEmail: booking.user.email,
          amount: paymentIntent.amount_received / 100,
          currency: paymentIntent.currency,
          paymentMethod: paymentIntent.payment_method_types[0],
          created_at: new Date(paymentIntent.created * 1000),
        };

        // Criar um relatório de pagamento interno
        await financialReportController.createInternalPaymentReport(report);

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
        .populate("movie")
        .populate({
          path: "room",
          populate: {
            path: "cinema",
          },
        });
      if (!session) {
        throw new Error("Session not found");
      }

      if (!booking.user._id) {
        throw new Error("User not found");
      }

      const products = await Product.find({
        _id: { $in: booking.products.map((p) => p._id) },
      });
      const line_items = [];

      // Adicionar cada produto do booking ao line_items
      products.forEach((product) => {
        const matchingProducts = booking.products.filter((p) =>
          p._id.equals(product._id)
        );
        const quantity = matchingProducts.length;


        if (quantity > 0) {
          console.log(matchingProducts);
          console.log(product.discountedPrice);

          console.log(`Product ID: ${product._id}`);
          console.log(`Discounted Price: ${product.discountedPrice}`);
          console.log(`Discount Expiration: ${product.discountExpiration}`);
          console.log(`Current Date: ${new Date()}`);

          const isDiscountValid =
            product.discountedPrice && product.discountExpiration > new Date();
          const priceToCharge = isDiscountValid
            ? product.discountedPrice
            : product.price;
          console.log(`Is Discount Valid: ${isDiscountValid}`);
          console.log(`Price to charge: ${priceToCharge}`); // Adicione um log para verificar o preço

          // Adicionar o produto ao line_items com a quantidade correta
          line_items.push({
            price_data: {
              currency: "eur",
              product_data: {
                name: product.name,
                description: product.description,
                images: [product.image],
              },
              unit_amount: priceToCharge * 100, // O Stripe lida com valores em centavos
            },
            quantity: quantity, // Quantidade correta
          });
        }
      });

      // Adicionar o ingresso ao line_items
      line_items.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: `Movie Ticket for ${session.movie.title}`,
            description: `
                        Seats: ${booking.seats.join(", ")}
                        Room: ${session.room.name}
                        Cinema: ${session.room.cinema.name}
                    `,
            images: [session.movie.poster],
          },
          unit_amount: session.price * 100,
        },
        quantity: booking.seats.length,
      });

      // Criar a sessão de pagamento no Stripe
      const paymentSession = await stripe.checkout.sessions.create({
        payment_method_types: [
          "card", // Cartão de crédito/débito
          "multibanco", // Para Multibanco (Portugal)
        ],
        payment_intent_data: {
          metadata: {
            bookingId: booking._id.toString(),
            userId: booking.user._id.toString(),
            sessionId: booking.session._id.toString(),
            movieId: session.movie._id.toString(),
            roomId: session.room._id.toString(),
          },
        },
        success_url: "http://localhost:4000/success", // Redirecionamento após o sucesso
        cancel_url: "http://localhost:4000/cancel", // Redirecionamento após o cancelamento
        line_items: line_items,
        mode: "payment", // Modo de pagamento (apenas para pagamento completo)
      });

      // Agendar a verificação de pagamento após 5 minutos
      checkingForPendingFiveMinutes(booking._id, paymentSession.payment_intent);

      return { url: paymentSession.url };
    } catch (error) {
      console.error("Error creating payment session:", error);
      throw new Error("Failed to create payment session");
    }
  }

  // Função para gerar um QR Code a partir de uma reserva
  async function generateQRCode(booking) {
    try {
      // Buscar a reserva populada para obter os dados necessários
      const populatedBooking = await bookingModel
        .findById(booking._id)
        .populate({
          path: "session",
          populate: [
            { path: "movie", select: "title" },
            {
              path: "room",
              select: "name",
              populate: { path: "cinema", select: "name" },
            },
          ],
        });

      // Lista para armazenar os bilhetes gerados
      const tickets = [];
      const ticketIds = [];

      // Para cada assento reservado, criar um bilhete separado
      for (const seat of populatedBooking.seats) {
        const newTicket = await ticketModel.create({
          booking: populatedBooking._id, // ID da reserva
          seat: seat, // Assento associado ao bilhete
        });

        // Popula o ticket criado com a reserva completa para associar todos os dados
        const populatedTicket = await ticketModel
          .findById(newTicket._id)
          .populate({
            path: "booking",
            populate: [
              {
                path: "session",
                populate: [
                  { path: "movie", select: "title" },
                  {
                    path: "room",
                    select: "name",
                    populate: { path: "cinema", select: "name" },
                  },
                ],
                path: "products",
              },
            ],
          });

        // Dados que serão codificados no QR Code para cada bilhete
        const qrData = {
          ticketId: populatedTicket._id, // ID do bilhete único
          reservationNumber: populatedTicket.ticketNumber, // Número do bilhete
          userId: populatedBooking.user._id, // ID do usuário
          sessionId: populatedBooking.session._id, // ID da sessão
          movie: populatedBooking.session.movie.title, // Filme da sessão
          room: populatedBooking.session.room.name, // Nome da sala
          cinema: populatedBooking.session.room.cinema.name, // Nome do cinema
          seat: populatedTicket.seat, // Assento do bilhete
          products: [populatedBooking.products], // Produtos adicionais
          startTime: populatedBooking.session.startTime, // Hora de início da sessão
          totalAmount: populatedBooking.session.price, // Valor de cada bilhete
          printedTime: populatedTicket.issuedAt, // Hora de emissão do bilhete
        };

        console.log("Dados do QR Code:", qrData);

        // Gera o QR Code como uma string base64
        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

        // Adiciona o bilhete com o QR Code gerado na lista de tickets
        tickets.push({
          ticket: populatedTicket,
          qrCode: qrCode,
        });

        ticketIds.push(populatedTicket._id);
        booking.tickets = ticketIds;
      }

      // Retorna a lista de QR Codes gerados
      return tickets;
    } catch (error) {
      console.error("Erro ao gerar bilhetes e QR Codes:", error);
      throw new Error("Falha ao gerar bilhetes e QR Codes");
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
      const booking = await bookingModel.findById(id);
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

  async function findByIdAndUpdate(id) {
    try {
      const booking = await bookingModel.findByIdAndUpdate(id);
      if (!booking) {
        throw new Error("Booking not found");
      }
    } catch (error) {
      if (error.message === "Booking not found") {
        throw error;
      }
      throw new Error("Error updating booking");
    }
  }

  // Encontra todas as reservas com paginação
  async function findAll(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const bookings = await bookingModel.find().skip(skip).limit(limit);
      const total = await bookingModel.countDocuments();

      return {
        bookings,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    } catch (err) {
      throw new Error("Error fetching bookings");
    }
  }

  // Encontra todas as reservas para uma sessão
  async function findAllBookingsForSession(sessionId, page = 1, limit = 10) {
    try {
      const session = await Session.findById(sessionId);

      if (!session) {
        throw new Error("Session not found");
      }

      const skip = (page - 1) * limit;
      const total = await bookingModel.countDocuments();
      const booking = await bookingModel
        .find({ session: sessionId })
        .skip(skip)
        .limit(limit);
      if (!booking) {
        throw new Error("Booking not found");
      }

      return {
        booking,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error("Error");
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

  // Função para cancelar uma reserva
  // Necessário verificar utilizador.
  async function cancelReservation(bookingId) {
    try {
      // Buscar a reserva com o ID fornecido
      const booking = await bookingModel
        .findById(bookingId)
        .populate("session");

      if (!booking) {
        throw new Error("Booking not found");
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(
        booking.paymentIntentId
      );
      console.log("PaymentIntent:", paymentIntent);

      if (!paymentIntent) {
        throw new Error("Payment Intent não encontrado");
      }

      // Verificar se a reserva já foi cancelada
      if (booking.status === "cancelled") {
        throw new Error("Booking is already cancelled");
      }

      if (booking.status === "completed") {
        throw new Error("Booking completed");
      }

      if (booking.paymentStatus === "refunded") {
        throw new Error("Booking refunded");
      }

      if (booking.paymentStatus === "pending") {
        throw new Error("Cannot refund when payment didnt go through");
      }

      if (booking.paymentStatus === "cancelled") {
        throw new Error("Unnable to refund");
      }

      const currentTime = Date.now();
      const sessionStartTime = new Date(booking.session.startTime).getTime();
      const twoHoursInMillis = 2 * 60 * 60 * 1000;
      const thirtyMinutesInMillis = 30 * 60 * 1000;

      // Obter o ID da transação de saldo associada ao pagamento e obter o valor líquido
      // para calcular o reembolso.
      const chargeId = paymentIntent.latest_charge;
      const charge = await stripe.charges.retrieve(chargeId);
      console.log("Charge:", charge);
      const balanceTransactionId = charge.balance_transaction;
      const balanceTransaction = await stripe.balanceTransactions.retrieve(
        balanceTransactionId
      );

      // Obter o valor líquido da transação para calcular o reembolso
      const netAmount = balanceTransaction.net;

      // Verificar se a reserva foi feita há mais de 2 horas
      if (sessionStartTime - currentTime > twoHoursInMillis) {
        try {
          console.log(
            "Reembolsando pagamento completo:",
            booking.paymentIntentId,
            netAmount
          );
          await refundPayment(booking.paymentIntentId, netAmount);
        } catch (error) {
          console.error("Erro ao reembolsar pagamento:", error);
          throw new Error("Erro ao reembolsar pagamento");
        }
      } else if (
        // Verificar se a reserva foi feita há menos de 2 horas e mais de 30 minutos
        sessionStartTime - currentTime <=
        twoHoursInMillis >
        thirtyMinutesInMillis
      ) {
        try {
          await refundPayment(booking.paymentIntentId, netAmount / 2);
        } catch (error) {
          console.error("Erro ao reembolsar pagamento:", error);
          throw new Error("Erro ao reembolsar pagamento");
        }
        // Se o pedido de reembolso for feito após 30 minutos antes do início da sessão,
        // não é possível reembolsar o pagamento.
      } else {
        throw new Error("Não é possível reembolsar a reserva");
      }

      // Atualizar o status da reserva para "cancelado" e o status do pagamento para "reembolsado"
      const bookingUpdate = await bookingModel.findByIdAndUpdate(
        bookingId,
        { status: "cancelled" },
        { paymentStatus: "refunded" },
        { new: true }
      );

      // Atualizar o status dos assentos reservados para "disponível"
      booking.session.seats = booking.session.seats.map((row) =>
        row.map((seat) => {
          if (booking.seats.includes(seat.seat)) {
            return { ...seat, status: "available" };
          }
          return seat;
        })
      );

      await booking.session.save(); // Salvar a sessão com os assentos atualizados

      return bookingUpdate;
    } catch (error) {
      console.log(error);
      throw new Error("Error cancelling reservation");
    }
  }

  // Função para reembolsar um ou mais bilhetes individuais de um booking
  async function refundTickets(bookingId, ticketIds) {
    try {
      const [booking, ticketsToRefund] = await Promise.all([
        bookingModel.findById(bookingId),
        ticketModel.find({
          _id: { $in: ticketIds },
          booking: bookingId,
          status: { $nin: ["refunded", "cancelled", "used"] },
        }),
      ]);

      if (!booking) throw new Error("Booking not found");
      if (booking.paymentStatus !== "paid") {
        throw new Error("Booking not eligible for partial refunds");
      }

      if (ticketsToRefund.length === 0) {
        throw new Error("No tickets found for refund or already refunded");
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(
        booking.paymentIntentId
      );

      // Obter o ID da transação de saldo associada ao pagamento e obter o valor líquido
      const chargeId = paymentIntent.latest_charge;
      const charge = await stripe.charges.retrieve(chargeId);
      console.log("Charge:", charge);
      const balanceTransactionId = charge.balance_transaction;
      const balanceTransaction = await stripe.balanceTransactions.retrieve(
        balanceTransactionId
      );

      // Obter o valor líquido da transação para calcular o reembolso
      const netAmount = balanceTransaction.net;

      // Calcular o valor total do reembolso para os bilhetes elegíveis
      const refundAmount =
        (netAmount / booking.seats.length) * ticketsToRefund.length;

      // Processar o reembolso total via Stripe
      await refundPayment(booking.paymentIntentId, refundAmount);

      // Atualizar o status dos bilhetes de forma otimizada com um único comando
      const ticketUpdates = ticketsToRefund.map((ticket) => ({
        updateOne: {
          filter: { _id: ticket._id },
          update: { status: "refunded", refundedAt: new Date() },
        },
      }));

      // Experimentação com bulkWrite, usado para atualizar vários documentos de uma só vez
      await ticketModel.bulkWrite(ticketUpdates);

      // Libertar os assentos reservados na sessão
      const seatNumbers = ticketsToRefund.map((ticket) => ticket.seat);
      console.log(seatNumbers);
      booking.session.seats = booking.session.seats.map((row) =>
        row.map((seat) => {
          if (seatNumbers.includes(seat.seat)) {
            return { ...seat, status: "available" };
          }
          return seat;
        })
      );

      await booking.session.save(); // Salvar a sessão com os assentos atualizados

      // Verificar se todos os bilhetes do booking estão reembolsados
      const allTicketsRefunded =
        (await ticketModel.countDocuments({
          booking: bookingId,
          status: { $ne: "refunded" },
        })) === 0;

      // Se sim, atualizar o status do booking para "cancelado" e "refunded".
      if (allTicketsRefunded) {
        booking.status = "cancelled";
        booking.paymentStatus = "refunded";
        await booking.save();
      }

      console.log(`Tickets refunded successfully: ${ticketIds}`);
      return {
        message: "Tickets refunded successfully",
        refundedTickets: ticketIds,
      };
    } catch (error) {
      console.error("Error refunding tickets:", error);
      throw new Error("Failed to refund tickets");
    }
  }

  // Função para reembolsar um pagamento por stripe
  async function refundPayment(paymentIntentId, amount = null) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId, // ID do PaymentIntent
        amount: amount, // Valor a ser reembolsado (em centavos)
      });

      /*const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const booking = await bookingModel.findById(paymentIntent.metadata.bookingId).populate("user");
      await userModel.findByIdAndUpdate(booking.user._id, {
        $inc: { points: -paymentIntent.amount }, // Decrementar pontos do utilizador

      }) */

      console.log("Reembolso criado:", refund);
      return refund;
    } catch (error) {
      console.error("Erro ao criar reembolso:", error);
      throw error;
    }
  }

  // Função para cancelar um PaymentIntent
  async function cancelPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
      console.log("PaymentIntent canceled:", paymentIntent.id);
      return { message: "PaymentIntent canceled" };
    } catch (error) {
      console.error("Error canceling PaymentIntent:", error);
      throw new Error("Error canceling PaymentIntent");
    }
  }

  return service;
}

module.exports = bookingService;
