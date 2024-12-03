const financialReport = require('../financialReports');


const financialReportController = {
    createInternalPaymentReport,
    createSimplePaymentReport,
    /*findInternalPaymentReport,
    findInternalPaymentReports,*/
}

async function createInternalPaymentReport(internalPaymentReport) {
  try {
    await financialReport.createInternalPaymentReport(internalPaymentReport);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

async function createSimplePaymentReport(simplePaymentReport) {
  try {
    await financialReport.createSimplePaymentReport(simplePaymentReport);
  } catch (error) {
    console.log(error);
    throw error;
  }
}

/*async function findInternalPaymentReport(id) {
  try {
    return await financialReport.findInternalPaymentReportById(id);
  } catch (error) {
    console.log(error);
  }
}

async function findInternalPaymentReports() {
  try {
    return await financialReport.findAllInternalPaymentReports();
  } catch (error) {
    console.log(error);
  }
}*/

module.exports = financialReportController;