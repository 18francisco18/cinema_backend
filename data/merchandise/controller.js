const merchandiseService = require("../services/merchandiseService");

const merchandiseController = {
  createMerchandise,
  getAllMerchandise,
  getMerchandiseById,
  updateMerchandise,
  deleteMerchandise,
};

// Criar uma nova mercadoria
async function createMerchandise(req, res) {
  const { name, description, poins, image, stock } = req.body;

  const result = await merchandiseService.createMerchandise({
    name,
    description,
    poins,
    image,
    stock,
  });

  if (result.success) {
    res.status(201).json(result.data);
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
}

// Obter todas as mercadorias
async function getAllMerchandise(req, res) {
  const result = await merchandiseService.getAllMerchandise();

  if (result.success) {
    res.status(200).json(result.data);
  } else {
    res.status(500).json({ success: false, message: result.message });
  }
}

// Obter uma mercadoria pelo ID
async function getMerchandiseById(req, res) {
  const { id } = req.params;

  const result = await merchandiseService.getMerchandiseById(id);

  if (result.success) {
    res.status(200).json(result.data);
  } else {
    res.status(404).json({ success: false, message: result.message });
  }
}

// Atualizar uma mercadoria pelo ID
async function updateMerchandise(req, res) {
  const { id } = req.params;
  const { name, description, poins, image, stock } = req.body;

  const result = await merchandiseService.updateMerchandise(id, {
    name,
    description,
    poins,
    image,
    stock,
  });

  if (result.success) {
    res.status(200).json(result.data);
  } else {
    res.status(400).json({ success: false, message: result.message });
  }
}

// Deletar uma mercadoria pelo ID
async function deleteMerchandise(req, res) {
  const { id } = req.params;

  const result = await merchandiseService.deleteMerchandise(id);

  if (result.success) {
    res
      .status(200)
      .json({ success: true, message: "Mercadoria deletada com sucesso" });
  } else {
    res.status(404).json({ success: false, message: result.message });
  }
}

module.exports = merchandiseController;
