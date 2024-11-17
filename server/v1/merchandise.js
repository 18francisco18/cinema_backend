const express = require("express");
const bodyParser = require("body-parser");
const merchandiseController = require("../../data/merchandise/controller"); // Certifique-se de que o caminho está correto

function MerchandiseRouter() {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  router.get("/merchandise", merchandiseController.getAllMerchandise);
  router.get("/merchandise/:id", merchandiseController.getMerchandiseById);
  router.post("/merchandise", merchandiseController.createMerchandise);
  router.put("/merchandise/:id", merchandiseController.updateMerchandise);
  router.delete("/merchandise/:id", merchandiseController.deleteMerchandise);
  router.post(
    "/redeem/:merchandiseId",
    merchandiseController.redeemMerchandise
  );

  return router;
}

module.exports = MerchandiseRouter;
