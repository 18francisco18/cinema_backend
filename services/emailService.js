const sgMail = require('@sendgrid/mail');
const fs = require('fs').promises;
const path = require('path');

// Configurar API key do SendGrid
if (!process.env.SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY não está definida no arquivo .env');
  throw new Error('SENDGRID_API_KEY não configurada');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendBookingConfirmationEmail = async (booking, qrCodeDataUrl, reportPath) => {
  try {
    // Garantir que temos todos os dados necessários
    if (!booking?.session?.movie?.title) {
      console.error('Dados do filme não encontrados no booking');
      throw new Error('Dados do filme não encontrados');
    }

    if (!process.env.EMAIL_FROM) {
      console.error('EMAIL_FROM não está definido no arquivo .env');
      throw new Error('EMAIL_FROM não configurado');
    }

    // Converter data URL para base64 removendo o prefixo
    const base64QRCode = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');

    const msg = {
      to: booking.user.email,
      from: process.env.EMAIL_FROM,
      subject: 'Confirmação de Reserva - Cinema',
      text: `Olá ${booking.user.name}! Sua reserva foi confirmada para ${booking.seats.length} lugar(es). Por favor, verifique o QR Code anexado.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Confirmação de Reserva</h2>
          <p>Olá ${booking.user.name}!</p>
          <p>Sua reserva foi confirmada com sucesso. Aqui estão os detalhes:</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Detalhes da Reserva:</h3>
            <p><strong>Filme:</strong> ${booking.session.movie.title}</p>
            <p><strong>Data:</strong> ${new Date(booking.session.date).toLocaleDateString()}</p>
            <p><strong>Horário:</strong> ${new Date(booking.session.startTime).toLocaleTimeString()}</p>
            <p><strong>Lugares:</strong> ${booking.seats.join(', ')}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p><strong>Seu QR Code para entrada:</strong></p>
            <p>O QR Code está anexado a este email.</p>
          </div>

          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Instruções:</h3>
            <ol style="margin: 0; padding-left: 20px;">
              <li>Chegue com 15 minutos de antecedência</li>
              <li>Apresente este QR Code na entrada da sala</li>
              <li>Mantenha este email salvo ou faça um screenshot do QR Code</li>
            </ol>
          </div>

          <p style="color: #666; font-size: 14px;">Se tiver alguma dúvida, entre em contato conosco.</p>
        </div>
      `,
      attachments: [
        {
          content: base64QRCode,
          filename: 'qrcode.png',
          type: 'image/png',
          disposition: 'attachment',
          content_id: 'qrcode'
        }
      ]
    };

    console.log('Enviando email para:', booking.user.email);
    await sgMail.send(msg);
    console.log('Email enviado com sucesso para:', booking.user.email);
  } catch (error) {
    console.error('Erro ao enviar email:', error.response?.body || error);
    throw error;
  }
};

module.exports = {
  sendBookingConfirmationEmail
};
