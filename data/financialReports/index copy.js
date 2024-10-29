const internalPaymentReport = require('./internalPaymentReport');
const internalPaymentReportService = require('./service');

const internalPaymentReportServiceInstance = internalPaymentReportService(internalPaymentReport);
module.exports = internalPaymentReportServiceInstance;