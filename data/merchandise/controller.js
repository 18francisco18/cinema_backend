const Merchandise = require("./merchandise");
const User = require("../users/user");

const merchandiseController = {
  createMerchandise,
  getAllMerchandise,
  getMerchandiseById,
  updateMerchandise,
  deleteMerchandise,
  redeemMerchandise,
};

// Criar uma nova mercadoria
async function createMerchandise(req, res) {
  const { name, description, poins, image } = req.body;

  try {
    const newMerchandise = new Merchandise({
      name,
      description,
      poins,
      image,
    });

    const savedMerchandise = await newMerchandise.save();
    res.status(201).json(savedMerchandise);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// Obter todas as mercadorias
async function getAllMerchandise(req, res) {
  try {
    const merchandise = await Merchandise.find();
    res.status(200).json(merchandise);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Obter uma mercadoria pelo ID
async function getMerchandiseById(req, res) {
  const { id } = req.params;

  try {
    const merchandise = await Merchandise.findById(id);
    if (!merchandise) {
      return res
        .status(404)
        .json({ success: false, message: "Merchandise not found" });
    }
    res.status(200).json(merchandise);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Atualizar uma mercadoria pelo ID
async function updateMerchandise(req, res) {
  const { id } = req.params;
  const { name, description, poins, image } = req.body;

  try {
    const updatedMerchandise = await Merchandise.findByIdAndUpdate(
      id,
      { name, description, poins, image },
      { new: true }
    );

    if (!updatedMerchandise) {
      return res
        .status(404)
        .json({ success: false, message: "Merchandise not found" });
    }

    res.status(200).json(updatedMerchandise);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Deletar uma mercadoria pelo ID
async function deleteMerchandise(req, res) {
  const { id } = req.params;

  try {
    const deletedMerchandise = await Merchandise.findByIdAndDelete(id);

    if (!deletedMerchandise) {
      return res
        .status(404)
        .json({ success: false, message: "Merchandise not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Merchandise deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Função para resgatar um merchandise usando pontos do usuário
async function redeemMerchandise(req, res) {
  const { merchandiseId } = req.params;
  const userId = req.userId; // Get userId from the verified token

  try {
    // Encontrar o usuário pelo ID
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Encontrar a mercadoria pelo ID
    const merchandise = await Merchandise.findById(merchandiseId);
    if (!merchandise) {
      return res
        .status(404)
        .json({ success: false, message: "Merchandise not found" });
    }

    // Verificar se o usuário tem pontos suficientes
    if (user.points < merchandise.poins) {
      return res.status(400).json({
        success: false,
        message: "Not enough points to redeem this merchandise",
      });
    }

    // Deduzir os pontos do usuário
    user.points -= merchandise.poins;

    // Associar o merchandise ao usuário
    user.redeemedMerchandise.push(merchandise._id);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Merchandise redeemed successfully",
      redeemedItem: merchandise,
      remainingPoints: user.points
    });
  } catch (error) {
    console.error('Error in redeemMerchandise:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = merchandiseController;
