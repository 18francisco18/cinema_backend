const dotenv = require('dotenv');
const {NotFoundError} = require("../../AppError");
dotenv.config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Product = require('../products/product');

function discountsService(discountModel) {
    let service = {
        createDiscountCoupon,
        findAllStripeDiscounts,
        applyDiscountToProduct,
        checkForExpiredDiscounts,
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

    async function applyDiscountToProduct(productId, discountPercentage, expirationDate) {
        try {
            const product = await Product.findById(productId);
            if (!product) throw new Error("Produto não encontrado");

            // Calcular e aplicar o preço com desconto
            let discountedPrice = product.price * (1 - discountPercentage / 100);
            // Arredondar para 2 casas decimais
            discountedPrice = parseFloat(discountedPrice.toFixed(2));
            product.discountedPrice = discountedPrice;
            product.discountExpiration = expirationDate; // Definir data de validade do desconto
            await product.save();

            return discountedPrice;
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

    return service;
}

module.exports = discountsService;