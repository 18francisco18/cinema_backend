const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../users/user"); // Certifique-se de que o caminho está correto

async function createPromoCode(amountOff) {
  const coupon = await stripe.coupons.create({
    amount_off: amountOff * 100, // Valor em centimos (por exemplo, 1€ = 100 centimos)
    currency: "eur",
    duration: "once",
  });

  const promoCode = await stripe.promotionCodes.create({
    coupon: coupon.id,
    max_redemptions: 1,
  });

  return promoCode.code;
}

async function redeemPointsForDiscount(userId, pointsToRedeem) {
  const user = await User.findById(userId); // Busca o usuário pelo ID

  if (!user) {
    return { success: false, message: "Usuário não encontrado" };
  }

  const discountAmount = pointsToRedeem * 0.01; // Calcula o valor do desconto em €

  if (user.points >= pointsToRedeem) {
    const promoCode = await createPromoCode(discountAmount);

    // Deduz os pontos do usuário e salva no banco de dados
    user.points -= pointsToRedeem;
    await user.save();

    return { success: true, promoCode };
  } else {
    return { success: false, message: "Pontos insuficientes" };
  }
}

const PointsService = {
  redeemPointsForDiscount,
};

module.exports = PointsService;
