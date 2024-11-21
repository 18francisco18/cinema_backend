const PointsService = require('./service');
const Points = require('./points');

const PointsServiceInstance = new PointsService(Points);
module.exports = PointsServiceInstance;
