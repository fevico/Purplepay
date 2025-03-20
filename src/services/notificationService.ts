import { Resend } from 'resend';
import Prelude from '@prelude.so/sdk';
import { logger } from '../utils/logger';

// Initialize Resend for email
const resend = new Resend(process.env.RESEND_API_KEY || 're_e9jSYtdk_5hJjPGTJGeJ7rc5YGMVjhiuV');

// Initialize Prelude for SMS
const prelude = new Prelude({
  apiToken: process.env.PRELUDE_API_KEY || 'sk_Ul3aeDkmRjAEdtftMSzO2UIHreemcrRD',
});

/**
 * Send an email notification
 * @param to Recipient email address
 * @param subject Email subject
 * @param message Email message (HTML supported)
 * @returns Success status and message ID if successful
 */
export const sendEmail = async (
  to: string,
  subject: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: any }> => {
  try {
    logger.info(`Sending email to ${to}: ${subject}`);
    
    const { data, error } = await resend.emails.send({
      from: `Purplepay <notifications@email.propease.ca>`,
      to: [to],
      subject,
      html: message,
    });

    if (error) {
      logger.error('Error sending email:', error);
      return { success: false, error };
    }

    logger.info(`Email sent successfully to ${to}, ID: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (error) {
    logger.error('Exception sending email:', error);
    return { success: false, error };
  }
};

/**
 * Send an SMS notification
 * @param phoneNumber Recipient phone number (international format with +)
 * @param message SMS message
 * @returns Success status and verification ID if successful
 */
export const sendSMS = async (
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; verificationId?: string; error?: any }> => {
  try {
    logger.info(`Sending SMS to ${phoneNumber}`);
    
    // For actual SMS messages, we would use:
    // const verification = await prelude.verification.create({
    //   target: {
    //     type: "phone_number",
    //     value: phoneNumber,
    //   },
    //   message: {
    //     template: message
    //   }
    // });
    
    // For now, let's just log the message since we don't have real phone numbers
    logger.info(`SMS would be sent to ${phoneNumber}: ${message}`);
    
    // Simulate a successful response
    const mockVerificationId = `sms-${Date.now()}`;
    return { success: true, verificationId: mockVerificationId };
  } catch (error) {
    logger.error('Error sending SMS:', error);
    return { success: false, error };
  }
};

/**
 * Verify an SMS code
 * @param phoneNumber Phone number that received the code
 * @param code Verification code
 * @returns Success status
 */
export const verifySMSCode = async (
  phoneNumber: string,
  code: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    logger.info(`Verifying SMS code for ${phoneNumber}`);
    
    // For actual SMS verification, we would use:
    // const check = await prelude.verification.check({
    //   target: {
    //     type: "phone_number",
    //     value: phoneNumber,
    //   },
    //   code,
    // });
    
    // For now, let's just log the verification attempt
    logger.info(`SMS code verification for ${phoneNumber}: ${code}`);
    
    // Simulate a successful verification (in production, this would check the actual code)
    return { success: true };
  } catch (error) {
    logger.error('Error verifying SMS code:', error);
    return { success: false, error };
  }
};
