const express = require('express');
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.post('/send-email', async (req, res) => {
  const { to, subject, body, config } = req.body;
  const timestamp = new Date().toISOString();

  console.log('\n========================================');
  console.log(`[${timestamp}] Email Request Received`);
  console.log('----------------------------------------');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Service: ${config.EMAIL_SERVICE}`);
  console.log(`Body Length: ${body?.length || 0} characters`);
  console.log('========================================\n');

  try {
    // ============ GMAIL ============
    if (config.EMAIL_SERVICE === 'gmail') {
      console.log(`[${timestamp}] Initializing Gmail transporter...`);
      console.log(`Gmail User: ${config.GMAIL.user}`);

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.GMAIL.user,
          pass: config.GMAIL.appPassword.replace(/\s/g, ''),
        },
      });

      console.log(`[${timestamp}] Sending email via Gmail...`);
      await transporter.sendMail({
        from: config.GMAIL.user,
        to,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
      });

      console.log(`[${timestamp}] ✓ Email sent successfully via Gmail to ${to}`);
      return res.json({ success: true, message: 'Email sent via Gmail' });
    }

    // ============ SENDGRID ============
    if (config.EMAIL_SERVICE === 'sendgrid') {
      console.log(`[${timestamp}] Initializing SendGrid...`);
      console.log(`SendGrid From: ${config.SENDGRID.fromEmail}`);

      sgMail.setApiKey(config.SENDGRID.apiKey);

      console.log(`[${timestamp}] Sending email via SendGrid...`);
      await sgMail.send({
        to,
        from: config.SENDGRID.fromEmail,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
      });

      console.log(
        `[${timestamp}] ✓ Email sent successfully via SendGrid to ${to}`
      );
      return res.json({ success: true, message: 'Email sent via SendGrid' });
    }

    // ============ SMTP ============
    if (config.EMAIL_SERVICE === 'smtp') {
      console.log(`[${timestamp}] Initializing SMTP transporter...`);
      console.log(`SMTP Host: ${config.SMTP.host}:${config.SMTP.port}`);
      console.log(`SMTP Secure: ${config.SMTP.secure}`);
      console.log(`SMTP User: ${config.SMTP.user}`);

      const transporter = nodemailer.createTransport({
        host: config.SMTP.host,
        port: config.SMTP.port,
        secure: config.SMTP.secure,
        auth: {
          user: config.SMTP.user,
          pass: config.SMTP.password,
        },
      });

      console.log(`[${timestamp}] Sending email via SMTP...`);
      await transporter.sendMail({
        from: config.SMTP.user,
        to,
        subject,
        text: body,
        html: body.replace(/\n/g, '<br>'),
      });

      console.log(`[${timestamp}] ✓ Email sent successfully via SMTP to ${to}`);
      return res.json({ success: true, message: 'Email sent via SMTP' });
    }

    // If EMAIL_SERVICE is something else
    return res
      .status(400)
      .json({ success: false, message: 'Invalid EMAIL_SERVICE in config' });
  } catch (error) {
    console.error('\n========================================');
    console.error(`[${timestamp}] ✗ Email Sending Failed`);
    console.error('----------------------------------------');
    console.error(`Service: ${config.EMAIL_SERVICE}`);
    console.error(`To: ${to}`);
    console.error(`Subject: ${subject}`);
    console.error(`Error Message: ${error.message}`);
    console.error('Error Stack:', error.stack);
    console.error('========================================\n');

    return res.json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});