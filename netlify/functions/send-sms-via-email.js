const nodemailer = require('nodemailer');
const axios = require('axios');
const querystring = require('querystring');
const Busboy = require('busboy');

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

  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
  let formData = {};

  try {
    if (contentType.includes('multipart/form-data')) {
      // Use Busboy for reliable multipart parsing
      const busboy = Busboy({ headers: event.headers });
      const body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : Buffer.from(event.body);

      await new Promise((resolve, reject) => {
        busboy.on('field', (name, value) => {
          formData[name] = value.trim();
        });
        busboy.on('finish', resolve);
        busboy.on('error', reject);
        busboy.write(body);
        busboy.end();
      });
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const body = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
      formData = querystring.parse(body);
    } else if (contentType.includes('application/json')) {
      const body = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
      formData = JSON.parse(body);
    } else {
      console.log('Unexpected content type:', contentType);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Unsupported content type' })
      };
    }
  } catch (error) {
    console.log('Form parsing error:', error.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Failed to parse form data: ' + error.message })
    };
  }

  console.log('Parsed formData:', JSON.stringify(formData, null, 2));

  const { name = 'Unknown', email = 'No email', phone = 'No phone', message = 'No message', 'g-recaptcha-response': recaptchaResponse } = formData;

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
    if (!recaptchaSecret) {
      console.log('RECAPTCHA_SECRET_KEY environment variable not set');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'reCAPTCHA secret key is missing' })
      };
    }
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
    to: ['3364806151@vtext.com', '3365750965@tmomail.net'], // Verizon and T-Mobile gateways
    subject: 'ES Lawn Care Inquiry',
    text: `Inquiry from ${name} (${email}, ${phone}): ${message}`
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
    // Fallback: Log to Netlify Functions log for manual review
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send SMS: ' + error.message })
    };
  }
};
