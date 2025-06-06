const express = require('express');
const bodyParser = require('body-parser');
const pointsController = require('../../data/points/controller');
const verifyTokenMiddleware = require('../../middleware/token');


function PointsRouter() {
  let router = express();

  router.use(bodyParser.json({ limit: "100mb" }));
  router.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
    
  router.post('/redeem', verifyTokenMiddleware, pointsController.redeemPoints);
  router.post('/add-product', pointsController.addProductToPointsSystem);

  return router;
}

module.exports = PointsRouter;
