const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  console.log('Full event:', JSON.stringify(event, null, 2));
  console.log('HTTP Method:', event.httpMethod);
  console.log('Content-Type:', event.headers['content-type']);
  console.log('Event body:', event.body);

  if (event.httpMethod !== 'POST') {
    console.log('Invalid HTTP method:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  if (!event.body) {
    console.log('No event body received');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No event body received' })
    };
  }

  let name, message;

  if (event.headers['content-type']?.includes('multipart/form-data')) {
  const boundary = event.headers['content-type'].match(/boundary=(.+)/)[1];
  const parts = event.body.split(`--${boundary}`);
  for (const part of parts) {
    if (part.includes('name="name"')) {
      name = part.split('\r\n\r\n')[1]?.split('\r\n')[0]?.trim() || 'Unknown';
    }
    if (part.includes('name="message"')) {
      message = part.split('\r\n\r\n')[1]?.split('\r\n')[0]?.trim() || 'No message';
    }
  }
} else if (event.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(event.body);
    name = params.get('name') || 'Unknown';
    message = params.get('message') || 'No message';
  } else if (event.headers['content-type']?.includes('application/json')) {
    try {
      const formData = JSON.parse(event.body);
      console.log('Parsed formData:', JSON.stringify(formData, null, 2));
      name = formData.name || formData.payload?.data?.name || formData.data?.name || 'Unknown';
      message = formData.message || formData.payload?.data?.message || formData.data?.message || 'No message';
    } catch (error) {
      console.log('JSON parse error:', error.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Failed to parse JSON: ' + error.message })
      };
    }
  } else {
    console.log('Unexpected content type:', event.headers['content-type'] || 'none');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Unsupported content type' })
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
