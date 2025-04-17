const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  // Log the entire event for debugging
  console.log('Full event:', JSON.stringify(event, null, 2));

  // Check if event.body exists
  if (!event.body) {
    console.log('No event body received');
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No event body received' })
    };
  }

  let name, message;

  // Handle different content types
  if (event.headers && event.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
    // Handle URL-encoded form data (Netlify Forms sometimes sends this)
    console.log('Handling URL-encoded form data');
    const params = new URLSearchParams(event.body);
    name = params.get('name');
    message = params.get('message');
  } else {
    // Try parsing as JSON (Netlify Forms typically sends JSON)
    console.log('Attempting to parse event.body as JSON');
    try {
      const formData = JSON.parse(event.body);
      if (formData.payload && formData.payload.data) {
        name = formData.payload.data.name;
        message = formData.payload.data.message;
      } else {
        console.log('No payload.data in formData');
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing payload.data in form submission' })
        };
      }
    } catch (error) {
      console.log('JSON parse error:', error.message);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Failed to parse JSON: ' + error.message })
      };
    }
  }

  // Validate name and message
  if (!name || !message) {
    console.log('Missing name or message:', { name, message });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing name or message in form data' })
    };
  }

  // Send SMS via email
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
    console.log('Sending SMS via email to:', mailOptions.to);
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
