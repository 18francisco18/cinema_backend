const sessionModel = require("../sessions/sessions");
const ticketModel = require("../tickets/tickets");
const userModel = require("../users/user");
const Discount = require("../discounts/discounts");
const mongoose = require("mongoose");
const financialReportController = require("../financialReports/controller");
const QRCode = require("qrcode");
const seatStatus = require("../sessions/seatStatus");
const sessionStatus = require("../sessions/sessionStatus");
const dotenv = require("dotenv");
const Session = require("../sessions/sessions");
const Product = require("../products/product");
const promocodeService = require("../discounts/promocodes/index");
const QRCodeSchema = require("./qrcode");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const Promocode = require("../discounts/promocodes/promocodes");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ServiceUnavailableError,
  PaymentRequiredError,
} = require("../../AppError");
const fs = require('fs').promises;

dotenv.config();

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
    validateQRCode,
  };

  // Função para redimir produtos com pontos
  async function redeemItemsWithPoints(userId, products, session) {
    const user = await userModel.findById(userId).session(session);
    if (!user) throw new NotFoundError("User not found");

    // Array para armazenar os produtos redimidos
    const redeemedProducts = [];

    // Iterar sobre cada produto no array
    if (products) {
      for (const item of products) {
        // Verificar se o produto foi redimido com pontos
        if (item.redeemedWithPoints) {
          const product = await Product.findById(item.product)
            .populate("pointsRef")
            .session(session);

          if (!product)
            throw new NotFoundError(`Product not found: ${item.product}`);

          // Verificar se o produto tem um preço em pontos
          const pointsCost = product.pointsRef?.points || 0;

          // Verificar pontos suficientes
          const totalPointsRequired = pointsCost * (item.quantity || 1);
          if (user.points < totalPointsRequired) {
            throw new ValidationError(
              `Insufficient points for product: ${product.name}`
            );
          }

          // Deduzir pontos
          user.points -= totalPointsRequired;

          // Adicionar o produto redimido ao array
          redeemedProducts.push({
            product: product._id,
            quantity: item.quantity || 1,
            redeemedWithPoints: true,
          });
        } else {
          // Adicionar o produto ao array sem redimir pontos
          redeemedProducts.push({
            product: item.product,
            quantity: item.quantity || 1,
            redeemedWithPoints: false,
          });
        }
      }
    }
    

    await user.save({ session });
    return redeemedProducts;
  }

  async function create(booking, sessionId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Redimir produtos com pontos
      booking.products = await redeemItemsWithPoints(
        booking.user,
        booking.products,
        session
      );

      // Buscar a sessão associada
      const sessionData = await sessionModel
        .findById(sessionId)
        .session(session);
      if (!sessionData) throw new NotFoundError("Session not found");

      // Verificar o status da sessão
      if (
        sessionData.status !== sessionStatus.available &&
        new Date(sessionData.endTime) < new Date()
      ) {
        throw new ValidationError(
          "Cannot book a session with invalid status or in the past"
        );
      }

      // Verificar assentos
      const invalidSeats = booking.seats.filter((seat) => {
        // Verificar se o assento está disponível
        const sessionSeat = sessionData.seats
          .flat()
          .find((s) => s.seat === seat);
        return !sessionSeat || sessionSeat.status !== seatStatus.available;
      });

      // Se o assento não estiver disponível ou não existir, lançar um erro
      if (invalidSeats.length > 0) {
        throw new ValidationError(
          `Invalid or unavailable seats: ${invalidSeats.join(", ")}`
        );
      }

      // Calcular o total
      let totalAmount = booking.seats.length * sessionData.price;

      // Adicionar o preço de cada produto ao total, se houver produtos
      if (booking.products && booking.products.length > 0) {
        for (const item of booking.products) {
          if (!item.redeemedWithPoints) {
            const product = await Product.findById(item.product).session(
              session
            );

            if (!product) {
              throw new NotFoundError("Produto não encontrado");
            }

            // Verificar se o produto tem descontos aplicados
            let productPrice = product.price;
            if (product.discountRef && product.discountRef.length > 0) {
              for (const discountId of product.discountRef) {
                const discount = await Discount.findById(discountId);

                if (discount && discount.active) {
                  if (discount.percentOff) {
                    productPrice -= Math.round(
                      (productPrice * discount.percentOff) / 100
                    ).toFixed(2);
                  } else if (discount.fixedAmountOff) {
                    productPrice -= discount.fixedAmountOff;
                  }
                }
              }
            }

            // Adiciona o preço do produto (com desconto, se aplicável) multiplicado pela quantidade ao total
            totalAmount += productPrice * (item.quantity || 1);
            console.log(
              "Total amount after product:",
              totalAmount,
              productPrice
            );
          }
        }
      }

      console.log("Total amount:", totalAmount);

      // Aplicar o promocode, se fornecido
      if (booking.promocode && booking.promocode.length > 0 && booking.promocode[0] !== '') {
        totalAmount = await promocodeService.applyPromocode(
          booking,
          totalAmount
        );
      }

      console.log("Total amount after promocode:", totalAmount);

      // Criar a reserva
      const newBooking = new bookingModel({
        ...booking,
        totalAmount,
        paymentStatus: "pending",
      });

      // Salvar a reserva
      const savedBooking = await newBooking.save({ session });

      // Criar tickets para cada assento
      const tickets = await Promise.all(
        booking.seats.map(async (seat) => {
          const ticketData = {
            booking: savedBooking._id,
            seat: seat,
            status: "booked",
          };
          const ticket = await ticketModel.create(ticketData);
          return ticket._id;
        })
      );

      // Adicionar os tickets à reserva
      savedBooking.tickets = tickets;
      await savedBooking.save({ session });

      // Atualizar assentos
      sessionData.seats = sessionData.seats.map((row) =>
        row.map((seat) => {
          if (booking.seats.includes(seat.seat)) {
            return { ...seat, status: seatStatus.reserved };
          }
          return seat;
        })
      );

      // Verificar se existem assentos disponíveis restantes
      const remainingAvailableSeats = sessionData.seats
        .flat()
        .some((seat) => seat.status === seatStatus.available);
      if (!remainingAvailableSeats) sessionData.status = sessionStatus.soldOut;

      // Salvar a sessão atualizada
      await sessionData.save({ session });

      // Terminar a transação
      await session.commitTransaction();
      session.endSession();

      // Criar sessão de pagamento no Stripe
      const paymentConfirmation = await createPaymentSession(savedBooking);

      return { booking: savedBooking, paymentUrl: paymentConfirmation.url };
    } catch (error) {
      // Cancelar a transação em caso de erro
      await session.abortTransaction();
      session.endSession();
      console.error("Erro ao criar reserva:", error);
      throw error;
    }
  }

  // Função para verificar se o pagamento está pendente após 5 minutos
  async function checkingForPendingFiveMinutes(bookingId, paymentIntentId) {
    console.log(
      `[Cleanup] Scheduling cleanup for booking ${bookingId} in 5 minutes`
    );
    try {
      setTimeout(async () => {
        try {
          console.log(
            `[Cleanup] Checking booking ${bookingId} after 5 minutes`
          );
          const booking = await bookingModel
            .findById(bookingId)
            .populate("products.product");
          if (!booking) {
            console.log(`[Cleanup] Booking ${bookingId} not found`);
            return;
          }

          console.log(
            `[Cleanup] Current booking status: ${booking.paymentStatus}`
          );
          // Verificar se o status do pagamento é "pending"
          if (booking.paymentStatus === "pending") {
            console.log(
              `[Cleanup] Booking ${bookingId} is still pending after 5 minutes, initiating cleanup`
            );
            // Cancelar o PaymentIntent associado
            if (paymentIntentId) {
              await cancelPaymentIntent(paymentIntentId);
            }

            // Devolver os pontos ao usuário
            if (booking.products) {
              const user = await userModel.findById(booking.user);
              if (!user) {
                throw new NotFoundError("User not found");
              }

              // Verificar cada produto do booking
              booking.products.forEach((item) => {
                if (item.redeemedWithPoints) {
                  // Verificar quantos pontos o produto custou
                  const pointsCost = item.product.pointsRef?.points || 0;
                  user.points += pointsCost * item.quantity;
                }
              });

              // Salvar os pontos atualizados do usuário
              await user.save();
              console.log(`[Cleanup] Points refunded to user`);
            }

            // Atualização do status dos assentos reservados
            const session = await sessionModel.findById(booking.session);
            if (session) {
              session.seats = session.seats.map((row) =>
                row.map((seat) => {
                  if (booking.seats.includes(seat.seat)) {
                    return { ...seat, status: "available" };
                  }
                  return seat;
                })
              );
              await session.save();
              console.log(`[Cleanup] Seats status updated to available`);
            }

            // Remover a reserva do banco de dados
            await removeById(bookingId);
            console.log(
              `[Cleanup] Booking ${bookingId} deleted and PaymentIntent canceled`
            );
          }
        } catch (error) {
          console.error(
            `[Cleanup] Error deleting booking ${bookingId}:`,
            error
          );
        }
      }, 5 * 60 * 1000); // 5 minutos em milissegundos

      return { message: "Booking deletion scheduled in 5 minutes" };
    } catch (error) {
      console.error(
        `[Cleanup] Error scheduling booking deletion ${bookingId}:`,
        error
      );
      throw error;
    }
  }

  // Função que lida com o após o pagamento ser confirmado.
  async function handlePaymentConfirmation(bookingId) {
    try {
      console.log("Starting payment confirmation process...");
      console.log("BookingId received:", bookingId);

      // Buscar a reserva com o ID fornecido
      console.log("Finding booking in database...");
      const booking = await bookingModel
        .findById(bookingId)
        .populate("user")
        .populate({
          path: "session",
          populate: {
            path: "movie",
            select: "title",
          },
        })
        .select("+paymentIntentId"); // Garantir que o paymentIntentId seja incluído

      if (!booking) {
        console.error("Booking not found for ID:", bookingId);
        throw new NotFoundError("Booking not found");
      }
      console.log("Current booking status:", booking.paymentStatus);

      // Atualizar o status de pagamento para "paid"
      booking.paymentStatus = "paid";
      await booking.save();
      console.log("Updated booking status to:", booking.paymentStatus);

      // Recompensar o utilizador com pontos com base no valor total da reserva
      await userModel.findByIdAndUpdate(booking.user._id, {
        $inc: { points: Math.floor(booking.totalAmount) },
      });

      // Gerar o QR Code usando a função existente
      const qrCode = await generateQRCode(booking);

      // Aguardar um momento para garantir que o webhook do Stripe atualizou o paymentIntentId
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Buscar a reserva atualizada com o paymentIntentId
      const updatedBooking = await bookingModel
        .findById(bookingId)
        .populate("user")
        .select("+paymentIntentId");

      // Criar um relatório de pagamento interno (sem enviar por email)
      try {
        await financialReportController.createInternalPaymentReport({
          paymentId: booking.paymentIntentId || updatedBooking.paymentIntentId,
          customerName: booking.user.name,
          customerEmail: booking.user.email,
          amount: booking.totalAmount,
          currency: "eur",
          paymentMethod: "card",
          created_at: new Date(),
        });
      } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        // Não vamos falhar a transação se o relatório falhar
      }

      // Enviar email com o QR Code
      try {
        const {
          sendBookingConfirmationEmail,
        } = require("../../services/emailService");
        await sendBookingConfirmationEmail(booking, qrCode);
        console.log("Email de confirmação enviado com sucesso");
      } catch (emailError) {
        console.error("Erro ao enviar email de confirmação:", emailError);
        // Não vamos falhar a transação se o email falhar
        // O usuário ainda pode ver o QR code na área do cliente
      }

      return booking;
    } catch (error) {
      console.error("Erro em handlePaymentConfirmation:", error);
      throw error;
    }
  }

  // Função para criar o pagamento de uma reserva
  async function createPaymentSession(booking) {
    console.log("Creating payment session for booking");

    try {
      console.log("Booking:", booking);

      // Validar entrada
      if (
        !booking ||
        !booking.user?._id ||
        !booking.session ||
        !booking.products
      ) {
        throw new ValidationError("Invalid booking data");
      }

      // Buscar a sessão associada à reserva com detalhes populados
      const session = await sessionModel
        .findById(booking.session)
        .populate("movie")
        .populate({
          path: "room",
          populate: {
            path: "cinema",
          },
        });

      if (!session) throw new NotFoundError("Session not found");

      // Buscar todos os produtos e descontos de uma vez para otimizar
      const productIds = booking.products.map((item) => item.product._id);
      const products = await Product.find({ _id: { $in: productIds } });
      const discountIds = products.flatMap(
        (product) => product.discountRef || []
      );
      const discounts = await Discount.find({ _id: { $in: discountIds } });

      // Mapear produtos e descontos para acesso rápido
      const productMap = new Map(
        products.map((product) => [product._id.toString(), product])
      );
      const discountMap = new Map(
        discounts.map((discount) => [discount._id.toString(), discount])
      );

      // Construir line_items
      const line_items = booking.products.map((item) => {
        const product = productMap.get(item.product._id.toString());
        if (!product)
          throw new NotFoundError(`Product not found: ${item.product._id}`);

        let productPrice = product.price;

        // Aplicar descontos válidos
        if (product.discountRef && product.discountRef.length > 0) {
          product.discountRef.forEach((discountId) => {
            const discount = discountMap.get(discountId.toString());
            if (
              discount &&
              discount.active &&
              discount.startDate <= new Date() &&
              (!discount.endDate || discount.endDate > new Date())
            ) {
              if (discount.percentOff) {
                productPrice -= Math.round(
                  (productPrice * discount.percentOff) / 100
                );
              } else if (discount.fixedAmountOff) {
                productPrice -= discount.fixedAmountOff;
              }
            }
          });
        }

        // Definir preço final (0 se redimido com pontos)
        const priceToCharge = item.redeemedWithPoints ? 0 : productPrice;

        return {
          price_data: {
            currency: "eur",
            product_data: {
              name: product.name,
              description: product.description,
              images: [product.image],
            },
            unit_amount: priceToCharge * 100, // Stripe lida com centavos
          },
          quantity: item.quantity,
        };
      });

      // Adicionar ingresso ao line_items
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

      // Calcular total inicial
      let totalAmount = line_items.reduce(
        (total, item) => total + item.price_data.unit_amount * item.quantity,
        0
      );

      // Aplicar promocode, se existir
      if (booking.promocode && booking.promocode.length > 0 && booking.promocode[0] !== '') {
        const promocode = await Promocode.findOne({ code: booking.promocode });
        if (!promocode) throw new ValidationError("Invalid promocode");

        let discountAmount = 0;
        if (promocode.discountType === "percentage") {
          discountAmount = totalAmount * (promocode.discount / 100);
        } else if (promocode.discountType === "fixed") {
          discountAmount = promocode.discount * 100; // Converter para centavos
        }

        totalAmount -= discountAmount;

        // Ajustar preços proporcionalmente
        const discountFactor = totalAmount / (totalAmount + discountAmount);
        line_items.forEach((item) => {
          item.price_data.unit_amount = Math.round(
            item.price_data.unit_amount * discountFactor
          );
        });
      }

      // Criar sessão de pagamento no Stripe
      const paymentSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card", "multibanco"],
        payment_intent_data: {
          metadata: {
            bookingId: booking._id.toString(),
            userId: booking.user._id.toString(),
            sessionId: booking.session.toString(),
            movieId: session.movie._id.toString(),
            roomId: session.room._id.toString(),
          },
        },
        success_url:
          process.env.NODE_ENV === "production"
            ? "https://cinemaclub-snowy.vercel.app/success"
            : "http://localhost:4000/success",
        cancel_url:
          process.env.NODE_ENV === "production"
            ? "https://cinemaclub-snowy.vercel.app/cancel"
            : "http://localhost:4000/cancel",
        line_items,
        mode: "payment",
      });

      // Agendar verificação de pagamento pendente
      checkingForPendingFiveMinutes(booking._id, paymentSession.payment_intent);

      return { url: paymentSession.url };
    } catch (error) {
      console.error("Error creating payment session:", error);
      throw error;
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
        })
        .populate("products");

      // Lista para armazenar os bilhetes gerados
      const tickets = [];

      // Para cada assento reservado, criar um bilhete separado
      for (const seat of populatedBooking.seats) {
        const newTicket = await ticketModel.create({
          booking: populatedBooking._id, // ID da reserva
          seat: seat, // Assento associado ao bilhete
        });

        console.log("Ticket created:", newTicket);
        tickets.push(newTicket._id);
      }

      const qrCodeId = uuidv4(); // ID único para o QR Code

      // Dados que serão codificados no QR Code para cada bilhete
      const qrData = {
        qrCodeId,
        bookingId: populatedBooking._id.toString(), // Convertendo para string
        tickets: tickets.map((ticket) => ({ ticketId: ticket._id })), // Lista de IDs de bilhetes
        products: populatedBooking.products.map((product) => ({
          productId: product._id,
        })),
        expirationDate: populatedBooking.session.endTime, // Data de validade do QR Code
      };

      // Calcular a diferença entre a data de expiração e a data atual em segundos
      const expiresIn = Math.floor(
        (new Date(qrData.expirationDate) - new Date()) / 1000
      );

      console.log("expiresIn", expiresIn);

      console.log("Dados do QR Code:", qrData);

      const token = jwt.sign(
        {
          qrData,
        },
        process.env.SECRET_KEY, // Chave secreta
        { expiresIn } // Tempo de validade do token
      );

      // Adicionar o token ao esquema de QR Code
      const qrCodeEntry = new QRCodeSchema({
        ...qrData,
        signature: token,
      });

      console.log("QR Code entry:", qrCodeEntry);

      await qrCodeEntry.save(); // Salvar o QR Code no banco de dados

      // Gera o QR Code como uma string base64
      const qrCode = await QRCode.toDataURL(
        JSON.stringify({ qrCodeId, token })
      );

      populatedBooking.tickets = tickets;
      await populatedBooking.save();

      // Retorna a lista de QR Codes gerados
      return qrCode;
    } catch (error) {
      console.error("Erro ao gerar bilhetes e QR Codes:", error);
      throw new DatabaseError("Falha ao gerar bilhetes e QR Codes");
    }
  }

  // Função para validar um QR Code
  async function validateQRCode(qrCodeId, token) {
    try {
      // Decodificar o token JWT
      const decoded = jwt.verify(token, process.env.SECRET_KEY);

      // Verificar se o QR Code existe no banco de dados
      const qrCodeEntry = await QRCode.findOne({ qrCodeId });
      if (!qrCodeEntry) {
        throw new NotFoundError("QR Code not found");
      }

      // Verificar se o QR Code foi revogado ou já usado
      if (qrCodeEntry.isRevoked || qrCodeEntry.isUsed) {
        throw new ValidationError("QR Code is invalid or already used");
      }

      // Verificar se o token corresponde aos dados armazenados
      if (qrCodeEntry.signature !== token) {
        throw new ValidationError("QR Code signature mismatch");
      }

      // Verificar se o QR Code expirou
      if (new Date() > new Date(qrCodeEntry.expirationDate)) {
        throw new ValidationError("QR Code has expired");
      }

      // Marcar o QR Code como usado
      qrCodeEntry.isUsed = true;
      qrCodeEntry.usedAt = new Date();
      await qrCodeEntry.save();

      // Retornar os dados decodificados
      return decoded.qrData;
    } catch (error) {
      console.error("Erro ao validar o QR Code:", error);
      throw new ValidationError("Falha ao validar o QR Code");
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
        throw new NotFoundError("Booking not found");
      }
      return booking;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async function findByIdAndUpdate(id) {
    try {
      const booking = await bookingModel.findByIdAndUpdate(id);
      if (!booking) {
        throw new NotFoundError("Booking not found");
      }
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async function findAll(page = 1, limit = 10, query = {}) {
    try {
      const skip = (page - 1) * limit;
      const bookings = await bookingModel
        .find(query)
        .populate({
          path: 'session',
          populate: {
            path: 'movie',
            select: 'title'
          }
        })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await bookingModel.countDocuments(query);

      if (bookings.length === 0) {
        return {
          bookings: [],
          total: 0,
          page,
          pages: 0,
        };
      }

      return {
        bookings,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    } catch (err) {
      throw err;
    }
  }

  // Encontra todas as reservas para uma sessão
  async function findAllBookingsForSession(sessionId, page = 1, limit = 10) {
    try {
      const session = await Session.findById(sessionId);

      if (!session) {
        throw new NotFoundError("Session not found");
      }

      const skip = (page - 1) * limit;
      const total = await bookingModel.countDocuments();
      const booking = await bookingModel
        .find({ session: sessionId })
        .skip(skip)
        .limit(limit);

      if (booking.length === 0) throw new NotFoundError("No bookings found.");

      return {
        booking,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw error;
    }
  }

  // Remove uma reserva por id
  async function removeById(id) {
    try {
      const booking = await bookingModel.findByIdAndDelete(id);
      if (!booking) {
        throw new NotFoundError("Booking not found");
      }
      return "Booking eliminado";
    } catch (err) {
      throw err;
    }
  }

  // Atualiza uma reserva por id
  async function updateById(id, booking) {
    try {
      const bookingUpdate = await bookingModel.findByIdAndUpdate(id, booking, {
        new: true,
      });
      if (!bookingUpdate) {
        throw new NotFoundError("Booking not found");
      }
    } catch (error) {
      throw error;
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
        throw new NotFoundError("Booking not found");
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(
        booking.paymentIntentId
      );
      console.log("PaymentIntent:", paymentIntent);

      if (!paymentIntent) {
        throw new NotFoundError("Payment Intent não encontrado");
      }

      // Verificar se a reserva já foi cancelada
      if (booking.status === "cancelled") {
        throw new ValidationError("Booking is already cancelled");
      }

      if (booking.status === "completed") {
        throw new ValidationError("Booking completed");
      }

      if (booking.paymentStatus === "refunded") {
        throw new ValidationError("Booking refunded");
      }

      if (booking.paymentStatus === "pending") {
        throw new ValidationError(
          "Cannot refund when payment didnt go through"
        );
      }

      if (booking.paymentStatus === "cancelled") {
        throw new ValidationError("Unnable to refund");
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
          throw error;
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
          throw error;
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

      if (!booking) throw new NotFoundError("Booking not found");
      if (booking.paymentStatus !== "paid") {
        throw new ValidationError("Booking not eligible for partial refunds");
      }

      if (ticketsToRefund.length === 0) {
        throw new NotFoundError(
          "No tickets found for refund or already refunded"
        );
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
      throw error;
    }
  }

  // Função para reembolsar um pagamento por stripe
  async function refundPayment(paymentIntentId, amount = null) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId, // ID do PaymentIntent
        amount: amount, // Valor a ser reembolsado (em centavos)
      });

      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );
      await userModel.findByIdAndUpdate(paymentIntent.metadata.userId, {
        $inc: { points: -paymentIntent.amount }, // Decrementar pontos do utilizador
      });

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
      throw new DatabaseError("Error canceling PaymentIntent");
    }
  }

  return service;
}

module.exports = bookingService;
