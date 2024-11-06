const bodyParser = require("body-parser");
const express = require("express");
const discountController = require("../../data/discounts/controller");

function DiscountsRouter() {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    router.post("/create", discountController.createDiscountForProduct);
    router.get("/all", discountController.getAllStripeDiscounts);

    return router;
}

module.exports = DiscountsRouter;