const financialReport = require('../financialReports');


const financialReportController = {
    createInternalPaymentReport,
}

async function createInternalPaymentReport(internalPaymentReport) {
  try {
    await financialReport.createInternalPaymentReport(internalPaymentReport);
  } catch (error) {
    console.log(error);
  }
}

module.exports = financialReportController;