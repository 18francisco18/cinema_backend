const PointsService = require('./service');
const Points = require('./points');

const pointsService = PointsService(Points);
module.exports = pointsService;
