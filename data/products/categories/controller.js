const categoryService = require('../categories');

const categoryController = {
    createCategory,
    findAllCategories,
    findCategoryById,
    removeCategoryById,
}

async function createCategory(req, res, next) {
    try {
        const category = await categoryService.create(req.body);
        res.status(201).json(category);
    } catch (error) {
        console.log(error);
        next(error)
    }
}

async function findAllCategories(req, res, next) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const categories = await categoryService.findAll(page, limit);
        res.status(200).json(categories);
    } catch (error) {
        console.log(error);
        next(error)
    }
}

async function findCategoryById(req, res, next) {
    try {
        const { id } = req.params;
        const category = await categoryService.findById(id);
        res.status(200).json(category);
    } catch (error) {
        console.log(error);
        next(error)
    }
}

async function removeCategoryById(req, res, next) {
    try {
        const { id } = req.params;
        await categoryService.removeCategoryById(id);
        res.status(204).send({ message: 'Category deleted'});
    } catch (error) {
        console.log(error);
        next(error)
    }
}

module.exports = categoryController;