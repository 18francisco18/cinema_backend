const Discounts = require('./discounts')
const DiscountsService = require('./service')

const discountsService = DiscountsService(Discounts)
module.exports = discountsService