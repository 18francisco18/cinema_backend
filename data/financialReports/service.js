const internalPaymentReport = require('./internalPaymentReport');
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const nodeMailer = require("nodemailer");
const { ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError, DatabaseError, ServiceUnavailableError } = require('../../AppError');

const transporter = nodeMailer.createTransport({
  service: "outlook",
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Serviço responsável por gerenciar os relatórios financeiros.
 */
function financialReportsService(financialReportsModel) {
  let service = {
    createInternalPaymentReport,
    save,
    createSimplePaymentReport,
    /*findAllInternalPaymentReports,
        findInternalPaymentReportById,*/
  };

  // Criar PDF de um relatório de venda interno.
  async function createInternalPaymentReport(internalPaymentReport) {
    let pdfPath = null;
    try {
      // Criar o caminho para a pasta de relatórios
      const reportsPath = path.join(
        process.cwd(), // Usa o diretório atual do projeto
        "relatorios_vendas"
      );

      // Verificar se a pasta 'relatorios_vendas' existe; caso contrário, criá-la
      if (!fs.existsSync(reportsPath)) {
        fs.mkdirSync(reportsPath, { recursive: true });
      }

      // Gerar o caminho completo para o arquivo PDF
      pdfPath = path.join(
        reportsPath,
        `payment_report_${internalPaymentReport.paymentId}.pdf`
      );

      console.log('Gerando PDF em:', pdfPath);

      // Criar o PDF do relatório
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // Criar write stream e pipe
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Layout do cabeçalho com logo e título lado a lado
      const logoPath = path.join(process.cwd(), "assets", "logoCinemaClub.jpeg");
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 50, {
          fit: [100, 100]
        });
        doc.font('Helvetica-Bold')
           .fontSize(25)
           .text("Relatório de Pagamento", 170, 85);
      } else {
        doc.font('Helvetica-Bold')
           .fontSize(25)
           .text("Relatório de Pagamento", { align: "center" });
      }

      // Linha decorativa abaixo do cabeçalho
      doc.moveTo(50, 170)
         .lineTo(545, 170)
         .stroke();

      // Mover para a posição inicial do conteúdo
      doc.y = 200;

      // Função auxiliar para adicionar campos
      function addField(label, value) {
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .text(label + ":", { continued: true })
           .font('Helvetica')
           .text(" " + value);
        doc.moveDown(0.5);
      }

      // Informações do Relatório
      addField("ID do Pagamento", internalPaymentReport.paymentId || "Aguardando confirmação");
      addField("Nome do Cliente", internalPaymentReport.customerName);
      addField("Email do Cliente", internalPaymentReport.customerEmail);
      addField("Valor", `${internalPaymentReport.amount} ${internalPaymentReport.currency.toUpperCase()}`);
      addField("Método de Pagamento", internalPaymentReport.paymentMethod);
      addField("Data de Criação", new Date(internalPaymentReport.created_at).toLocaleDateString());

      // Linha decorativa final
      doc.moveDown();
      doc.moveTo(50, doc.y)
         .lineTo(545, doc.y)
         .stroke();

      // Finalizar o documento e esperar o stream terminar
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
        doc.end();
      });

      console.log('PDF gerado com sucesso em:', pdfPath);
      return pdfPath;

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
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

    async function createSimplePaymentReport(simplePaymentReport) {
      try {
        // Criar o caminho para a pasta de relatórios
        const reportsPath = path.join(
          process.cwd(), // Usa o diretório atual do projeto
          "relatorios_pagamentos"
        );

        // Verificar se a pasta 'relatorios_pagamentos' existe; caso contrário, criá-la
        if (!fs.existsSync(reportsPath)) {
          fs.mkdirSync(reportsPath, { recursive: true }); // 'recursive: true' para criar subdiretórios, se necessário
        }

        // Gerar o caminho completo para o arquivo PDF
        const pdfPath = path.join(
          reportsPath,
          `payment_report_${simplePaymentReport.paymentId}.pdf`
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
          .text(` ${simplePaymentReport.paymentId}`, { underline: false });
        doc.moveDown(0.5);

        doc
          .fontSize(14)
          .text(`Número da fatura:`, { continued: true, underline: true })
          .text(` ${simplePaymentReport.receipetNumber.Math(random())}`, { underline: false });
        doc.moveDown(0.5);

        doc
          .fontSize(14)
          .text(`Reserva:`, { continued: true, underline: true })
          .text(` ${simplePaymentReport.booking}`, { underline: false });
        doc.moveDown(0.5);

        doc
          .fontSize(14)
          .text(`Nome do Cliente:`, { continued: true, underline: true })
          .text(` ${simplePaymentReport.customerName}`, {
            underline: false,
          });
        doc.moveDown(0.5);

        doc
          .fontSize(14)
          .text(`Email do Cliente:`, { continued: true, underline: true })
          .text(` ${simplePaymentReport.customerEmail}`, {
            underline: false,
          });
        doc.moveDown(0.5);

        doc
          .fontSize(14)
          .text(`Valor:`, { continued: true, underline: true })
          .text(
            ` ${
              simplePaymentReport.amountPaid
            } ${simplePaymentReport.currency.toUpperCase()}`,
            { underline: false }
          );
        doc.moveDown(0.5);

        doc
          .fontSize(14)
          .text(`Método de Pagamento:`, { continued: true, underline: true })
          .text(` ${simplePaymentReport.paymentMethod}`, {
            underline: false,
          });
        doc.moveDown(0.5);

        doc
          .fontSize(14)
          .text(`Data de Criação:`, { continued: true, underline: true })
          .text(` ${simplePaymentReport.issuedAt}`, {
            underline: false,
          });
        doc.moveDown(0.5);

        // Rodapé
        doc.moveDown(2);
        doc.fontSize(10).text("Este é um relatório gerado automaticamente.", {
          align: "center",
          italic: true,
        });

        // Finalizar o documento e retornar uma Promise
        return new Promise((resolve, reject) => {
          // Quando o stream terminar, resolver a Promise com o caminho do arquivo
          stream.on('finish', () => {
            resolve(pdfPath);
          });

          // Se houver erro, rejeitar a Promise
          stream.on('error', reject);

          // Finalizar o documento
          doc.end();
        });
      } catch (error) {
          console.log(error);
          throw new DatabaseError(`Error creating simple payment report`);
      }
    }

  return service;
}

module.exports = financialReportsService;