const discountService = require('../discounts');

const discountController = {
    createDiscountForProduct,
    getAllStripeDiscounts,
    applyDiscount,
    findAllDiscountedProducts,
    markDiscountAsInactive,
    updateDiscount,
    deleteDiscount,
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

async function applyDiscount(req, res, next) {
  try {
    const discountData = req.body; // Dados do desconto enviados no body
    const discount = await discountService.createAndApplyDiscount(discountData);
    res.status(201).json(discount);
  } catch (error) {
    next(error);
  }
}

async function markDiscountAsInactive(req, res, next) {
    try {
        const { discountId } = req.params;
        const discount = await discountService.markDiscountAsInactive(discountId);
        res.status(200).json(discount);
    } catch (error) {
        next(error)
    }
}

async function updateDiscount(req, res, next) {
    try {
        const { discountId } = req.params;
        const discountData = req.body;
        const discount = await discountService.updateDiscount(discountId, discountData);
        res.status(200).json(discount);
    } catch (error) {
        next(error)
    }
}

async function deleteDiscount(req, res, next) {
    try {
        const { discountId } = req.params;
        await discountService.deleteDiscount(discountId);
        res.status(200);
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