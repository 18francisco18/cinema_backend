const bodyParser = require("body-parser");
const express = require("express");
const productsController = require("../../data/products/controller");

function ProductsRouter() {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    router.post("/create", productsController.createProduct);
    router.post("/createCategory", productsController.createCategory);
    router.get("/all", productsController.findAllProducts);
    router.get("/find/:id", productsController.findProductById);
    router.delete("/remove/:id", productsController.removeProductById);

    return router;
}

module.exports = ProductsRouter;