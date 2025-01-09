const Product = require('../../products/product');
const User = require('../../users/user');
const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ServiceUnavailableError,
  PaymentRequiredError,
} = require("../../../AppError");



function promocodeService(promocodeModel) {
    let service = {
        createPromocode,
        findPromocodeById,
        markPromocodeAsInactive,
        markPromocodeAsActive,
        findAllPromocodes,
        updatePromocode,
        deletePromocode,
        applyPromocode,
        changePromocodeValueFrontend,
    }

    async function createPromocode(promocode) {
        try {

            if (promocode.product) {
                const produto = await Product.findById(promocode.product);
                if (!produto) throw new NotFoundError("Produto não encontrado");
            }

            if (promocode.user) {
                const user = await User.findById(promocode.user);
                if (!user) throw new NotFoundError("Usuário não encontrado");
            }

            if (promocode.startDate > promocode.endDate) throw new ValidationError("Data de início não pode ser maior que a data de término");

            if (promocode.maxUsage < 1) throw new ValidationError("O número máximo de usos deve ser maior que 0");

            if (promocode.discount < 0) throw new ValidationError("O desconto não pode ser negativo");
            

            const promo = await promocodeModel.create(promocode);
            await promo.save();

            return promo;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }


    async function findPromocodeById(promocodeId) {
        try {
            const promocode = await promocodeModel.findById(promocodeId);
            if (!promocode) throw new NotFoundError("Promocode não encontrado");
            return promocode;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }


    async function markPromocodeAsInactive(promocodeId) {
        try {
            const promocode = await promocodeModel.findById(promocodeId);
            if (!promocode) throw new NotFoundError("Promocode não encontrado");

            promocode.active = false;
            await promocode.save();
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async function markPromocodeAsActive(promocodeId) {
        try {
            const promocode = await promocodeModel.findById(promocodeId);
            if (!promocode) throw new NotFoundError("Promocode não encontrado");

            promocode.active = true;
            await promocode.save();
        } catch (error) {
            console.log(error);
            throw error;
        }
    }


    async function findAllPromocodes() {
        try {
            const promocodes = await promocodeModel.find({});
            return promocodes;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async function updatePromocode(promocodeId, promocodeData) {
        try {
            const promocode = await promocodeModel.findById(promocodeId);
            if (!promocode) throw new NotFoundError("Promocode não encontrado");

            if (promocodeData.startDate > promocodeData.endDate) throw new ValidationError("Data de início não pode ser maior que a data de término");

            if (promocodeData.maxUsage < 1) throw new ValidationError("O número máximo de usos deve ser maior que 0");

            if (promocodeData.discount < 0) throw new ValidationError("O desconto não pode ser negativo");

            Object.assign(promocode, promocodeData);
            await promocode.save();
            return promocode;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }


    async function deletePromocode(promocodeId) {
        try {
            const promocode = await promocodeModel.findByIdAndDelete(promocodeId);
            if (!promocode) throw new NotFoundError("Promocode não encontrado");
            return "Promocode deleted";
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }


    // Função para aplicar um promocode a uma reserva
    // Aplicada no service de booking
    async function applyPromocode(booking, totalAmount) {
      try {
        for (const promocodeCode of booking.promocodes) {
          const promocode = await promocodeModel.findOne({
            code: promocodeCode,
          });

          if (!promocode) {
            throw new ValidationError(
              `Promocode ${promocodeCode} does not exist.`
            );
          }

          // Verificar validade e ativação
          const now = new Date();
          if (promocode.endDate < now) {
            throw new ValidationError(`Promocode ${promocodeCode} expired`);
          }

          // Verificar se o promocode está ativo
          if (!promocode.active) {
            throw new ValidationError(`Promocode ${promocodeCode} inactive.`);
          }

          // Verificar tipo e uso
          if (promocode.type === "one-time") {
            if (promocode.usedBy.includes(booking.user)) {
              throw new ValidationError(
                `Promocode ${promocodeCode} already used by this user.`
              );
            }
          }

          // Verificar se o promocode pode ser aplicado ao produto
          if (promocode.maxUsage && promocode.maxUsage < 1) {
            throw new ValidationError(
              `Promocode ${promocodeCode} max usage reached.`
            );
          }

          // Aplicar desconto
          if (promocode.discountType === "percentage") {
            totalAmount = (
              totalAmount -
              totalAmount * (promocode.discount / 100)
            ).toFixed(2);
            totalAmount = parseFloat(totalAmount);
          } else if (promocode.discountType === "fixed") {
            totalAmount -= promocode.discount;
          }

          // Garantir que o preço não fique negativo
          totalAmount = Math.max(totalAmount, 0);

          if (promocode.maxUsage) {
            promocode.maxUsage--;
          }

          // Adicionar utilizador à lista de usos
          promocode.usedBy.push(booking.user);

          await promocode.save();
        }

        return totalAmount;
      } catch (error) {
        console.error("Error applying promocode:", error);
        throw new ValidationError(
          "An error occurred while applying the promocode."
        );
      }
    }

    async function changePromocodeValueFrontend(promocodeCode, totalAmount) {
      try {
        const promocode = await promocodeModel.findOne({ code: promocodeCode });

        if (!promocode) {
          throw new ValidationError("This promocode does not exist.");
        }

        // Verificar validade e ativação
        const now = new Date();
        if (promocode.endDate < now) {
          throw new ValidationError("Promocode expired");
        }

        // Verificar se o promocode está ativo
        if (!promocode.active) {
          throw new ValidationError("Promocode inactive.");
        }

        // Aplicar desconto
        if (promocode.discountType === "percentage") {
          totalAmount = (
            totalAmount -
            totalAmount * (promocode.discount / 100)
          ).toFixed(2);
          totalAmount = parseFloat(totalAmount);
        } else if (promocode.discountType === "fixed") {
          totalAmount -= promocode.discount;
        }

        // Garantir que o preço não fique negativo
        totalAmount = Math.max(totalAmount, 0);

        return { message: "Promocode applied successfully", totalAmount };
      } catch (error) {
        console.error("Error validating promocode:", error);
        throw new ValidationError(
          "An error occurred while validating the promocode."
        );
      }
    }






    return service;
}


module.exports = promocodeService;