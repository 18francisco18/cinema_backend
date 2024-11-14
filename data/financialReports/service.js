const internalPaymentReport = require('./internalPaymentReport');
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError, DatabaseError, ServiceUnavailableError } = require('../../AppError');

function financialReportsService(financialReportsModel) {
  let service = {
    createInternalPaymentReport,
    save,
    /*findAllInternalPaymentReports,
        findInternalPaymentReportById,*/
  };

  // Criar PDF de um relatório de venda interno.
  async function createInternalPaymentReport(internalPaymentReport) {
    try {
      const reportsPath = path.join(
        "C:",
        "Users",
        "Rui Barbosa",
        "Desktop",
        "relatorios_vendas"
      );

      // Verificar se a pasta 'relatorios_vendas' existe; caso contrário, criá-la
      if (!fs.existsSync(reportsPath)) {
        fs.mkdirSync(reportsPath, { recursive: true }); // 'recursive: true' para criar subdiretórios, se necessário
      }

      // Gerar o caminho completo para o arquivo PDF
      const pdfPath = path.join(
        reportsPath,
        `payment_report_${internalPaymentReport.paymentId}.pdf`
      );

      // Criar o PDF do relatório
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(pdfPath);

      // Adicionar conteúdo ao PDF
      doc.pipe(stream);
      doc.fontSize(25).text("Relatório de Pagamento", { align: "center" });
      doc.moveDown();

      // Informações do Relatório
      doc
        .fontSize(14)
        .text(`ID do Pagamento:`, { continued: true, underline: true })
        .text(` ${internalPaymentReport.paymentId}`, { underline: false });
      doc.moveDown(0.5);

      doc
        .fontSize(14)
        .text(`Nome do Cliente:`, { continued: true, underline: true })
        .text(` ${internalPaymentReport.customerName}`, {
          underline: false,
        });
      doc.moveDown(0.5);

      doc
        .fontSize(14)
        .text(`Email do Cliente:`, { continued: true, underline: true })
        .text(` ${internalPaymentReport.customerEmail}`, {
          underline: false,
        });
      doc.moveDown(0.5);

      doc
        .fontSize(14)
        .text(`Valor:`, { continued: true, underline: true })
        .text(
          ` ${
            internalPaymentReport.amount
          } ${internalPaymentReport.currency.toUpperCase()}`,
          { underline: false }
        );
      doc.moveDown(0.5);

      doc
        .fontSize(14)
        .text(`Método de Pagamento:`, { continued: true, underline: true })
        .text(` ${internalPaymentReport.paymentMethod}`, {
          underline: false,
        });
      doc.moveDown(0.5);

      doc
        .fontSize(14)
        .text(`Data de Criação:`, { continued: true, underline: true })
        .text(` ${internalPaymentReport.created_at.toLocaleDateString()}`, {
          underline: false,
        });
      doc.moveDown(0.5);

      // Rodapé
      doc.moveDown(2);
      doc.fontSize(10).text("Este é um relatório gerado automaticamente.", {
        align: "center",
        italic: true,
      });

      doc.end();

      // Esperar o stream do PDF terminar antes de continuar
      await new Promise((resolve, reject) => {
        stream.on("finish", resolve);
        stream.on("error", reject);
      });

      console.log(`PDF gerado e salvo em: ${pdfPath}`);

      let newInternalPaymentReport = new financialReportsModel(
        internalPaymentReport
      );
      return await save(newInternalPaymentReport);
    } catch (error) {
      console.log(error);
      throw new DatabaseError(`Error generating internal payment report`);
    }
  }

  async function save(model) {
    return new Promise(function (resolve, reject) {
      model
        .save()
        .then(() => resolve(model))
        .catch((err) =>
          reject(`Houve um problema ao criar o relatório financeiro ${err}`)
        );
    });
  }

  // REVER FUNÇÃO POIS A MESMA ENTREGA TODOS OS TIPOS DE RELATÓRIO
  /*
    async function findAllInternalPaymentReports() {
        try {
            return await financialReportsModel.find({ type: "internalPaymentReport" });
        } catch (error) {
            console.log(error);
            throw new Error(`Erro ao buscar relatórios financeiros: ${error.message}`);
        }
    }
        

    // REVER FUNÇÃO POIS É POSSIVEL INSERIR UM ID DE OUTRO TIPO DE RELATÓRIO
    async function findInternalPaymentReportById(id) {
        try {
            return await financialReportsModel.findById(id);
        } catch (error) {
            console.log(error);
            throw new Error(`Internal payment report not found`);
        }
    }
        */

  return service;
}

module.exports = financialReportsService;