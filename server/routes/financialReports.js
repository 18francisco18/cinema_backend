const express = require('express');
const router = express.Router();
const financialReportController = require('../../data/financialReports/controller');

router.post('/internal', async (req, res, next) => {
  try {
    await financialReportController.createInternalPaymentReport(req.body);
    res.status(201).json({ message: 'Relatório criado com sucesso' });
  } catch (error) {
    next(error);
  }
});

router.post('/simple', async (req, res, next) => {
  try {
    await financialReportController.createSimplePaymentReport(req.body);
    res.status(201).json({ message: 'Relatório simples criado com sucesso' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
