const Products = require('./products')
const ProductsService = require('./service')

const productsService = ProductsService(Products)
module.exports = productsService