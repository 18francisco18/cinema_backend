const bodyParser = require("body-parser");
const express = require("express");
const promocodeController = require("../../data/discounts/promocodes/controller");

function PromocodesRouter() {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    router.get("/all", promocodeController.findAllPromocodes);
    router.get("/:id", promocodeController.findPromocodeById);

    router.post("/createPromoCode", promocodeController.createPromocode);


    router.patch("/markAsInactive/:id", promocodeController.markPromocodeAsInactive);
    router.patch("/markAsActive/:id", promocodeController.markPromocodeAsActive);

    router.put("/updatePromocode/:id", promocodeController.updatePromocode);

    router.delete("/deletePromocode/:id", promocodeController.deletePromocode);

    return router;
}

module.exports = PromocodesRouter;