const AppError = require('../../AppError');
const { ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError, DatabaseError, ServiceUnavailableError } = require('../../AppError');
const Category = require('./categories/category');
const dotenv = require('dotenv');
dotenv.config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

function productService(productModel) {
    let service = {
        createProduct,
        save,
        findAll,
        findById,
        updateProduct,
        removeProductById,
    };


    async function createProduct(productData) {
        try {
            // 1. Verificar se um produto com o mesmo nome já existe no banco de dados
            const existingProduct = await productModel.findOne({ name: productData.name });
            if (existingProduct) {
                throw new ConflictError("Um produto com o mesmo nome já existe.");
            }

            // 2. Criar o produto no Stripe
            const stripeProduct = await stripe.products.create({
                name: productData.name,
                description: productData.description,
                images: productData.image ? [productData.image] : [],
            });

            // 3. Criar o preço no Stripe
            const stripePrice = await stripe.prices.create({
                unit_amount: productData.price * 100, // o preço deve ser em centavos
                currency: 'eur', // defina a moeda conforme necessário
                product: stripeProduct.id,
            });

            // 4. Salvar o produto no banco de dados
            const productMongoose = new productModel({
                name: productData.name,
                description: productData.description,
                price: productData.price,
                stripeProductId: stripeProduct.id,
                stripePriceId: stripePrice.id,
                category: productData.category,
                image: productData.image,
                stock: productData.stock ?? true,
            });
            await save(productMongoose);

            return { stripeProduct, stripePrice, productMongoose };
        } catch (error) {
            console.error("Erro ao criar o produto:", error);
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

    async function updateProduct(id, productData) {
        const product = await productModel.findById(id);
        if (!product) throw new NotFoundError("Product not found");

        // Atualizar o produto no Stripe
        const stripeProduct = await stripe.products.update(product.stripeProductId, {
            name: productData.name,
            description: productData.description,
            images: productData.image ? [productData.image] : [],
        });


        // Atualizar o preço no Stripe caso o preço tenha sido alterado
        if (productData.price) {
            await Promise.all([
                stripe.prices.del(product.stripePriceId),
                stripe.prices.create({
                    unit_amount: productData.price * 100,
                    currency: 'eur',
                    product: stripeProduct.id,
                })
            ]);
        }


        // Atualizar o produto no banco de dados
        product.name = productData.name;
        product.description = productData.description;
        product.price = productData.price;
        product.category = productData.category;
        product.image = productData.image;
        product.stock = productData.stock ?? true;
        await save(product);

        return product;
    }


    // Função para remover um produto pelo ID
    async function removeProductById(id) {
        const product = await productModel.findByIdAndDelete(id);
        if (!product) throw new NotFoundError("Product not found");

        const stripeDeleteProduct = await stripe.products.del(product.stripeProductId);
        if (!stripeDeleteProduct) throw new ServiceUnavailableError("Não foi possível deletar o produto no Stripe");

        const stripeDeletePrice = await stripe.prices.del(product.stripePriceId);
        if (!stripeDeletePrice) throw new ServiceUnavailableError("Não foi possível deletar o preço no Stripe");


        return product;
    }



    return service
}

module.exports = productService;
