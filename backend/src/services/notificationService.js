const nodemailer = require('nodemailer');
const cron = require('node-cron');

class NotificationService {
  constructor() {
    this.transporter = null;
    this.initializeEmailService();
  }

  /**
   * Initialize email service with nodemailer
   */
  initializeEmailService() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      console.log('Email service initialized successfully');
    } else {
      console.warn('Email service not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS environment variables.');
    }
  }

  /**
   * Send email notification
   */
  async sendEmail({ to, subject, html, text }) {
    if (!this.transporter) {
      console.warn('Email service not available');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
        text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send check-in reminder email
   */
  async sendCheckinReminder(checkin, user, goal) {
    const reminderTime = this.formatReminderTime(checkin.reminderTime);
    const checkinTime = new Date(checkin.scheduledFor).toLocaleString();
    
    const subject = `Check-in Reminder: ${goal.title}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Check-in Reminder</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 Check-in Reminder</h1>
              <p>Time to reflect on your learning progress!</p>
            </div>
            <div class="content">
              <h2>Hello ${user.name || user.email}!</h2>
              <p>This is a friendly reminder that you have a check-in scheduled for your learning goal:</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h3 style="margin-top: 0; color: #667eea;">${goal.title}</h3>
                <p><strong>Scheduled for:</strong> ${checkinTime}</p>
                <p><strong>Reminder sent:</strong> ${reminderTime} before scheduled time</p>
              </div>

              <p>Take a few minutes to reflect on your progress and complete your check-in. This helps you stay on track with your learning journey!</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/checkin?goalId=${goal._id}" class="button">
                  Complete Check-in Now
                </a>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                If you're not ready to check in right now, you can always do it later. The link above will remain active.
              </p>
            </div>
            <div class="footer">
              <p>This is an automated reminder from your AI Learning Platform.</p>
              <p>If you no longer wish to receive these reminders, you can adjust your notification settings in your dashboard.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Check-in Reminder: ${goal.title}
      
      Hello ${user.name || user.email}!
      
      This is a friendly reminder that you have a check-in scheduled for your learning goal: ${goal.title}
      
      Scheduled for: ${checkinTime}
      Reminder sent: ${reminderTime} before scheduled time
      
      Take a few minutes to reflect on your progress and complete your check-in.
      
      Complete your check-in: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/checkin?goalId=${goal._id}
      
      This is an automated reminder from your AI Learning Platform.
    `;

    return await this.sendEmail({
      to: user.email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send milestone completion notification
   */
  async sendMilestoneNotification(user, goal, milestone) {
    const subject = `🎉 Milestone Completed: ${milestone.title}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Milestone Completed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations!</h1>
              <p>You've completed another milestone!</p>
            </div>
            <div class="content">
              <h2>Great job, ${user.name || user.email}!</h2>
              <p>You've successfully completed a milestone in your learning journey:</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
                <h3 style="margin-top: 0; color: #4CAF50;">${milestone.title}</h3>
                <p><strong>Goal:</strong> ${goal.title}</p>
                <p><strong>Completed on:</strong> ${new Date().toLocaleDateString()}</p>
              </div>

              <p>Keep up the excellent work! Every milestone brings you closer to achieving your learning goals.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/goals/${goal._id}" class="button">
                  View Your Progress
                </a>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated notification from your AI Learning Platform.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({
      to: user.email,
      subject,
      html,
      text: `Congratulations! You've completed the milestone: ${milestone.title} for your goal: ${goal.title}`,
    });
  }

  /**
   * Send goal completion notification
   */
  async sendGoalCompletionNotification(user, goal) {
    const subject = `🏆 Goal Completed: ${goal.title}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Goal Completed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #FFD700; color: #333; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏆 Amazing Achievement!</h1>
              <p>You've completed your learning goal!</p>
            </div>
            <div class="content">
              <h2>Congratulations, ${user.name || user.email}!</h2>
              <p>You've successfully completed your learning goal:</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700;">
                <h3 style="margin-top: 0; color: #FFD700;">${goal.title}</h3>
                <p><strong>Completed on:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Description:</strong> ${goal.description}</p>
              </div>

              <p>This is a significant achievement! You've demonstrated dedication, persistence, and commitment to your learning journey.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">
                  Set Your Next Goal
                </a>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated notification from your AI Learning Platform.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await this.sendEmail({
      to: user.email,
      subject,
      html,
      text: `Congratulations! You've completed your learning goal: ${goal.title}`,
    });
  }

  /**
   * Format reminder time for display
   */
  formatReminderTime(minutes) {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Schedule reminder job
   */
  scheduleReminder(checkin, user, goal) {
    const reminderTime = new Date(checkin.scheduledFor);
    reminderTime.setMinutes(reminderTime.getMinutes() - checkin.reminderTime);

    // Only schedule if reminder time is in the future
    if (reminderTime > new Date()) {
      const cronExpression = this.dateToCron(reminderTime);
      
      const job = cron.schedule(cronExpression, async () => {
        console.log(`Sending reminder for check-in ${checkin._id}`);
        await this.sendCheckinReminder(checkin, user, goal);
        
        // Mark reminder as sent
        checkin.reminderSent = true;
        checkin.reminderSentAt = new Date();
        await checkin.save();
        
        // Stop the job after execution
        job.stop();
      }, {
        scheduled: false,
        timezone: process.env.TZ || 'UTC'
      });

      job.start();
      console.log(`Reminder scheduled for ${reminderTime.toISOString()}`);
      return job;
    }

    return null;
  }

  /**
   * Convert date to cron expression
   */
  dateToCron(date) {
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return `${minutes} ${hours} ${day} ${month} *`;
  }

  /**
   * Test email service
   */
  async testEmailService() {
    if (!this.transporter) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service is working correctly' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();
