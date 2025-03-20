/**
 * Direct test script for security features
 * 
 * This script tests the security features directly by importing the controllers
 * and models, without going through the API endpoints.
 * 
 * To run this script:
 * 1. Make sure MongoDB is running
 * 2. Run: node test-security-features-direct.js
 */

// Import required modules
const mongoose = require('mongoose');
require('dotenv').config();

// Import models and controllers
const SecuritySettings = require('./dist/model/securitySettings').default;
const NotificationPreferences = require('./dist/model/notificationPreferences').default;
const { 
    cleanupOldTrustedDevices, 
    isAdditionalAuthRequired 
} = require('./dist/controller/security');
const { 
    createNotification, 
    sendChannelNotification 
} = require('./dist/controller/notification');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/purplepay')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Test user ID (create a new ObjectId)
const testUserId = new mongoose.Types.ObjectId();

// Device IDs for testing
const deviceIds = {
    mobile: `mobile-${Date.now()}`,
    desktop: `desktop-${Date.now()}`
};

// Test functions
async function testSecuritySettings() {
    try {
        console.log('\n--- Testing Security Settings Model ---');
        
        // Create security settings
        console.log('Creating security settings...');
        const securitySettings = new SecuritySettings({
            userId: testUserId,
            highValueTransferThreshold: 50000,
            requireAdditionalAuthForHighValue: true,
            skipAuthForTrustedDevices: true,
            enableEmailNotifications: true,
            enableSmsNotifications: false,
            trustedDevices: [
                {
                    deviceId: deviceIds.mobile,
                    deviceName: 'Test Mobile Device',
                    lastUsed: new Date()
                },
                {
                    deviceId: deviceIds.desktop,
                    deviceName: 'Test Desktop Device',
                    lastUsed: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) // 100 days ago
                }
            ]
        });
        
        await securitySettings.save();
        console.log('Security settings created:', securitySettings);
        
        // Test isAdditionalAuthRequired function
        console.log('\nTesting isAdditionalAuthRequired function...');
        
        // Case 1: High-value transfer with untrusted device
        const case1 = await isAdditionalAuthRequired(testUserId.toString(), 60000, 'unknown-device');
        console.log('Case 1 (High-value, untrusted device):', case1 ? 'Auth required ✅' : 'Auth not required ❌');
        
        // Case 2: High-value transfer with trusted device
        const case2 = await isAdditionalAuthRequired(testUserId.toString(), 60000, deviceIds.mobile);
        console.log('Case 2 (High-value, trusted device):', case2 ? 'Auth required ❌' : 'Auth not required ✅');
        
        // Case 3: Low-value transfer
        const case3 = await isAdditionalAuthRequired(testUserId.toString(), 10000, 'unknown-device');
        console.log('Case 3 (Low-value, any device):', case3 ? 'Auth required ❌' : 'Auth not required ✅');
        
        return true;
    } catch (error) {
        console.error('Security settings test failed:', error);
        return false;
    }
}

async function testNotificationPreferences() {
    try {
        console.log('\n--- Testing Notification Preferences Model ---');
        
        // Create notification preferences
        console.log('Creating notification preferences...');
        const notificationPreferences = new NotificationPreferences({
            userId: testUserId,
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
        console.log('Notification preferences created:', notificationPreferences);
        
        return true;
    } catch (error) {
        console.error('Notification preferences test failed:', error);
        return false;
    }
}

async function testNotifications() {
    try {
        console.log('\n--- Testing Notifications ---');
        
        // Create a notification
        console.log('Creating a notification...');
        const notification = await createNotification(
            testUserId.toString(),
            'security',
            'Security Test Notification',
            'This is a test notification for security features.',
            undefined
        );
        
        console.log('Notification created:', notification);
        
        // Test sending a channel notification
        console.log('\nTesting channel notification...');
        const emailSent = await sendChannelNotification(
            testUserId.toString(),
            'security',
            'Security Email Test',
            'This is a test email notification for security features.',
            'email'
        );
        
        console.log('Email notification sent:', emailSent ? '✅' : '❌');
        
        return true;
    } catch (error) {
        console.error('Notifications test failed:', error);
        return false;
    }
}

async function testCleanupTrustedDevices() {
    try {
        console.log('\n--- Testing Cleanup Trusted Devices ---');
        
        // Get current trusted devices
        const beforeSettings = await SecuritySettings.findOne({ userId: testUserId });
        console.log('Before cleanup:', beforeSettings.trustedDevices.length, 'trusted devices');
        
        // Run cleanup with a 30-day threshold (should remove the desktop device)
        console.log('Running cleanup with 30-day threshold...');
        await cleanupOldTrustedDevices(30);
        
        // Get updated trusted devices
        const afterSettings = await SecuritySettings.findOne({ userId: testUserId });
        console.log('After cleanup:', afterSettings.trustedDevices.length, 'trusted devices');
        
        // Verify that only one device was removed
        const devicesRemoved = beforeSettings.trustedDevices.length - afterSettings.trustedDevices.length;
        console.log('Devices removed:', devicesRemoved);
        console.log('Cleanup test result:', devicesRemoved === 1 ? '✅ PASSED' : '❌ FAILED');
        
        return devicesRemoved === 1;
    } catch (error) {
        console.error('Cleanup trusted devices test failed:', error);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('=== Starting Direct Security Features Tests ===\n');
    
    // Run tests
    const results = {
        securitySettings: await testSecuritySettings(),
        notificationPreferences: await testNotificationPreferences(),
        notifications: await testNotifications(),
        cleanupTrustedDevices: await testCleanupTrustedDevices()
    };
    
    // Print summary
    console.log('\n=== Test Results Summary ===');
    for (const [test, result] of Object.entries(results)) {
        console.log(`${test}: ${result ? '✅ PASSED' : '❌ FAILED'}`);
    }
    
    const allPassed = Object.values(results).every(result => result);
    console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    // Cleanup: remove test data
    console.log('\nCleaning up test data...');
    await SecuritySettings.deleteOne({ userId: testUserId });
    await NotificationPreferences.deleteOne({ userId: testUserId });
    console.log('Test data cleaned up');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
}

// Run the tests
runTests().catch(error => {
    console.error('Error running tests:', error);
    mongoose.disconnect();
});
