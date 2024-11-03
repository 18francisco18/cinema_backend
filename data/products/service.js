const AppError = require('../../AppError');
const { ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError, DatabaseError, ServiceUnavailableError } = require('../../AppError');
const Category = require('./categories/category');

function productService(productModel) {
    let service = {
        create,
        save,
        findAll,
        findById,
        removeProductById,
    };

    // Função para criar um novo produto
    // Este codigo foi otimizado
    async function create(product) {
        try {
            let newProduct = new productModel(product);

            // Campos obrigatórios dentro de um array
            const requiredFields = ["name", "price", "category", "description", "image", "stock"];

            // Verifica se todos os campos obrigatórios foram preenchidos
            const missingFields = requiredFields.filter(field => !newProduct[field]);

            if (missingFields.length > 0) {
                throw new ValidationError(`Campos ausentes: ${missingFields.join(", ")}`);
            }

            if (newProduct.price < 0) {
                throw new ValidationError("O preço deve ser maior que 0");
            }

            const [productExists, categoryExists] = await Promise.all([
                productModel.findOne({ name: newProduct.name }),
                Category.findOne({ _id: newProduct.category })
            ]);

            if (productExists) throw new ConflictError("O produto já existe");
            if (!categoryExists) throw new NotFoundError("Categoria não encontrada");
            return await save(newProduct);
        } catch (error) {
            console.log(error);
            throw error;
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


    // Função para buscar todos os produtos
    // Este codigo foi otimizado
    async function findAll(page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;

            // Calcular o total de documentos primeiro e validar o número de página
            const total = await productModel.countDocuments();
            const totalPages = Math.ceil(total / limit);

            // Evitar lançamentos de erros desnecessários
            // Ao invés disso, retornar um objeto vazio caso a página
            // esteja fora dos limites.
            if (page > totalPages) {
                return { products: [], total: 0, page, limit };
            }

            // Buscar produtos com lean para performance
            const products = await productModel.find().limit(limit).skip(skip).lean();

            return {
                products,
                total,
                page,
                limit
            };
        } catch (error) {
            console.log(error);
            throw error;
        }
    }


    // Função para buscar um produto pelo ID
    // Este codigo foi otimizado
    async function findById(id) {
        const product = await productModel.findById(id).lean();
        if (!product) throw new NotFoundError("Product not found");
        return product;
    }


    // Função para remover um produto pelo ID
    // Este codigo foi otimizado
    async function removeProductById(id) {
        const product = await productModel.findByIdAndDelete(id);
        if (!product) throw new NotFoundError("Product not found");
        return product;
    }



    return service
}

module.exports = productService;
