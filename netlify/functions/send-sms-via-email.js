const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  console.log('Function invoked');

  const name = 'Test User';
  const message = 'Testing SMS';

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
    console.log('SMS sent successfully');
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'SMS sent via email' })
    };
  } catch (error) {
    console.log('Failed to send SMS:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send SMS: ' + error.message })
    };
  }
};
