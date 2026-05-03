const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendResetEmail(email, token) {
  const resetLink = `${process.env.APP_URL}/auth/nova-senha?token=${token}`;

  await transporter.sendMail({
    from: `"BarberTrack" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Redefinição de senha - BarberTrack",
    html: `
      <p>Olá,</p>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <p>Clique no link abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Se você não solicitou a redefinição, ignore este e-mail.</p>
    `,
  });
}

module.exports = { sendResetEmail };
