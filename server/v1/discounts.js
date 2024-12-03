const bodyParser = require("body-parser");
const express = require("express");
const discountController = require("../../data/discounts/controller");

function DiscountsRouter() {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    router.get("/all", discountController.getAllStripeDiscounts);
    router.get("/allDiscountedProducts", discountController.findAllDiscountedProducts);

    router.post("/createPromoCode", discountController.createDiscountForProduct);
    router.post("/apply-discount", discountController.applyDiscount);
   

    router.patch("/markAsInactive/:discountId", discountController.markDiscountAsInactive);
    router.put("/updateDiscount/:discountId", discountController.updateDiscount);
    router.delete("/deleteDiscount/:discountId", discountController.deleteDiscount);
    


    return router;
}

module.exports = DiscountsRouter;