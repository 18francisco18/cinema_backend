const internalPaymentReport = require('./internalPaymentReport');

function financialReportsService(financialReportsModel) {
    let service = {
        createInternalPaymentReport,
        save,
        findAllInternalPaymentReports,
        findInternalPaymentReportById,
    };

    async function createInternalPaymentReport(internalPaymentReport) {
        try {
            let newInternalPaymentReport = new financialReportsModel(internalPaymentReport);
            return await save(newInternalPaymentReport);
        } catch (error) {
            console.log(error);
            throw new Error(`Check for missing fields or wrong fields`);
        }
    }

    async function save(model) {
        return new Promise(function (resolve, reject) {
            model
                .save()
                .then(() => resolve(model))
                .catch((err) => reject(`Houve um problema ao criar o relatório financeiro ${err}`));
        });
    }

    async function findAllInternalPaymentReports() {
        try {
            return await financialReportsModel.find({});
        } catch (error) {
            console.log(error);
            throw new Error(`Erro ao buscar relatórios financeiros: ${error.message}`);
        }
    }

    async function findInternalPaymentReportById(id) {
        try {
            return await financialReportsModel.findById(id);
        } catch (error) {
            console.log(error);
            throw new Error(`Internal payment report not found`);
        }
    }



    return service;
}

module.exports = financialReportsService;