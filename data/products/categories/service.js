const AppError = require('../../AppError');
const { ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError, DatabaseError, ServiceUnavailableError } = require('../../../AppError');


function categoryService(categoryModel) {
    let service = {
        create,
        save,
        findAll,
        findById,
        removeCategoryById,
    }

    // Função para criar uma nova categoria
    // Este codigo foi otimizado
    async function create(category) {
        try {
            let newCategory = new categoryModel(category);

            // Campos obrigatórios dentro de um array
            const requiredFields = ["name"];

            // Verifica se todos os campos obrigatórios foram preenchidos
            const missingFields = requiredFields.filter(field => !newCategory[field]);

            if (missingFields.length > 0) {
                throw new ValidationError(`Campos ausentes: ${missingFields.join(", ")}`);
            }

            const categoryExists = await categoryModel.findOne({ name: newCategory.name });
            if (categoryExists) {
                throw new ConflictError("A categoria já existe");
            }

            return await save(newCategory);
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
            .catch((err) => reject(`Houve um problema ao criar a categoria ${err}`));
        });
    }

    // Função para buscar todos os produtos
    // Este codigo foi otimizado
    async function findAll(page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;

            // Calcular o total de documentos primeiro e validar o número de página
            const total = await categoryModel.countDocuments();
            const totalPages = Math.ceil(total / limit);

            // Evitar lançamentos de erros desnecessários
            // Ao invés disso, retornar um objeto vazio caso a página
            // esteja fora dos limites.
            if (page > totalPages) {
                return { products: [], total: 0, page, limit };
            }

            // Buscar produtos com lean para performance
            const categories = await categoryModel.find().limit(limit).skip(skip).lean();

            return {
                categories,
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
    async function findById(id) {
        const category = await categoryModel.findById(id).lean();
        if (!category) throw new NotFoundError("Categoria não encontrada");
        return category;
    }

    // Função para remover uma categoria pelo ID
    async function removeCategoryById(id) {
        const category = await categoryModel.findByIdAndDelete(id);
        if (!category) throw new NotFoundError("Categoria não encontrada");
        return category;
    }


    return service
}

module.exports = categoryService;