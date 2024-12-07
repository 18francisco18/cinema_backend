const promocodeService = require('../promocodes');


const promocodeController = {
    createPromocode,
    findPromocodeById,
    markPromocodeAsInactive,
    markPromocodeAsActive,
    findAllPromocodes,
    updatePromocode,
    deletePromocode,
}


async function createPromocode(req, res, next) {
    try {
        const promocode = req.body;
        const newPromocode = await promocodeService.createPromocode(promocode);
        res.status(201).json(newPromocode);
    } catch (error) {
        next();
    }
}

async function findPromocodeById(req, res, next) {
    try {
        const { id } = req.params;
        const promocode = await promocodeService.findPromocodeById(id);
        res.status(200).json(promocode);
    } catch (error) {
        next();
    }
}

async function markPromocodeAsInactive(req, res, next) {
    try {
        const { id } = req.params;
        await promocodeService.markPromocodeAsInactive(id);
        res.status(204).end();
    } catch (error) {
        next();
    }
}

async function markPromocodeAsActive(req, res, next) {
    try {
        const { id } = req.params;
        await promocodeService.markPromocodeAsActive(id);
        res.status(204).end();
    } catch (error) {
        next();
    }
}

async function findAllPromocodes(req, res, next) {
    try {
        const promocodes = await promocodeService.findAllPromocodes();
        res.status(200).json(promocodes);
    } catch (error) {
        next();
    }
}

async function updatePromocode(req, res, next) {
    try {
        const { id } = req.params;
        const promocode = req.body;
        const updatedPromocode = await promocodeService.updatePromocode(id, promocode);
        res.status(200).json(updatedPromocode);
    } catch (error) {
        next();
    }
}

async function deletePromocode(req, res, next) {
    try {
        const { id } = req.params;
        await promocodeService.deletePromocode(id);
        res.status(204).end();
    } catch (error) {
        next();
    }
}

module.exports = promocodeController;