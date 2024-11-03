const productsService = require('../products')

const productsController = {
    createProduct,
    findAllProducts,
    findProductById,
    removeProductById,
    createCategory,
}

async function createProduct(req, res, next) {
    try {
        const product = await productsService.create(req.body);
        res.status(201).json(product);
    } catch (error) {
        console.log(error);
        next(error)
    }
}

async function findAllProducts(req, res, next) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const products = await productsService.findAll(page, limit);
        res.status(200).json(products);
    } catch (error) {
        console.log(error);
        next(error)
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