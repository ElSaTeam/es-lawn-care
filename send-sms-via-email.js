const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  const { name, message } = JSON.parse(event.body).payload.data;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: '3364806151@vtext.com',
    subject: 'ES Lawn Care Inquiry',
    text: `Inquiry: ${name}, ${message}`
  };

  try {
    await transporter.sendMail(mailOptions);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'SMS sent via email' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send SMS' })
    };
  }
};