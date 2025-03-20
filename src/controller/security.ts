import { RequestHandler } from "express";
import securitySettingsModel from "../model/securitySettings";
import { createNotification, sendChannelNotification } from "./notification";
import { logger } from "../utils/logger";
import notificationPreferencesModel from "../model/notificationPreferences";
import { verifySMSCode } from "../services/notificationService";
import mongoose from "mongoose";
import crypto from "crypto";
import userModel from "../models/user";
import bcrypt from "bcrypt";

/**
 * Get security settings for the authenticated user
 * @route GET /security/settings
 */
export const getSecuritySettings: RequestHandler = async (req, res) => {
    const userId = req.user.id;

    try {
        // Find or create security settings for the user
        let securitySettings = await securitySettingsModel.findOne({ userId });
        
        if (!securitySettings) {
            // Create default security settings if none exist
            securitySettings = new securitySettingsModel({
                userId,
                highValueTransferThreshold: 100000, // 100,000 NGN
                requireAdditionalAuthForHighValue: true,
                skipAuthForTrustedDevices: false,
                enableEmailNotifications: true,
                enableSmsNotifications: false,
                trustedDevices: [],
                lastUpdated: new Date()
            });
            await securitySettings.save();
        }

        return res.json({
            message: "Security settings retrieved successfully",
            securitySettings: {
                highValueTransferThreshold: securitySettings.highValueTransferThreshold,
                requireAdditionalAuthForHighValue: securitySettings.requireAdditionalAuthForHighValue,
                skipAuthForTrustedDevices: securitySettings.skipAuthForTrustedDevices,
                enableEmailNotifications: securitySettings.enableEmailNotifications,
                enableSmsNotifications: securitySettings.enableSmsNotifications,
                trustedDevices: securitySettings.trustedDevices,
                lastUpdated: securitySettings.lastUpdated
            }
        });
    } catch (error) {
        logger.error('Error retrieving security settings:', error);
        return res.status(500).json({ message: "Error retrieving security settings" });
    }
};

/**
 * Update security settings for the authenticated user
 * @route PUT /security/settings
 */
export const updateSecuritySettings: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const { 
        highValueTransferThreshold,
        requireAdditionalAuthForHighValue,
        skipAuthForTrustedDevices,
        enableEmailNotifications,
        enableSmsNotifications
    } = req.body;

    try {
        // Find or create security settings for the user
        let securitySettings = await securitySettingsModel.findOne({ userId });
        
        if (!securitySettings) {
            // Create default security settings if none exist
            securitySettings = new securitySettingsModel({
                userId,
                highValueTransferThreshold: 100000, // 100,000 NGN
                requireAdditionalAuthForHighValue: true,
                skipAuthForTrustedDevices: false,
                enableEmailNotifications: true,
                enableSmsNotifications: false,
                trustedDevices: [],
                lastUpdated: new Date()
            });
        }

        // Update fields if provided
        if (highValueTransferThreshold !== undefined && highValueTransferThreshold >= 10000) {
            securitySettings.highValueTransferThreshold = highValueTransferThreshold;
        }

        if (requireAdditionalAuthForHighValue !== undefined) {
            securitySettings.requireAdditionalAuthForHighValue = requireAdditionalAuthForHighValue;
        }

        if (skipAuthForTrustedDevices !== undefined) {
            securitySettings.skipAuthForTrustedDevices = skipAuthForTrustedDevices;
        }

        if (enableEmailNotifications !== undefined) {
            securitySettings.enableEmailNotifications = enableEmailNotifications;
        }

        if (enableSmsNotifications !== undefined) {
            securitySettings.enableSmsNotifications = enableSmsNotifications;
        }

        securitySettings.lastUpdated = new Date();
        await securitySettings.save();

        // Check notification preferences
        const notificationPrefs = await notificationPreferencesModel.findOne({ userId });
        
        // Create a notification for the user if they have enabled security notifications
        if (!notificationPrefs || notificationPrefs.preferences.security) {
            await createNotification(
                userId,
                "security",
                "Security Settings Updated",
                "Your security settings have been updated successfully.",
                undefined
            );
        }

        return res.json({
            message: "Security settings updated successfully",
            securitySettings: {
                highValueTransferThreshold: securitySettings.highValueTransferThreshold,
                requireAdditionalAuthForHighValue: securitySettings.requireAdditionalAuthForHighValue,
                skipAuthForTrustedDevices: securitySettings.skipAuthForTrustedDevices,
                enableEmailNotifications: securitySettings.enableEmailNotifications,
                enableSmsNotifications: securitySettings.enableSmsNotifications,
                trustedDevices: securitySettings.trustedDevices,
                lastUpdated: securitySettings.lastUpdated
            }
        });
    } catch (error) {
        logger.error('Error updating security settings:', error);
        return res.status(500).json({ message: "Error updating security settings" });
    }
};

/**
 * Add a trusted device
 * @route POST /security/trusted-devices
 */
export const addTrustedDevice: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const { deviceName } = req.body;
    const deviceId = req.headers['device-id'] as string || crypto.randomUUID();

    if (!deviceName) {
        return res.status(400).json({ message: "Device name is required" });
    }

    try {
        // Find or create security settings for the user
        let securitySettings = await securitySettingsModel.findOne({ userId });
        
        if (!securitySettings) {
            // Create default security settings if none exist
            securitySettings = new securitySettingsModel({
                userId,
                highValueTransferThreshold: 100000, // 100,000 NGN
                requireAdditionalAuthForHighValue: true,
                skipAuthForTrustedDevices: false,
                enableEmailNotifications: true,
                enableSmsNotifications: false,
                trustedDevices: [],
                lastUpdated: new Date()
            });
        }

        // Check if device is already trusted
        const existingDeviceIndex = securitySettings.trustedDevices.findIndex(
            device => device.deviceId === deviceId
        );

        if (existingDeviceIndex >= 0) {
            // Update existing device
            securitySettings.trustedDevices[existingDeviceIndex].deviceName = deviceName;
            securitySettings.trustedDevices[existingDeviceIndex].lastUsed = new Date();
        } else {
            // Add new trusted device
            securitySettings.trustedDevices.push({
                deviceId,
                deviceName,
                lastUsed: new Date()
            });
        }

        securitySettings.lastUpdated = new Date();
        await securitySettings.save();

        // Create a notification for the user
        await createNotification(
            userId,
            "security",
            "Trusted Device Added",
            `A new device "${deviceName}" has been added to your trusted devices.`,
            undefined
        );

        return res.json({
            message: "Trusted device added successfully",
            device: {
                deviceId,
                deviceName,
                lastUsed: new Date()
            }
        });
    } catch (error) {
        logger.error('Error adding trusted device:', error);
        return res.status(500).json({ message: "Error adding trusted device" });
    }
};

/**
 * Remove a trusted device
 * @route DELETE /security/trusted-devices/:deviceId
 */
export const removeTrustedDevice: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const deviceId = req.params.deviceId;

    try {
        // Find security settings for the user
        const securitySettings = await securitySettingsModel.findOne({ userId });
        
        if (!securitySettings) {
            return res.status(404).json({ message: "Security settings not found" });
        }

        // Check if device exists
        const deviceIndex = securitySettings.trustedDevices.findIndex(
            device => device.deviceId === deviceId
        );

        if (deviceIndex < 0) {
            return res.status(404).json({ message: "Trusted device not found" });
        }

        // Get device name before removing
        const deviceName = securitySettings.trustedDevices[deviceIndex].deviceName;

        // Remove the device
        securitySettings.trustedDevices.splice(deviceIndex, 1);
        securitySettings.lastUpdated = new Date();
        await securitySettings.save();

        // Create a notification for the user
        await createNotification(
            userId,
            "security",
            "Trusted Device Removed",
            `The device "${deviceName}" has been removed from your trusted devices.`,
            undefined
        );

        return res.json({
            message: "Trusted device removed successfully"
        });
    } catch (error) {
        logger.error('Error removing trusted device:', error);
        return res.status(500).json({ message: "Error removing trusted device" });
    }
};

/**
 * Get all trusted devices for the authenticated user
 * @route GET /security/trusted-devices
 */
export const getTrustedDevices: RequestHandler = async (req, res) => {
    const userId = req.user.id;

    try {
        // Find security settings for the user
        const securitySettings = await securitySettingsModel.findOne({ userId });
        
        if (!securitySettings) {
            return res.json({
                message: "No trusted devices found",
                trustedDevices: []
            });
        }

        return res.json({
            message: "Trusted devices retrieved successfully",
            trustedDevices: securitySettings.trustedDevices
        });
    } catch (error) {
        logger.error('Error retrieving trusted devices:', error);
        return res.status(500).json({ message: "Error retrieving trusted devices" });
    }
};

/**
 * Update a trusted device
 * @route PUT /security/trusted-devices/:deviceId
 */
export const updateTrustedDevice: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const deviceId = req.params.deviceId;
    const { deviceName } = req.body;

    if (!deviceName) {
        return res.status(400).json({ message: "Device name is required" });
    }

    try {
        // Find security settings for the user
        const securitySettings = await securitySettingsModel.findOne({ userId });
        
        if (!securitySettings) {
            return res.status(404).json({ message: "Security settings not found" });
        }

        // Check if device exists
        const deviceIndex = securitySettings.trustedDevices.findIndex(
            device => device.deviceId === deviceId
        );

        if (deviceIndex < 0) {
            return res.status(404).json({ message: "Trusted device not found" });
        }

        // Update the device
        securitySettings.trustedDevices[deviceIndex].deviceName = deviceName;
        securitySettings.trustedDevices[deviceIndex].lastUsed = new Date();
        securitySettings.lastUpdated = new Date();
        await securitySettings.save();

        // Check notification preferences
        const notificationPrefs = await notificationPreferencesModel.findOne({ userId });
        
        // Create a notification for the user if they have enabled security notifications
        if (!notificationPrefs || notificationPrefs.preferences.security) {
            await createNotification(
                userId,
                "security",
                "Trusted Device Updated",
                `Your trusted device "${deviceName}" has been updated.`,
                undefined
            );
        }

        return res.json({
            message: "Trusted device updated successfully",
            device: securitySettings.trustedDevices[deviceIndex]
        });
    } catch (error) {
        logger.error('Error updating trusted device:', error);
        return res.status(500).json({ message: "Error updating trusted device" });
    }
};

/**
 * Verify if a device is trusted
 * @route POST /security/verify-device
 */
export const verifyTrustedDevice: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const deviceId = req.headers['device-id'] as string;

    if (!deviceId) {
        return res.status(400).json({ message: "Device ID is required" });
    }

    try {
        // Find security settings for the user
        const securitySettings = await securitySettingsModel.findOne({ userId });
        
        if (!securitySettings) {
            return res.json({
                trusted: false,
                message: "Device not recognized"
            });
        }

        // Check if device is trusted
        const trustedDevice = securitySettings.trustedDevices.find(
            device => device.deviceId === deviceId
        );

        if (!trustedDevice) {
            return res.json({
                trusted: false,
                message: "Device not recognized"
            });
        }

        // Update last used timestamp
        trustedDevice.lastUsed = new Date();
        await securitySettings.save();

        return res.json({
            trusted: true,
            message: "Device recognized",
            device: {
                deviceId: trustedDevice.deviceId,
                deviceName: trustedDevice.deviceName,
                lastUsed: trustedDevice.lastUsed
            }
        });
    } catch (error) {
        logger.error('Error verifying trusted device:', error);
        return res.status(500).json({ message: "Error verifying trusted device" });
    }
};

/**
 * Verify high-value transfer with additional authentication
 * @route POST /security/verify-high-value-transfer
 */
export const verifyHighValueTransfer: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const { transferId, verificationCode, deviceId } = req.body;

    if (!transferId || !verificationCode) {
        return res.status(400).json({ message: "Transfer ID and verification code are required" });
    }

    try {
        // Find the user's security settings
        const securitySettings = await securitySettingsModel.findOne({ userId });
        
        if (!securitySettings) {
            return res.status(404).json({ message: "Security settings not found" });
        }

        // Get the user from the database to get their phone number
        const user = await mongoose.model('User').findById(userId);
        
        if (!user || !user.phoneNumber) {
            return res.status(400).json({ message: "User phone number not found" });
        }

        // Verify the SMS code
        const verificationResult = await verifySMSCode(user.phoneNumber, verificationCode);
        
        if (!verificationResult.success) {
            logger.warn(`Failed high-value transfer verification for user ${userId}, transfer ${transferId}`);
            return res.status(400).json({ message: "Invalid verification code", verified: false });
        }

        // If verification is successful and a device ID is provided, add it to trusted devices
        if (deviceId) {
            // Check if the device is already trusted
            const existingDevice = securitySettings.trustedDevices.find(
                device => device.deviceId === deviceId
            );
            
            if (!existingDevice) {
                // Add the device to trusted devices
                securitySettings.trustedDevices.push({
                    deviceId,
                    deviceName: `Device added via transfer verification on ${new Date().toLocaleDateString()}`,
                    lastUsed: new Date()
                });
                
                // Save the updated security settings
                securitySettings.lastUpdated = new Date();
                await securitySettings.save();
                
                // Create a notification for the user
                await createNotification(
                    userId,
                    "security",
                    "New Trusted Device Added",
                    "A new device has been added to your trusted devices list after successful transfer verification.",
                    undefined
                );
                
                // Send an email notification for added security
                await sendChannelNotification(
                    userId,
                    "security",
                    "New Trusted Device Added",
                    "A new device has been added to your trusted devices list after successful transfer verification. If this wasn't you, please contact support immediately.",
                    "email"
                );
            } else {
                // Update the last used timestamp for the trusted device
                await securitySettingsModel.updateOne(
                    { 
                        userId, 
                        "trustedDevices.deviceId": deviceId 
                    },
                    { 
                        $set: { 
                            "trustedDevices.$.lastUsed": new Date() 
                        } 
                    }
                );
            }
        }

        // Create a notification for the successful verification
        await createNotification(
            userId,
            "high_value_transfer",
            "High-Value Transfer Verified",
            `Your high-value transfer (ID: ${transferId}) has been successfully verified.`,
            transferId
        );

        logger.info(`Successful high-value transfer verification for user ${userId}, transfer ${transferId}`);
        
        return res.json({
            message: "High-value transfer verified successfully",
            verified: true
        });
    } catch (error) {
        logger.error('Error verifying high-value transfer:', error);
        return res.status(500).json({ message: "Error verifying high-value transfer" });
    }
};

/**
 * Check if additional authentication is required for a transaction
 * @param userId User ID
 * @param amount Transaction amount
 * @param deviceId Optional device ID to check if it's trusted
 */
export const isAdditionalAuthRequired = async (userId: string, amount: number, deviceId?: string): Promise<boolean> => {
    try {
        // Find security settings for the user
        const securitySettings = await securitySettingsModel.findOne({ userId });
        
        if (!securitySettings) {
            // Default to requiring additional auth if no settings found
            return true;
        }

        // If high-value auth is disabled, no additional auth required
        if (!securitySettings.requireAdditionalAuthForHighValue) {
            return false;
        }

        // Check if amount exceeds high-value threshold
        const isHighValue = amount >= securitySettings.highValueTransferThreshold;
        
        // If not a high-value transaction, no additional auth required
        if (!isHighValue) {
            return false;
        }

        // If device ID is provided and trusted device auth skipping is enabled, check if device is trusted
        if (deviceId && securitySettings.skipAuthForTrustedDevices) {
            const trustedDevice = securitySettings.trustedDevices.find(
                device => device.deviceId === deviceId
            );
            
            // If device is trusted, no additional auth required
            if (trustedDevice) {
                // Update last used timestamp for the trusted device
                await securitySettingsModel.updateOne(
                    { 
                        userId, 
                        "trustedDevices.deviceId": deviceId 
                    },
                    { 
                        $set: { 
                            "trustedDevices.$.lastUsed": new Date() 
                        } 
                    }
                );
                
                return false;
            }
        }

        // In all other cases, require additional authentication
        return true;
    } catch (error) {
        logger.error('Error checking if additional auth is required:', error);
        // Default to requiring additional auth in case of error
        return true;
    }
};

/**
 * Cleanup old trusted devices that haven't been used in a specified timeframe
 * This function should be called periodically (e.g., via a cron job)
 * @param daysThreshold Number of days of inactivity before a device is considered old (default: 90)
 */
export const cleanupOldTrustedDevices = async (daysThreshold: number = 90): Promise<void> => {
    try {
        const thresholdDate = new Date();
        thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);
        
        logger.info(`Starting cleanup of trusted devices older than ${daysThreshold} days (${thresholdDate.toISOString()})`);
        
        // Find all security settings with trusted devices
        const securitySettings = await securitySettingsModel.find({
            "trustedDevices.0": { $exists: true } // Has at least one trusted device
        });
        
        let totalRemoved = 0;
        
        // Process each user's security settings
        for (const settings of securitySettings) {
            const originalDeviceCount = settings.trustedDevices.length;
            
            // Filter out old devices
            settings.trustedDevices = settings.trustedDevices.filter(
                device => device.lastUsed > thresholdDate
            );
            
            const removedCount = originalDeviceCount - settings.trustedDevices.length;
            
            // Only update if devices were removed
            if (removedCount > 0) {
                totalRemoved += removedCount;
                settings.lastUpdated = new Date();
                await settings.save();
                
                // Create a notification for the user about removed devices
                await createNotification(
                    settings.userId.toString(),
                    "security",
                    "Inactive Devices Removed",
                    `${removedCount} inactive device(s) that haven't been used in ${daysThreshold} days were automatically removed from your trusted devices list.`,
                    undefined
                );
                
                logger.info(`Removed ${removedCount} old trusted devices for user ${settings.userId}`);
            }
        }
        
        logger.info(`Completed trusted device cleanup. Removed ${totalRemoved} devices in total.`);
    } catch (error) {
        logger.error('Error cleaning up old trusted devices:', error);
    }
};

/**
 * Set or update transaction PIN for the authenticated user
 * @route POST /security/set-transaction-pin
 */
export const setTransactionPin: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const { pin } = req.body;

    try {
        // Validate PIN format (4-digit numeric PIN)
        if (!pin || !/^\d{4}$/.test(pin)) {
            return res.status(400).json({
                success: false,
                message: 'PIN must be a 4-digit number'
            });
        }

        // Find the user
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Hash the PIN
        const salt = await bcrypt.genSalt(10);
        const hashedPin = await bcrypt.hash(pin, salt);

        // Update the user's transaction PIN
        user.transactionPin = hashedPin;
        await user.save();

        // Create a notification
        await createNotification({
            userId,
            type: 'security',
            title: 'Transaction PIN Updated',
            message: 'Your transaction PIN has been successfully set or updated.',
            reference: new Date().toISOString()
        });

        // Send notification through preferred channels
        const preferences = await notificationPreferencesModel.findOne({ userId });
        if (preferences && preferences.preferences.security) {
            await sendChannelNotification(
                userId,
                'security',
                'Transaction PIN Updated',
                'Your transaction PIN has been successfully set or updated.',
                'email'
            );
        }

        // Log the action
        logger.info(`User ${userId} set/updated transaction PIN`, {
            userId,
            action: 'set_transaction_pin'
        });

        return res.status(200).json({
            success: true,
            message: 'Transaction PIN set successfully'
        });
    } catch (error: any) {
        logger.error('Error setting transaction PIN', {
            userId,
            error: error.message
        });

        return res.status(500).json({
            success: false,
            message: 'An error occurred while setting transaction PIN'
        });
    }
};
