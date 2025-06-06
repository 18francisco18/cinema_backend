const bodyParser = require("body-parser");
const express = require("express");
const productsController = require("../../data/products/categories/controller");

function CategoriesRouter() {
    let router = express();

    router.use(bodyParser.json({ limit: "100mb" }));
    router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    router.get("/all", productsController.findAllCategories);
    router.get("/find/:id", productsController.findCategoryById);
    // Fazer rota para buscar produtos de uma categoria

    // Fazer rota para atualizar categoria

    router.post("/create", productsController.createCategory);
    
    router.delete("/remove/:id", productsController.removeCategoryById);

    return router;
}

module.exports = CategoriesRouter;