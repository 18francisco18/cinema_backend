const AppError = require('../../AppError');
const { ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError, DatabaseError, ServiceUnavailableError } = require('../../AppError');


function productService(productModel) {
    let service = {
        create,
        save,
        findAll,
        findById,
        removeProductById,
    };

    async function create(product) {
        try {
            let newProduct = new productModel(product);

            if (!newProduct.name || !newProduct.price || !newProduct.category || !newProduct.description || !newProduct.image || !newProduct.stock) {
                throw new ValidationError("Missing fields");
            }

            if (newProduct.price < 0) {
                throw new ValidationError("Price must be greater than 0");
            }

            const productExists = await productModel.findOne({ name: newProduct.name });
            if (productExists) {
                throw new ConflictError("Product already exists");
            }

            return await save(newProduct);
        } catch (error) {
            console.log(error);
            throw (error);
        }
    }

    function save(model) {
        return new Promise(function (resolve, reject) {
            model
            .save()
            .then(() => resolve(model))
            .catch((err) => reject(`Houve um problema ao criar o produto ${err}`));
        });
    }

    async function findAll(page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const products = await productModel.find().limit(limit).skip(skip);
            const total = await productModel.countDocuments();

            if (products.length === 0) {
                throw new NotFoundError("No products found");
            }

            if (page > Math.ceil(total / limit)) {
                throw new NotFoundError("Page not found");
            }

            return {
                products,
                total,
                page,
                limit
            };
        } catch (error) {
            console.log(error);
            throw (error);
        }
    }

    async function findById(id) {
        try {
            const product = await productModel.findById(id);
            if (!product) {
                throw new NotFoundError("Product not found")
            }
            return product;
        } catch (error) {
            console.log(error);
            throw (error);
        }
    }

    async function removeProductById(id) {
        try {
            const product = await productModel.findById(id);
            if (!product) {
                throw new NotFoundError("Product not found");
            }
            return await productModel.findByIdAndDelete(id);
        } catch (error) {
            console.log(error);
            throw (error);
        }
    }




    return service
}

module.exports = productService;
