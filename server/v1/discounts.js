const bodyParser = require("body-parser");
const express = require("express");
const discountController = require("../../data/discounts/controller");

function DiscountsRouter() {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    router.get("/all", discountController.getAllStripeDiscounts);

    router.post("/createPromoCode", discountController.createDiscountForProduct);
    router.post("/apply-discount/:productId", discountController.applyDiscountToProduct);
    // fazer rota para encerrar promoção
    


    return router;
}

module.exports = DiscountsRouter;