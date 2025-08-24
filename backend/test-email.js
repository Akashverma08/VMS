// test-email.js
const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('Testing SMTP configuration...');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ SMTP Connection failed:');
    console.log('Error:', error.message);
    console.log('Code:', error.code);
    console.log('Command:', error.command);
  } else {
    console.log('✅ SMTP Server is ready to send emails');
    
    // Test sending an email
    transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: process.env.SMTP_USER, // Send to yourself
      subject: 'Test Email from Visitor System',
      text: 'This is a test email from your visitor management system.'
    }, (err, info) => {
      if (err) {
        console.log('❌ Test email failed:', err.message);
      } else {
        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
      }
      process.exit(0);
    });
  }
});