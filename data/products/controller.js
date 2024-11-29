const productsService = require('../products')

const productsController = {
    createProduct,
    updateProduct,
    findAllProducts,
    findProductById,
    removeProductById,
    createCategory,
}

async function createProduct(req, res, next) {
    try {
        const product = await productsService.createProduct(req.body);
        res.status(201).json(product);
    } catch (error) {
        console.log(error);
        next(error)
    }
}

async function updateProduct(req, res, next) {
    try {
        const { id } = req.params;
        const product = await productsService.updateProduct(id, req.body);
        res.status(200).json(product);
    } catch (error) {
        next(error)
    }
}

// Controlador para buscar todos os produtos com paginação e filtragem
async function findAllProducts(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filters = {};

    // Adicionar filtros de consulta
    if (req.query.name) {
      filters.name = { $regex: req.query.name, $options: "i" }; // Filtro por nome (case-insensitive)
    }
    if (req.query.category) {
      filters.category = req.query.category; // Filtro por categoria
    }
    if (req.query.minPrice) {
      filters.price = { ...filters.price, $gte: parseFloat(req.query.minPrice) }; // Filtro por preço mínimo
    }
    if (req.query.maxPrice) {
      filters.price = { ...filters.price, $lte: parseFloat(req.query.maxPrice) }; // Filtro por preço máximo
    }

    const result = await productsService.findAll(page, limit, filters);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    next(error);
  }
}

async function findProductById(req, res, next) {
    try {
        const { id } = req.params;
        const product = await productsService.findById(id);
        res.status(200).json(product);
    } catch (error) {
        console.log(error);
        next(error)
    }
}


async function removeProductById(req, res, next) {
    try {
        const { id } = req.params;
        await productsService.removeProductById(id);
        res.status(204).send({ message: 'Product deleted'});
    } catch (error) {
        console.log(error);
        next(error)
    }
}

async function createCategory(req, res, next) {
    try {
        const category = await productsService.createCategory(req.body);
        res.status(201).json(category);
    } catch (error) {
        console.log(error);
        next(error)
    }
}





module.exports = productsController