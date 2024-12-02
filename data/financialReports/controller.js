const financialReport = require('../financialReports');

const financialReportController = {
    createInternalPaymentReport,
    createSimplePaymentReport,
}

async function createInternalPaymentReport(internalPaymentReport) {
  try {
    await financialReport.createInternalPaymentReport(internalPaymentReport);
  } catch (error) {
    console.error('Erro ao criar relatório:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

async function createSimplePaymentReport(simplePaymentReport) {
  try {
    await financialReport.createSimplePaymentReport(simplePaymentReport);
  } catch (error) {
    console.error('Erro ao criar relatório simples:', error);
    throw error;
  }
}

module.exports = financialReportController;