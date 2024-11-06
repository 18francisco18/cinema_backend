const dotenv = require('dotenv');
dotenv.config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

function discountsService(discountModel) {
    let service = {
        createDiscountCoupon,
        findAllStripeDiscounts,
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



    return service;
}

module.exports = discountsService;