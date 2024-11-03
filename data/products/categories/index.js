const Category = require('./category');
const categoryService = require('./service');

const categoriesService = categoryService(Category);
module.exports = categoriesService;