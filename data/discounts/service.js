const dotenv = require('dotenv');
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
dotenv.config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Product = require('../products/product');

function discountsService(discountModel) {
    let service = {
        createDiscountCoupon,
        findAllStripeDiscounts,
        createAndApplyDiscount,
        findAllDiscountedProducts,
        checkForExpiredDiscounts,
        markDiscountAsInactive,
        updateDiscount,
        deleteDiscount,
    }

    async function createDiscountCoupon(discount) {
        try {
            // Criar o cupom no Stripe
            const stripeCoupon = await stripe.coupons.create({
                percent_off: discount.percentOff || undefined,
                duration: discount.duration,
                duration_in_months: discount.durationInMonths || undefined,
            });

            // Criar o código promocional associado ao cupom no Stripe
            const stripePromotionCode = await stripe.promotionCodes.create({
                coupon: stripeCoupon.id,
                code: discount.code || undefined,
                name: discount.productName
            });

            // Salvar no banco de dados
            const newDiscount = await discountModel.create({
                id: stripePromotionCode.id,
                productName: discount.productName || null,
                type: discount.type || false,
                duration: discount.duration,
                durationInMonths: discount.durationInMonths || null,
                percentOff: discount.percentOff || null,
                description: discount.description || null,
                active: stripePromotionCode.active || true,
            });

            return await newDiscount.save();
        } catch (error) {
            console.log(error);
            throw error;
        }
        
    }

    async function findAllStripeDiscounts() {
        try {
            const discounts = await stripe.coupons.list();
            return discounts.data;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async function createAndApplyDiscount(discountData) {
      const {
        type,
        productId,
        userId,
        percentOff,
        fixedAmountOff,
        startDate,
        endDate,
        description,
      } = discountData;

      // Validações básicas
      if (type === "product" && !productId) {
        throw new Error(
          "ID do produto é obrigatório para descontos do tipo 'product'."
        );
      }
      if (type === "user" && !userId) {
        throw new Error(
          "ID do usuário é obrigatório para descontos do tipo 'user'."
        );
      }



      // Criação do desconto
      const discount = new discountModel({
        type,
        productId: type === "product" ? productId : null,
        userId: type === "user" ? userId : null,
        percentOff,
        fixedAmountOff,
        startDate,
        endDate,
        description,
        active: true,
      });

      await discount.save();

      // Aplicação do desconto no produto (se for do tipo 'product')
      if (type === "product") {
        const product = await Product.findById(productId);
        if (!product) {
          throw new Error("Produto não encontrado.");
        }

        product.discountRef.push(discount._id); // Associa o desconto ao produto
        await product.save();
      }

      return discount;
    }


    async function markDiscountAsInactive(discountId) {
        try {
            const discount = await discountModel.findById(discountId);
            if (!discount) throw new NotFoundError("Desconto não encontrado");

            discount.active = false;
            await discount.save();
        } catch (error) {
            console.log(error);
            throw error;
        }
    }
            



    async function createAndApplyDiscountToUser(discountData) {
      const {
        userId,
        percentOff,
        fixedAmountOff,
        startDate,
        endDate,
        description,
      } = discountData;

      if (!userId) {
        throw new Error(
          "ID do usuário é obrigatório para descontos de usuário."
        );
      }

      // Criação do desconto
      const discount = new Discount({
        type: "user",
        userId,
        percentOff,
        fixedAmountOff,
        startDate,
        endDate,
        description,
        active: true,
      });

      await discount.save();

      // Associar o desconto ao usuário (se necessário, em um esquema separado)
      // Exemplo: se o usuário tiver um campo para descontos aplicados.
      return discount;
    }





    async function createAndApplyDiscountToProduct(discountData) {
      const {
        productId,
        percentOff,
        fixedAmountOff,
        startDate,
        endDate,
        description,
      } = discountData;

      if (!productId) {
        throw new Error(
          "ID do produto é obrigatório para descontos de produto."
        );
      }

      // Criação do desconto
      const discount = new Discount({
        type: "product",
        productId,
        percentOff,
        fixedAmountOff,
        startDate,
        endDate,
        description,
        active: true,
      });

      await discount.save();

      // Associar o desconto ao produto
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Produto não encontrado.");
      }

      product.discount = discount._id;
      await product.save();

      return discount;
    }





    async function applyDiscountToProductForUser(
      productId,
      userId,
      discountId
    ) {
      // Verifica se o desconto é válido e pertence ao usuário
      const discount = await Discount.findOne({
        _id: discountId,
        userId,
        active: true,
      });
      if (!discount) {
        throw new Error(
          "Desconto inválido ou não autorizado para este usuário."
        );
      }

      // Busca o produto
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Produto não encontrado.");
      }

      // Calcula o novo preço com base no desconto
      const discountedPrice =
        product.price - product.price * (discount.percentOff / 100);

      // Opcional: Atualiza o produto com o preço com desconto (caso seja necessário)
      return {
        productId: product._id,
        originalPrice: product.price,
        discountedPrice,
        discount: discount.percentOff,
        description: discount.description,
      };
    }

    async function findAllDiscountedProducts(page = 1, limit = 10) {
        try {
            

            // Paginar resultados
            const skip = (page - 1) * limit;
            const products = await Product.find({
              discountedPrice: { $exists: true },
            }).skip(skip).limit(limit);
            const total = await Product.countDocuments({
                discountedPrice: { $exists: true },
            });

            if (products.length === 0) throw new NotFoundError("Nenhum produto com desconto encontrado");
            
            return {
                products,
                page,
                total,
                pages: Math.ceil(total / limit),
                previous: page > 1 ? page - 1 : null,
                next: page < Math.ceil(total / limit) ? page + 1 : null,
            }
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async function checkForExpiredDiscounts() {
        const now = new Date();

        try {
            // Encontrar produtos com desconto expirado
            const expiredDiscounts = await Product.find({
                discountExpiration: { $lt: now },
                discountedPrice: { $exists: true }
            });

            for (const product of expiredDiscounts) {
                product.discountedPrice = undefined; // Remove o preço com desconto
                product.discountExpiration = undefined; // Remove a validade do desconto
                await product.save();
            }

            console.log('Descontos expirados restaurados com sucesso');
        } catch (error) {
            console.error("Erro ao restaurar preços de produtos:", error);
            throw error;
        }
    }

    async function updateDiscount(discountId, discount) {
        try {

            const updateDiscount = await discountModel.findByIdAndUpdate(discountId, discount, {
                new: true,
            });
            if (!updateDiscount) throw new NotFoundError("Desconto não encontrado");
            await updateDiscount.save();
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async function deleteDiscount(discountId) {
        try {
            const discount = await discountModel.findByIdAndDelete(discountId);
            if (!discount) throw new NotFoundError("Desconto não encontrado");

            // Remover o desconto do produto (se houver)
            if (discount.productId) {
                const product = await Product.findById(discount.productId);
                if (!product) throw new NotFoundError("Produto não encontrado");

                product.discounts = product.discounts.filter(
                  (id) => id.toString() !== discountId.toString()
                );

                await product.save();
            }

        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    return service;
}

module.exports = discountsService;