const discountService = require('../discounts');

const discountController = {
    createDiscountForProduct,
    getAllStripeDiscounts,
    applyDiscountToProduct,
    checkForExpiredDiscounts,
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

async function checkForExpiredDiscounts(req, res, next) {
    try {
        const check = await discountService.checkForExpiredDiscounts();
        res.status(200).json(check);
    } catch (error) {
        next(error)
    }
}

module.exports = discountController;