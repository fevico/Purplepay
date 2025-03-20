import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

// Configure email transporter
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
});

// Configure SMS client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

/**
 * Send a notification through the specified channel
 * @param userId User ID to send notification to
 * @param type Type of notification (e.g., 'transaction', 'security')
 * @param title Title of the notification
 * @param message Message content of the notification
 * @param channel Channel to send notification through ('email' or 'sms')
 */
export const sendChannelNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  channel: 'email' | 'sms'
): Promise<boolean> => {
  try {
    // Get user details (would typically come from a user model)
    // For this implementation, we'll assume we have the user's email and phone
    const user = await getUserDetails(userId);
    
    if (!user) {
      console.error(`User not found for ID: ${userId}`);
      return false;
    }

    // Check user notification preferences (if implemented)
    const shouldSendNotification = await checkNotificationPreferences(userId, type, channel);
    if (!shouldSendNotification) {
      console.log(`User ${userId} has disabled ${channel} notifications for ${type}`);
      return false;
    }

    // Send notification based on channel
    if (channel === 'email') {
      return await sendEmailNotification(user.email, title, message);
    } else if (channel === 'sms') {
      return await sendSmsNotification(user.phone, message);
    }

    return false;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

/**
 * Send an email notification
 * @param email Recipient email address
 * @param subject Email subject
 * @param message Email message content
 */
const sendEmailNotification = async (
  email: string,
  subject: string,
  message: string
): Promise<boolean> => {
  try {
    if (!process.env.EMAIL_FROM) {
      console.error('EMAIL_FROM environment variable not set');
      return false;
    }

    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      text: message,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6200ea;">${subject}</h2>
        <p style="font-size: 16px; line-height: 1.5;">${message}</p>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 14px;">PurplePay - Your Secure Payment Platform</p>
        </div>
      </div>`,
    });

    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
};

/**
 * Send an SMS notification
 * @param phone Recipient phone number
 * @param message SMS message content
 */
const sendSmsNotification = async (
  phone: string,
  message: string
): Promise<boolean> => {
  try {
    if (!twilioClient) {
      console.error('Twilio client not configured');
      return false;
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      console.error('TWILIO_PHONE_NUMBER environment variable not set');
      return false;
    }

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    return true;
  } catch (error) {
    console.error('Error sending SMS notification:', error);
    return false;
  }
};

/**
 * Get user details from the database
 * @param userId User ID to get details for
 */
const getUserDetails = async (userId: string): Promise<{ email: string; phone: string } | null> => {
  try {
    // This would typically query your user model
    // For now, we'll return a placeholder
    return {
      email: 'user@example.com',
      phone: '+1234567890',
    };
  } catch (error) {
    console.error('Error getting user details:', error);
    return null;
  }
};

/**
 * Check if a notification should be sent based on user preferences
 * @param userId User ID to check preferences for
 * @param type Type of notification
 * @param channel Channel to send notification through
 */
const checkNotificationPreferences = async (
  userId: string,
  type: string,
  channel: 'email' | 'sms'
): Promise<boolean> => {
  try {
    // This would typically query your notification preferences model
    // For now, we'll return true to always send notifications
    return true;
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    return true; // Default to sending notifications if there's an error
  }
};
