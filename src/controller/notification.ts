import { RequestHandler } from "express";
import notificationModel from "../model/notification";
import { logger } from "../utils/logger";
import { shouldSendNotification } from "./notificationPreferences";
import { sendEmail, sendSMS } from "../services/notificationService";
import userModel from "../model/user";

/**
 * Get all notifications for the authenticated user
 * @route GET /notifications
 */
export const getNotifications: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20, isRead } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    try {
        // Build filter based on query params
        const filter: any = { userId };
        
        if (isRead !== undefined) {
            filter.isRead = isRead === 'true';
        }

        // Get total count for pagination
        const total = await notificationModel.countDocuments(filter);

        // Get notifications with pagination
        const notifications = await notificationModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .exec();

        // Get unread count
        const unreadCount = await notificationModel.countDocuments({ 
            userId, 
            isRead: false 
        });

        return res.json({
            message: "Notifications retrieved successfully",
            notifications: notifications.map(notification => ({
                id: notification._id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                reference: notification.reference,
                isRead: notification.isRead,
                createdAt: notification.createdAt
            })),
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            },
            unreadCount
        });
    } catch (error) {
        console.error('Error retrieving notifications:', error);
        return res.status(500).json({ message: "Error retrieving notifications" });
    }
};

/**
 * Mark a notification as read
 * @route PUT /notifications/:id/read
 */
export const markNotificationAsRead: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const notificationId = req.params.id;

    try {
        const notification = await notificationModel.findOne({
            _id: notificationId,
            userId
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        if (notification.isRead) {
            return res.json({
                message: "Notification already marked as read",
                notification: {
                    id: notification._id,
                    isRead: notification.isRead
                }
            });
        }

        notification.isRead = true;
        await notification.save();

        return res.json({
            message: "Notification marked as read",
            notification: {
                id: notification._id,
                isRead: notification.isRead
            }
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return res.status(500).json({ message: "Error marking notification as read" });
    }
};

/**
 * Mark all notifications as read
 * @route PUT /notifications/read-all
 */
export const markAllNotificationsAsRead: RequestHandler = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await notificationModel.updateMany(
            { userId, isRead: false },
            { $set: { isRead: true } }
        );

        return res.json({
            message: "All notifications marked as read",
            count: result.modifiedCount
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return res.status(500).json({ message: "Error marking all notifications as read" });
    }
};

/**
 * Delete a notification
 * @route DELETE /notifications/:id
 */
export const deleteNotification: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const notificationId = req.params.id;

    try {
        const result = await notificationModel.deleteOne({
            _id: notificationId,
            userId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Notification not found" });
        }

        return res.json({
            message: "Notification deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        return res.status(500).json({ message: "Error deleting notification" });
    }
};

/**
 * Create a notification
 * This function supports two parameter formats for backward compatibility:
 * 1. (userId, type, title, message, reference)
 * 2. ({ userId, type, title, message, reference })
 */
export const createNotification = async (
    userIdOrParams: string | { 
        userId: string; 
        type: string; 
        title: string; 
        message: string; 
        reference?: string;
    },
    type?: string,
    title?: string,
    message?: string,
    reference?: string
) => {
    try {
        let userId: string;
        let notificationType: string;
        let notificationTitle: string;
        let notificationMessage: string;
        let notificationReference: string | undefined;

        // Check which parameter format is being used
        if (typeof userIdOrParams === 'object') {
            // Format 2: Object parameter
            userId = userIdOrParams.userId;
            notificationType = userIdOrParams.type;
            notificationTitle = userIdOrParams.title;
            notificationMessage = userIdOrParams.message;
            notificationReference = userIdOrParams.reference;
        } else {
            // Format 1: Individual parameters
            userId = userIdOrParams;
            notificationType = type!;
            notificationTitle = title!;
            notificationMessage = message!;
            notificationReference = reference;
        }

        // Check if the notification should be sent based on user preferences
        const shouldSend = await shouldSendNotification(userId, notificationType, 'inApp');
        
        if (!shouldSend) {
            logger.info(`Notification skipped based on user preferences: ${userId}, ${notificationType}`);
            return null;
        }

        // Create and save the notification
        const notification = new notificationModel({
            userId,
            type: notificationType,
            title: notificationTitle,
            message: notificationMessage,
            reference: notificationReference,
            isRead: false
        });

        await notification.save();
        logger.info(`Notification created for user ${userId}: ${notificationTitle}`);
        
        return notification;
    } catch (error) {
        logger.error('Error creating notification:', error);
        return null;
    }
};

/**
 * Send a notification through a specific channel (email, SMS, etc.)
 * This function handles the actual sending of notifications via different channels
 */
export const sendChannelNotification = async (
    userId: string,
    type: string,
    title: string,
    message: string,
    channel: 'email' | 'sms'
) => {
    try {
        // Check if the notification should be sent based on user preferences
        const shouldSend = await shouldSendNotification(userId, type, channel);
        
        if (!shouldSend) {
            logger.info(`Channel notification skipped based on user preferences: ${userId}, ${type}, ${channel}`);
            return false;
        }
        
        // Get the user's contact information
        const user = await userModel.findById(userId);
        if (!user) {
            logger.error(`User not found for notification: ${userId}`);
            return false;
        }
        
        // Send notification based on channel
        if (channel === 'email' && user.email) {
            // Format the email message with HTML
            const htmlMessage = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #6200ea; margin: 0;">Purplepay</h1>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <h2 style="color: #333;">${title}</h2>
                        <p style="color: #555; line-height: 1.5;">${message}</p>
                    </div>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px;">
                        <p>This is an automated message from Purplepay. Please do not reply to this email.</p>
                        <p>If you have any questions, please contact our support team.</p>
                    </div>
                </div>
            `;
            
            // Send the email
            const result = await sendEmail(user.email, title, htmlMessage);
            return result.success;
        } else if (channel === 'sms' && user.phoneNumber) {
            // Format the SMS message (keep it short)
            const smsMessage = `Purplepay: ${title} - ${message}`;
            
            // Send the SMS
            const result = await sendSMS(user.phoneNumber.toString(), smsMessage);
            return result.success;
        } else {
            logger.info(`Cannot send ${channel} notification: missing contact info for user ${userId}`);
            return false;
        }
    } catch (error) {
        logger.error(`Error sending ${channel} notification:`, error);
        return false;
    }
};
