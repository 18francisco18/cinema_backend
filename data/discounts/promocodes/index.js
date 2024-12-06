const Promocode = require('./promocodes');
const PromocodeService = require('./service');

const PromocodeServiceInstance = PromocodeService(Promocode);
module.exports = PromocodeServiceInstance;