const pointsService = require("../points");
const User = require("../users/user");

const pointsController = {
  redeemPoints,
};

async function redeemPoints(req, res) {
  const { pointsToRedeem } = req.body; // Recebe a quantidade de pontos do usuário
  const user = req.user; // Supondo que o usuário já está autenticado e o objeto user está disponível

  const result = await pointsService.redeemPointsForDiscount(
    user,
    pointsToRedeem
  );

  if (result.success) {
    res.json({ success: true, promoCode: result.promoCode });
  } else {
    res.json({ success: false, message: result.message });
  }
}

module.exports = pointsController;
