const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  console.log('Event body:', event.body);
  console.log('Content-Type:', event.headers['content-type']);

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No event body received' })
    };
  }

  let name, message;

  // Handle URL-encoded form data
  if (event.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(event.body);
    name = params.get('name');
    message = params.get('message');
  } else {
    // Log unexpected content type for debugging
    console.log('Unexpected content type:', event.headers['content-type']);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Unsupported content type: ' + event.headers['content-type'] })
    };
  }

  if (!name || !message) {
    console.log('Missing name or message:', { name, message });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing name or message' })
    };
  }

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
    console.log('Failed to send SMS:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send SMS: ' + error.message })
    };
  }
};
