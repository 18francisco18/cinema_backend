const discountService = require('../discounts');

const discountController = {
    createDiscountForProduct,
    getAllStripeDiscounts,
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

module.exports = discountController;