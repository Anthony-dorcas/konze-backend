import nodemailer from 'nodemailer';
import { config } from '../config/config.js';

class EmailService {

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }

  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: config.emailFrom,
        to,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to}`);
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw new Error('Email sending failed');
    }
  }

  async sendVerificationEmail(email, code, name) {
    const subject = 'Verify Your Email - Konze Digital Solutions';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3498db, #2c3e50); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .code { background: #fff; border: 2px dashed #3498db; padding: 20px; font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 10px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for registering with Konze Digital Solutions. Please use the verification code below to complete your registration:</p>
            <div class="code">${code}</div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't create an account with us, please ignore this email.</p>
            <p>Best regards,<br>The Konze Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Konze Digital Solutions. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(email, subject, html);
  }

  async sendPasswordResetEmail(email, code, name) {
    const subject = 'Password Reset Request - Konze Digital Solutions';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .code { background: #fff; border: 2px dashed #e74c3c; padding: 20px; font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 10px; margin: 20px 0; border-radius: 8px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password. Please use the verification code below:</p>
            <div class="code">${code}</div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
            <p>Best regards,<br>The Konze Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Konze Digital Solutions. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(email, subject, html);
  }

  async sendWelcomeEmail(email, name) {
    const subject = 'Welcome to Konze Digital Solutions!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2ecc71, #27ae60); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .features { margin: 20px 0; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2ecc71; border-radius: 4px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Konze!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Welcome to Konze Digital Solutions! We're excited to have you on board.</p>
            
            <div class="features">
              <div class="feature"><strong>📊 Investment Opportunities</strong> - Grow your wealth with our diverse portfolio</div>
              <div class="feature"><strong>💼 Professional Services</strong> - Access our comprehensive digital solutions</div>
              <div class="feature"><strong>📱 Easy Management</strong> - Track everything from your dashboard</div>
              <div class="feature"><strong>🔒 Bank-Level Security</strong> - Your data and investments are safe with us</div>
            </div>
            
            <p>Get started by exploring our services and investment options from your dashboard.</p>
            
            <p>If you have any questions, feel free to reach out to our support team.</p>
            
            <p>Best regards,<br>The Konze Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Konze Digital Solutions. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(email, subject, html);
  }

  async sendContactConfirmation(email, name, subject) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #9b59b6, #8e44ad); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Message Received</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for contacting Konze Digital Solutions!</p>
            <p>We have received your message regarding <strong>"${subject}"</strong> and our team will get back to you within 24-48 hours.</p>
            <p>For urgent inquiries, please call our support line: +234 (123) 8103985062</p>
            <p>Best regards,<br>The Konze Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Konze Digital Solutions. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(email, 'Message Received - Konze Digital Solutions', html);
  }
}

export default new EmailService();