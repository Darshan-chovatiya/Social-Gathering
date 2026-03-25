const nodemailer = require('nodemailer');
const path = require('path');
const config = require('../config/env');
const logger = require('../config/logger');

/**
 * Mailer Utility
 */
class Mailer {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT,
      secure: config.EMAIL_PORT == 465, // true for 465, false for other ports
      auth: {
        user: config.EMAIL_USER,
        pass: config.EMAIL_PASS,
      },
    });
  }

  /**
   * Send Registration Email to Organizer
   * @param {Object} organizer - Organizer details
   * @param {string} password - Plain text password
   */
  async sendOrganizerRegistrationEmail(organizer, password) {
    const loginUrl = config.ORGANIZER_PANEL_URL || config.FRONTEND_URL;
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Easy Tickets</title>
      <style>
        body {
          font-family: 'Segoe UI', Inter, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f7f9;
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }
        .container {
          width: 95% !important;
          max-width: 600px;
          margin: 20px auto;
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }
        .header {
          background: linear-gradient(135deg, #d11e4f, #9a1637);
          padding: 30px 20px;
          text-align: center;
        }
        .header-content {
          margin: 0 auto;
          max-width: 100%;
        }
        .header img {
          max-width: 60px;
          height: auto;
          display: block;
          margin: 0 auto 15px auto;
        }
        .header h1 {
          margin: 0;
          padding: 0 10px;
          font-size: 24px;
          letter-spacing: 0.5px;
          font-weight: bold;
          color: #ffffff;
          line-height: 1.2;
          display: block;
          word-break: break-word;
        }
        .content {
          padding: 40px 30px;
        }
        .welcome-msg {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 20px;
          color: #1e293b;
        }
        .credentials-box {
          background-color: #fff5f7;
          border: 1px solid #fbd1d9;
          border-radius: 10px;
          padding: 25px;
          margin: 30px 0;
        }
        /* ... existing styles ... */
        @media only screen and (max-width: 600px) {
          .container {
            width: 100% !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          .content {
            padding: 30px 20px !important;
          }
          .header {
            padding: 35px 15px !important;
          }
          .header h1 {
            font-size: 22px !important;
          }
          .welcome-msg {
            font-size: 18px !important;
          }
          .btn {
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 15px 20px !important;
          }
        }
        .credential-item {
          margin-bottom: 15px;
        }
        .credential-label {
          font-weight: bold;
          color: #9a1637;
          font-size: 12px;
          text-transform: uppercase;
          display: block;
          margin-bottom: 5px;
        }
        .credential-value {
          font-size: 16px;
          color: #1e293b;
          word-break: break-all;
        }
        .btn-container {
          text-align: center;
          margin-top: 30px;
        }
        .btn {
          background: #d11e4f;
          color: #ffffff;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          display: inline-block;
          transition: background 0.3s ease;
        }
        .btn:hover {
          background: #b81a42;
        }
        .footer {
          background-color: #f8fafc;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
        }
        .social-links {
          margin-top: 10px;
        }
        .social-links a {
          margin: 0 10px;
          color: #94a3b8;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-content">
            <img src="cid:logo" alt="Easy Tickets Logo">
            <h1>Welcome to Easy Tickets!</h1>
          </div>
        </div>
        <div class="content">
          <p class="welcome-msg">Hi ${organizer.name},</p>
          <p>Congratulations! Your organizer account has been successfully created. You can now start managing your events, tracking bookings, and growing your audience through the Easy Tickets Organizer Panel.</p>
          
          <div class="credentials-box">
            <div class="credential-item">
              <span class="credential-label">Login URL</span>
              <span class="credential-value">${loginUrl}</span>
            </div>
            <div class="credential-item">
              <span class="credential-label">Email Address</span>
              <span class="credential-value">${organizer.email}</span>
            </div>
            <div class="credential-item">
              <span class="credential-label">Password</span>
              <span class="credential-value" style="font-family: monospace; background: #e2e8f0; padding: 2px 5px; border-radius: 4px;">${password}</span>
            </div>
          </div>

          <p>For security reasons, we recommend that you change your password after your first login.</p>

          <div class="btn-container">
            <a href="${loginUrl}" class="btn">Access Organizer Panel</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Easy Tickets. All rights reserved.</p>
          <p>If you have any questions, feel free to contact our support team.</p>
          <div class="social-links">
            <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a> | <a href="#">Support</a>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"Easy Tickets" <${config.EMAIL_USER}>`,
      to: organizer.email,
      subject: 'Welcome to Easy Tickets - Your Organizer Account is Ready!',
      html: htmlContent,
      attachments: [
        {
          filename: 'easy-ticket-logo.png',
          path: path.join(__dirname, '../assets/images/easy-ticket-logo.png'),
          cid: 'logo' // same cid value as in the html img src
        }
      ]
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Registration email sent to organizer:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Error sending registration email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new Mailer();
