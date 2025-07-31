const nodemailer = require('nodemailer');
const axios = require('axios');
const querystring = require('querystring');
const Busboy = require('busboy');

exports.handler = async (event) => {
  console.log('Full event:', JSON.stringify(event, null, 2)); // Keep for debugging, but sanitize in production
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

  // Sanitize logs to avoid PII exposure
  console.log('Parsed formData (sanitized):', JSON.stringify({
    name: formData.name ? '[REDACTED]' : 'Unknown',
    email: formData.email ? '[REDACTED]' : 'No email',
    phone: formData.phone ? '[REDACTED]' : 'No phone',
    message: formData.message ? '[REDACTED]' : 'No message'
  }, null, 2));

  const { name = 'Unknown', email = 'No email', phone = 'No phone', message = 'No message', 'g-recaptcha-response': recaptchaResponse, honeypot = '' } = formData;

  // Honeypot check: If filled (by bots), reject
  if (honeypot) {
    console.log('Honeypot triggered');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid submission' })
    };
  }

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

  const inquiryText = `Inquiry from ${name} (${email}, ${phone}): ${message}`;

  const mailOptionsToOwner = {
    from: process.env.EMAIL_USER,
    to: ['3364806151@vtext.com', '3365750965@tmomail.net'], // Verizon and T-Mobile gateways
    subject: 'ES Lawn Care Inquiry',
    text: inquiryText
  };

  const mailOptionsToUser = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Thank You for Your Inquiry - ES Lawn Care',
    text: `Hi ${name},\n\nThank you for reaching out! We've received your message: "${message}". We'll get back to you soon.\n\nBest,\nES Lawn Care Team`
  };

  try {
    await transporter.sendMail(mailOptionsToOwner);
    if (email !== 'No email') {
      await transporter.sendMail(mailOptionsToUser);
    }
    console.log('SMS and confirmation sent successfully');
    return {
      statusCode: 200,
      headers: { 'Location': '/thank-you.html' }, // Redirect to thank-you page
      body: JSON.stringify({ message: 'Inquiry sent successfully' })
    };
  } catch (error) {
    console.log('Failed to send inquiry:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to send inquiry: ' + error.message })
    };
  }
};
