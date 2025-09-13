const cron = require('node-cron');
const Checkin = require('../models/Checkin');
const Goal = require('../models/Goal');
const User = require('../models/User');
const notificationService = require('./notificationService');

class SchedulerService {
  constructor() {
    this.jobs = new Map(); // Store active jobs
    this.initializeScheduler();
  }

  /**
   * Initialize the scheduler with recurring jobs
   */
  initializeScheduler() {
    console.log('Initializing scheduler service...');

    // Run every hour to check for upcoming check-ins
    cron.schedule('0 * * * *', async () => {
      console.log('Running hourly check-in reminder check...');
      await this.checkUpcomingCheckins();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    // Run daily at midnight to clean up old jobs and check for missed check-ins
    cron.schedule('0 0 * * *', async () => {
      console.log('Running daily maintenance...');
      await this.cleanupOldJobs();
      await this.markMissedCheckins();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    // Run every 5 minutes to check for immediate reminders
    cron.schedule('*/5 * * * *', async () => {
      await this.checkImmediateReminders();
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    console.log('Scheduler service initialized successfully');
  }

  /**
   * Check for upcoming check-ins and schedule reminders
   */
  async checkUpcomingCheckins() {
    try {
      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      // Find check-ins scheduled within the next hour that haven't had reminders sent
      const upcomingCheckins = await Checkin.find({
        scheduledFor: {
          $gte: now,
          $lte: oneHourFromNow
        },
        reminderSent: false,
        status: 'pending'
      }).populate('user goal');

      for (const checkin of upcomingCheckins) {
        if (checkin.user && checkin.goal) {
          // Calculate when to send the reminder
          const reminderTime = new Date(checkin.scheduledFor);
          reminderTime.setMinutes(reminderTime.getMinutes() - (checkin.goal.checkinSchedule?.reminderTime || 30));

          // Only schedule if reminder time is in the future and not too far
          if (reminderTime > now && reminderTime <= oneHourFromNow) {
            await this.scheduleReminder(checkin);
          }
        }
      }

      console.log(`Processed ${upcomingCheckins.length} upcoming check-ins`);
    } catch (error) {
      console.error('Error checking upcoming check-ins:', error);
    }
  }

  /**
   * Check for immediate reminders (within next 5 minutes)
   */
  async checkImmediateReminders() {
    try {
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

      // Find check-ins that need immediate reminders
      const immediateCheckins = await Checkin.find({
        scheduledFor: {
          $gte: now,
          $lte: fiveMinutesFromNow
        },
        reminderSent: false,
        status: 'pending'
      }).populate('user goal');

      for (const checkin of immediateCheckins) {
        if (checkin.user && checkin.goal) {
          const reminderTime = new Date(checkin.scheduledFor);
          reminderTime.setMinutes(reminderTime.getMinutes() - (checkin.goal.checkinSchedule?.reminderTime || 30));

          // Send reminder immediately if it's time
          if (reminderTime <= now) {
            await this.sendReminderNow(checkin);
          }
        }
      }
    } catch (error) {
      console.error('Error checking immediate reminders:', error);
    }
  }

  /**
   * Schedule a reminder for a specific check-in
   */
  async scheduleReminder(checkin) {
    try {
      const reminderTime = new Date(checkin.scheduledFor);
      reminderTime.setMinutes(reminderTime.getMinutes() - (checkin.goal.checkinSchedule?.reminderTime || 30));

      // Only schedule if reminder time is in the future
      if (reminderTime > new Date()) {
        const jobId = `reminder_${checkin._id}`;
        
        // Cancel existing job if any
        if (this.jobs.has(jobId)) {
          this.jobs.get(jobId).stop();
        }

        const job = cron.schedule(this.dateToCron(reminderTime), async () => {
          await this.sendReminderNow(checkin);
          this.jobs.delete(jobId);
        }, {
          scheduled: false,
          timezone: process.env.TZ || 'UTC'
        });

        this.jobs.set(jobId, job);
        job.start();

        console.log(`Reminder scheduled for check-in ${checkin._id} at ${reminderTime.toISOString()}`);
        return job;
      }
    } catch (error) {
      console.error('Error scheduling reminder:', error);
    }
    return null;
  }

  /**
   * Send reminder immediately
   */
  async sendReminderNow(checkin) {
    try {
      if (checkin.reminderSent) {
        return; // Already sent
      }

      const result = await notificationService.sendCheckinReminder(checkin, checkin.user, checkin.goal);
      
      if (result.success) {
        checkin.reminderSent = true;
        checkin.reminderSentAt = new Date();
        await checkin.save();
        console.log(`Reminder sent for check-in ${checkin._id}`);
      } else {
        console.error(`Failed to send reminder for check-in ${checkin._id}:`, result.error);
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  }

  /**
   * Mark missed check-ins
   */
  async markMissedCheckins() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);

      const missedCheckins = await Checkin.find({
        scheduledFor: { $lte: yesterday },
        status: 'pending'
      });

      for (const checkin of missedCheckins) {
        checkin.status = 'missed';
        await checkin.save();
      }

      if (missedCheckins.length > 0) {
        console.log(`Marked ${missedCheckins.length} check-ins as missed`);
      }
    } catch (error) {
      console.error('Error marking missed check-ins:', error);
    }
  }

  /**
   * Clean up old jobs
   */
  async cleanupOldJobs() {
    try {
      const now = new Date();
      const jobsToRemove = [];

      for (const [jobId, job] of this.jobs.entries()) {
        // Remove jobs that are more than 24 hours old
        if (jobId.startsWith('reminder_')) {
          const checkinId = jobId.replace('reminder_', '');
          const checkin = await Checkin.findById(checkinId);
          
          if (!checkin || checkin.reminderSent || checkin.scheduledFor < now) {
            jobsToRemove.push(jobId);
          }
        }
      }

      for (const jobId of jobsToRemove) {
        const job = this.jobs.get(jobId);
        if (job) {
          job.stop();
          this.jobs.delete(jobId);
        }
      }

      if (jobsToRemove.length > 0) {
        console.log(`Cleaned up ${jobsToRemove.length} old jobs`);
      }
    } catch (error) {
      console.error('Error cleaning up old jobs:', error);
    }
  }

  /**
   * Convert date to cron expression
   */
  dateToCron(date) {
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const day = date.getDate();
    const month = date.getMonth() + 1;

    return `${minutes} ${hours} ${day} ${month} *`;
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      activeJobs: this.jobs.size,
      jobs: Array.from(this.jobs.keys()),
      timezone: process.env.TZ || 'UTC',
      uptime: process.uptime()
    };
  }

  /**
   * Stop all jobs
   */
  stopAllJobs() {
    for (const [jobId, job] of this.jobs.entries()) {
      job.stop();
    }
    this.jobs.clear();
    console.log('All scheduled jobs stopped');
  }

  /**
   * Restart scheduler
   */
  restart() {
    this.stopAllJobs();
    this.initializeScheduler();
    console.log('Scheduler restarted');
  }
}

module.exports = new SchedulerService();
