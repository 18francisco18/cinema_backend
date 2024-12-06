const Product = require('../../products/product');
const User = require('../../users/user');
const {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ServiceUnavailableError,
  PaymentRequiredError,
} = require("../../../AppError");



function promocodeService(promocodeModel) {
    let service = {
        createPromocode,
        findPromocodeById,
        markPromocodeAsInactive,
        markPromocodeAsActive,
        findAllPromocodes,
        updatePromocode,
        deletePromocode,
    }

    async function createPromocode(promocode) {
        try {

            if (promocode.product) {
                const produto = await Product.findById(promocode.product);
                if (!produto) throw new NotFoundError("Produto não encontrado");
            }

            if (promocode.user) {
                const user = await User.findById(promocode.user);
                if (!user) throw new NotFoundError("Usuário não encontrado");
            }

            if (promocode.startDate > promocode.endDate) throw new ValidationError("Data de início não pode ser maior que a data de término");

            if (promocode.maxUsage < 1) throw new ValidationError("O número máximo de usos deve ser maior que 0");

            if (promocode.discount < 0) throw new ValidationError("O desconto não pode ser negativo");
            

            const promo = await promocodeModel.create(promocode);
            await promo.save();

            return promo;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }


    async function findPromocodeById(promocodeId) {
        try {
            const promocode = await promocodeModel.findById(promocodeId);
            if (!promocode) throw new NotFoundError("Promocode não encontrado");
            return promocode;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }


    async function markPromocodeAsInactive(promocodeId) {
        try {
            const promocode = await promocodeModel.findById(promocodeId);
            if (!promocode) throw new NotFoundError("Promocode não encontrado");

            promocode.active = false;
            await promocode.save();
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async function markPromocodeAsActive(promocodeId) {
        try {
            const promocode = await promocodeModel.findById(promocodeId);
            if (!promocode) throw new NotFoundError("Promocode não encontrado");

            promocode.active = true;
            await promocode.save();
        } catch (error) {
            console.log(error);
            throw error;
        }
    }


    async function findAllPromocodes() {
        try {
            const promocodes = await promocodeModel.find({});
            return promocodes;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async function updatePromocode(promocodeId, promocodeData) {
        try {
            const promocode = await promocodeModel.findById(promocodeId);
            if (!promocode) throw new NotFoundError("Promocode não encontrado");

            if (promocodeData.startDate > promocodeData.endDate) throw new ValidationError("Data de início não pode ser maior que a data de término");

            if (promocodeData.maxUsage < 1) throw new ValidationError("O número máximo de usos deve ser maior que 0");

            if (promocodeData.discount < 0) throw new ValidationError("O desconto não pode ser negativo");

            Object.assign(promocode, promocodeData);
            await promocode.save();
            return promocode;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }


    async function deletePromocode(promocodeId) {
        try {
            const promocode = await promocodeModel.findByIdAndDelete(promocodeId);
            if (!promocode) throw new NotFoundError("Promocode não encontrado");
            return "Promocode deleted";
        }
        catch (error) {
            console.log(error);
            throw error;
        }
    }






    return service;
}


module.exports = promocodeService;