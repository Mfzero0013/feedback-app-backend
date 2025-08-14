const nodemailer = require('nodemailer');



// Configura o transporter usando as variáveis de ambiente
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envia um email.
 * @param {string} to - O endereço de e-mail do destinatário.
 * @param {string} subject - O assunto do e-mail.
 * @param {string} html - O corpo do e-mail em HTML.
 */
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM, // Endereço do remetente
      to: to,                      // Destinatário
      subject: subject,              // Assunto
      html: html,                  // Corpo em HTML
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    // Lança o erro para que a função que chamou possa tratá-lo
    throw new Error('O e-mail não pôde ser enviado.');
  }
};

module.exports = sendEmail;