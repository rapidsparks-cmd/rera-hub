const nodemailer = require('nodemailer');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter your Gmail address: ', (email) => {
  rl.question('Enter your Gmail App Password (16 characters): ', (password) => {
    rl.close();

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: email.trim(),
        pass: password.replace(/\s+/g, '').trim(),
      },
      tls: {
        rejectUnauthorized: false
      },
      family: 4
    });

    const mailOptions = {
      from: `"RERA Hub Test" <${email}>`,
      to: 'shiftlogiciq@gmail.com',
      subject: 'Nodemailer Local Host Simulation Test',
      text: 'Congratulations! The RERA Hub local host SMTP email configuration is working perfectly over IPv4 secure SSL.'
    };

    console.log('\nConnecting to Gmail SMTP server on port 465 over IPv4...');
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('\n❌ SMTP Connection failed!');
        console.error(error);
      } else {
        console.log('\n✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Please check your inbox at shiftlogiciq@gmail.com.');
      }
    });
  });
});
