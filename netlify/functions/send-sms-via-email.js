const nodemailer = require('nodemailer');
const axios = require('axios');

exports.handler = async (event) => {
  console.log('Full event:', JSON.stringify(event, null, 2));
  console.log('HTTP Method:', event.httpMethod);
  console.log('Content-Type:', event.headers['content-type']);
  console.log('Event body (raw):', event.body);

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

  const body = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  console.log('Decoded event body:', body);

  let name, message, recaptchaResponse;

  if (event.headers['content-type']?.includes('multipart/form-data')) {
    try {
      const boundary = event.headers['content-type'].match(/boundary=(.+)/)[1];
      const parts = body.split(`--${boundary}`);
      console.log('Multipart parts:', parts);
      for (const part of parts) {
        if (part.includes('name="name"')) {
          const match = part.match(/name="name"\r\n\r\n([\s\S]*?)(?=\r\n|$)/);
          name = match && match[1] ? match[1].trim() : 'Unknown';
        }
        if (part.includes('name="message"')) {
          const match = part.match(/name="message"\r\n\r\n([\s\S]*?)(?=\r\n|$)/);
          message = match && match[1] ? match[1].trim() : 'No message';
        }
        if (part.includes('name="g-recaptcha-response"')) {
          const match = part.match(/name="g-recaptcha-response"\r\n\r\n([\s\S]*?)(?=\r\n|$)/);
          recaptchaResponse = match && match[1] ? match[1].trim() : '';
        }
      }
    } catch (error) {
      console.log('Multipart parse error:', error.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Failed to parse multipart form data: ' + error.message })
      };
    }
  } else if (event.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(body);
    name = params.get('name') || 'Unknown';
    message = params.get('message') || 'No message';
    recaptchaResponse = params.get('g-recaptcha-response') || '';
  } else if (event.headers['content-type']?.includes('application/json')) {
    try {
      const formData = JSON.parse(body);
      console.log('Parsed formData:', JSON.stringify(formData, null, 2));
      name = formData.name || formData.payload?.data?.name || formData.data?.name || 'Unknown';
      message = formData.message || formData.payload?.data?.message || formData.data?.message || 'No message';
      recaptchaResponse = formData['g-recaptcha-response'] || '';
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

  console.log('Extracted values:', { name, message, recaptchaResponse });

  if (!name || !message) {
    console.log('Missing name or message:', { name, message });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing name or message' })
    };
  }

  if (!recaptchaResponse) {
    console.log('Missing reCAPTCHA response');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'reCAPTCHA response is required' })
    };
  }

  try {
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    const recaptchaVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaResponse}`;
    const recaptchaResult = await axios.post(recaptchaVerifyUrl);
    if (!recaptchaResult.data.success) {
      console.log('reCAPTCHA validation failed:', recaptchaResult.data);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'reCAPTCHA validation failed' })
      };
    }
  } catch (error) {
    console.log('reCAPTCHA verification error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to verify reCAPTCHA: ' + error.message })
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
    to: ['3364806151@vtext.com', '3365750965@tmomail.net'],
    subject: 'ES Lawn Care Inquiry',
    text: `Inquiry: ${name}, ${message}`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('SMS sent successfully to both phones');
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
