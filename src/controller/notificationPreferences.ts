import { RequestHandler } from "express";
import notificationPreferencesModel from "../model/notificationPreferences";
import { createNotification } from "./notification";
import { logger } from "../utils/logger";

/**
 * Get notification preferences for the authenticated user
 * @route GET /notification-preferences
 */
export const getNotificationPreferences: RequestHandler = async (req, res) => {
    const userId = req.user.id;

    try {
        // Find or create notification preferences for the user
        let notificationPreferences = await notificationPreferencesModel.findOne({ userId });
        
        if (!notificationPreferences) {
            // Create default notification preferences if none exist
            notificationPreferences = new notificationPreferencesModel({
                userId,
                channels: {
                    inApp: true,
                    email: true,
                    sms: false
                },
                preferences: {
                    transfers: true,
                    funding: true,
                    withdrawal: true,
                    security: true,
                    system: true,
                    scheduledTransfers: true,
                    highValueTransfers: true
                }
            });
            await notificationPreferences.save();
        }

        return res.json({
            message: "Notification preferences retrieved successfully",
            notificationPreferences: {
                channels: notificationPreferences.channels,
                preferences: notificationPreferences.preferences
            }
        });
    } catch (error) {
        logger.error('Error retrieving notification preferences:', error);
        return res.status(500).json({ message: "Error retrieving notification preferences" });
    }
};

/**
 * Update notification preferences for the authenticated user
 * @route PUT /notification-preferences
 */
export const updateNotificationPreferences: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const { channels, preferences } = req.body;

    try {
        // Find or create notification preferences for the user
        let notificationPreferences = await notificationPreferencesModel.findOne({ userId });
        
        if (!notificationPreferences) {
            // Create default notification preferences if none exist
            notificationPreferences = new notificationPreferencesModel({
                userId,
                channels: {
                    inApp: true,
                    email: true,
                    sms: false
                },
                preferences: {
                    transfers: true,
                    funding: true,
                    withdrawal: true,
                    security: true,
                    system: true,
                    scheduledTransfers: true,
                    highValueTransfers: true
                }
            });
        }

        // Update channels if provided
        if (channels) {
            if (channels.inApp !== undefined) {
                notificationPreferences.channels.inApp = channels.inApp;
            }
            if (channels.email !== undefined) {
                notificationPreferences.channels.email = channels.email;
            }
            if (channels.sms !== undefined) {
                notificationPreferences.channels.sms = channels.sms;
            }
        }

        // Update preferences if provided
        if (preferences) {
            if (preferences.transfers !== undefined) {
                notificationPreferences.preferences.transfers = preferences.transfers;
            }
            if (preferences.funding !== undefined) {
                notificationPreferences.preferences.funding = preferences.funding;
            }
            if (preferences.withdrawal !== undefined) {
                notificationPreferences.preferences.withdrawal = preferences.withdrawal;
            }
            if (preferences.security !== undefined) {
                notificationPreferences.preferences.security = preferences.security;
            }
            if (preferences.system !== undefined) {
                notificationPreferences.preferences.system = preferences.system;
            }
            if (preferences.scheduledTransfers !== undefined) {
                notificationPreferences.preferences.scheduledTransfers = preferences.scheduledTransfers;
            }
            if (preferences.highValueTransfers !== undefined) {
                notificationPreferences.preferences.highValueTransfers = preferences.highValueTransfers;
            }
        }

        await notificationPreferences.save();

        // Create a notification for the user (always send this one regardless of preferences)
        await createNotification(
            userId,
            "system",
            "Notification Preferences Updated",
            "Your notification preferences have been updated successfully.",
            undefined
        );

        return res.json({
            message: "Notification preferences updated successfully",
            notificationPreferences: {
                channels: notificationPreferences.channels,
                preferences: notificationPreferences.preferences
            }
        });
    } catch (error) {
        logger.error('Error updating notification preferences:', error);
        return res.status(500).json({ message: "Error updating notification preferences" });
    }
};

/**
 * Reset notification preferences to default for the authenticated user
 * @route POST /notification-preferences/reset
 */
export const resetNotificationPreferences: RequestHandler = async (req, res) => {
    const userId = req.user.id;

    try {
        // Create default notification preferences
        const defaultPreferences = {
            userId,
            channels: {
                inApp: true,
                email: true,
                sms: false
            },
            preferences: {
                transfers: true,
                funding: true,
                withdrawal: true,
                security: true,
                system: true,
                scheduledTransfers: true,
                highValueTransfers: true
            }
        };

        // Update or create notification preferences
        await notificationPreferencesModel.findOneAndUpdate(
            { userId },
            defaultPreferences,
            { upsert: true, new: true }
        );

        // Create a notification for the user
        await createNotification(
            userId,
            "system",
            "Notification Preferences Reset",
            "Your notification preferences have been reset to default settings.",
            undefined
        );

        return res.json({
            message: "Notification preferences reset successfully",
            notificationPreferences: defaultPreferences
        });
    } catch (error) {
        logger.error('Error resetting notification preferences:', error);
        return res.status(500).json({ message: "Error resetting notification preferences" });
    }
};

/**
 * Check if a notification should be sent based on user preferences
 * This is an internal function used by other controllers
 */
export const shouldSendNotification = async (
    userId: string, 
    type: string, 
    channel: 'inApp' | 'email' | 'sms' = 'inApp'
): Promise<boolean> => {
    try {
        // Find notification preferences for the user
        const notificationPreferences = await notificationPreferencesModel.findOne({ userId });
        
        // If no preferences are set, default to sending notifications
        if (!notificationPreferences) {
            return true;
        }

        // Check if the channel is enabled
        if (!notificationPreferences.channels[channel]) {
            return false;
        }

        // Map notification type to preference key
        let preferenceKey: keyof typeof notificationPreferences.preferences = 'system';
        
        switch (type) {
            case 'transfer':
                preferenceKey = 'transfers';
                break;
            case 'funding':
                preferenceKey = 'funding';
                break;
            case 'withdrawal':
                preferenceKey = 'withdrawal';
                break;
            case 'security':
                preferenceKey = 'security';
                break;
            case 'scheduled_transfer':
                preferenceKey = 'scheduledTransfers';
                break;
            case 'high_value_transfer':
                preferenceKey = 'highValueTransfers';
                break;
            default:
                preferenceKey = 'system';
        }

        // Check if the preference is enabled
        return notificationPreferences.preferences[preferenceKey];
    } catch (error) {
        logger.error('Error checking notification preferences:', error);
        // Default to sending notifications in case of error
        return true;
    }
};
