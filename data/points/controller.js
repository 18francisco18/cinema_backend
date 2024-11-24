const pointsService = require("../points");
const User = require("../users/user");

const pointsController = {
  redeemPoints,
  addProductToPointsSystem,
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

async function addProductToPointsSystem(req, res, next) {

  try {
    const productId = req.body;
    const points = await pointsService.addProductToPointSystem(productId);
    res.status(200).json(points);
  } catch (err) {
    next(err);
  }
}

module.exports = pointsController;
