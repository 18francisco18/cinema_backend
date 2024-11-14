const Product  = require('./product')
const ProductsService = require('./service')

const productsService = ProductsService(Product)
module.exports = productsService