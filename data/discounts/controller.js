const discountService = require('../discounts');

const discountController = {
    createDiscountForProduct,
    getAllStripeDiscounts,
    applyDiscountToProduct,
    removeDiscountFromProduct,
    findAllDiscountedProducts,
}

async function createDiscountForProduct(req, res, next) {
    try {
        const discount = req.body;
        const newDiscount = await discountService.createDiscountCoupon(discount);
        res.status(201).json(newDiscount);
    } catch (error) {
        next(error)
    }
}

async function getAllStripeDiscounts(req, res, next) {
    try {
        const discounts = await discountService.findAllStripeDiscounts();
        res.status(200).json(discounts);
    } catch (error) {
        next(error)
    }
}

// Controlador para aplicar desconto a um produto
async function applyDiscountToProduct(req, res, next) {
    try {
        const { productId } = req.params;
        const { discountPercentage, discountExpiration } = req.body;
        const product = await discountService.applyDiscountToProduct(productId, discountPercentage, discountExpiration);
        res.status(200).json(product);
    } catch (error) {
        next(error)
    }
}

// Controlador para remover o desconto de um produto
async function removeDiscountFromProduct(req, res, next) {
    try {
        const { productId } = req.params;
        const product = await discountService.removeDiscountFromProduct(productId);
        res.status(200).json(product);
    } catch (error) {
        next(error)
    }
}

// Controlador para buscar todos os produtos com desconto
async function findAllDiscountedProducts(req, res, next) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const products = await discountService.findAllDiscountedProducts(page, limit);
        res.status(200).json(products);
    } catch (error) {
        next(error)
    }
}


module.exports = discountController;