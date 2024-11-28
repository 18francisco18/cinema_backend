const express = require("express");
const bodyParser = require("body-parser");
const merchandiseController = require("../../data/merchandise/controller");
const verifyTokenMiddleware = require("../../middleware/token");

function MerchandiseRouter() {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  // Public routes
  router.get("/merchandise", merchandiseController.getAllMerchandise);
  router.get("/merchandise/:id", merchandiseController.getMerchandiseById);

  // Protected routes that require authentication
  router.post("/merchandise", verifyTokenMiddleware, merchandiseController.createMerchandise);
  router.put("/merchandise/:id", verifyTokenMiddleware, merchandiseController.updateMerchandise);
  router.delete("/merchandise/:id", verifyTokenMiddleware, merchandiseController.deleteMerchandise);
  router.post("/redeem/:merchandiseId", verifyTokenMiddleware, merchandiseController.redeemMerchandise);

  return router;
}

module.exports = MerchandiseRouter;
