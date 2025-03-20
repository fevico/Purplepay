/**
 * Test script for security features
 * 
 * This script tests the security features of the Purplepay backend,
 * including trusted device management, high-value transfer authentication,
 * and notification preferences.
 * 
 * To run this script:
 * 1. Start the server
 * 2. Run: node test-security-features.js
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876';
let authToken = '';
let userId = '';

// Test user credentials
const testUser = {
    email: 'test@example.com',
    password: 'Password123!'
};

// Device IDs for testing
const deviceIds = {
    mobile: `mobile-${Date.now()}`,
    desktop: `desktop-${Date.now()}`
};

// Helper function to make authenticated requests
const api = {
    get: async (endpoint) => {
        return axios.get(`${API_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
    },
    post: async (endpoint, data) => {
        return axios.post(`${API_URL}${endpoint}`, data, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
    },
    put: async (endpoint, data) => {
        return axios.put(`${API_URL}${endpoint}`, data, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
    },
    delete: async (endpoint) => {
        return axios.delete(`${API_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
    }
};

// Test functions
async function login() {
    try {
        console.log('Logging in...');
        const response = await axios.post(`${API_URL}/auth/login`, testUser);
        authToken = response.data.token;
        userId = response.data.user.id;
        console.log('Login successful!');
        return true;
    } catch (error) {
        console.error('Login failed:', error.response?.data || error.message);
        return false;
    }
}

async function testSecuritySettings() {
    try {
        console.log('\n--- Testing Security Settings ---');
        
        // Get current security settings
        console.log('Getting security settings...');
        const getResponse = await api.get('/security/settings');
        console.log('Current settings:', getResponse.data.securitySettings);
        
        // Update security settings
        console.log('Updating security settings...');
        const updateResponse = await api.put('/security/settings', {
            highValueTransferThreshold: 50000,
            requireAdditionalAuthForHighValue: true,
            skipAuthForTrustedDevices: true
        });
        console.log('Updated settings:', updateResponse.data.securitySettings);
        
        return true;
    } catch (error) {
        console.error('Security settings test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testTrustedDevices() {
    try {
        console.log('\n--- Testing Trusted Devices ---');
        
        // Add trusted devices
        console.log('Adding mobile device...');
        const addMobileResponse = await api.post('/security/trusted-devices', {
            deviceId: deviceIds.mobile,
            deviceName: 'Test Mobile Device'
        });
        console.log('Mobile device added:', addMobileResponse.data.trustedDevice);
        
        console.log('Adding desktop device...');
        const addDesktopResponse = await api.post('/security/trusted-devices', {
            deviceId: deviceIds.desktop,
            deviceName: 'Test Desktop Device'
        });
        console.log('Desktop device added:', addDesktopResponse.data.trustedDevice);
        
        // Get trusted devices
        console.log('Getting trusted devices...');
        const getResponse = await api.get('/security/trusted-devices');
        console.log('Trusted devices:', getResponse.data.trustedDevices);
        
        // Update trusted device
        console.log('Updating desktop device...');
        const updateResponse = await api.put(`/security/trusted-devices/${deviceIds.desktop}`, {
            deviceName: 'Updated Desktop Device'
        });
        console.log('Updated device:', updateResponse.data.trustedDevice);
        
        // Verify trusted device
        console.log('Verifying mobile device...');
        const verifyResponse = await api.post('/security/verify-device', {
            deviceId: deviceIds.mobile
        });
        console.log('Verification result:', verifyResponse.data);
        
        // Remove desktop device
        console.log('Removing desktop device...');
        const deleteResponse = await api.delete(`/security/trusted-devices/${deviceIds.desktop}`);
        console.log('Remove result:', deleteResponse.data);
        
        // Get trusted devices again to confirm
        console.log('Getting trusted devices after removal...');
        const getFinalResponse = await api.get('/security/trusted-devices');
        console.log('Final trusted devices:', getFinalResponse.data.trustedDevices);
        
        return true;
    } catch (error) {
        console.error('Trusted devices test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testNotificationPreferences() {
    try {
        console.log('\n--- Testing Notification Preferences ---');
        
        // Get current notification preferences
        console.log('Getting notification preferences...');
        const getResponse = await api.get('/notification-preferences');
        console.log('Current preferences:', getResponse.data.notificationPreferences);
        
        // Update notification preferences
        console.log('Updating notification preferences...');
        const updateResponse = await api.put('/notification-preferences', {
            channels: {
                inApp: true,
                email: true,
                sms: false
            },
            preferences: {
                transfers: true,
                security: true,
                highValueTransfers: false
            }
        });
        console.log('Updated preferences:', updateResponse.data.notificationPreferences);
        
        // Reset notification preferences
        console.log('Resetting notification preferences...');
        const resetResponse = await api.post('/notification-preferences/reset');
        console.log('Reset preferences:', resetResponse.data.notificationPreferences);
        
        return true;
    } catch (error) {
        console.error('Notification preferences test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testHighValueTransfer() {
    try {
        console.log('\n--- Testing High-Value Transfer Authentication ---');
        
        // This is a mock test since we don't have an actual transfer to verify
        console.log('Simulating high-value transfer verification...');
        const mockTransferId = `transfer-${Date.now()}`;
        const mockVerificationCode = '123456';
        
        const verifyResponse = await api.post('/security/verify-high-value-transfer', {
            transferId: mockTransferId,
            verificationCode: mockVerificationCode,
            deviceId: deviceIds.mobile
        });
        console.log('Verification result:', verifyResponse.data);
        
        return true;
    } catch (error) {
        console.error('High-value transfer test failed:', error.response?.data || error.message);
        return false;
    }
}

async function testNotifications() {
    try {
        console.log('\n--- Testing Notifications ---');
        
        // Get notifications
        console.log('Getting notifications...');
        const getResponse = await api.get('/notifications');
        console.log(`Retrieved ${getResponse.data.notifications.length} notifications`);
        
        // If there are notifications, mark the first one as read
        if (getResponse.data.notifications.length > 0) {
            const notificationId = getResponse.data.notifications[0]._id;
            console.log(`Marking notification ${notificationId} as read...`);
            const markReadResponse = await api.put(`/notifications/${notificationId}/read`);
            console.log('Mark read result:', markReadResponse.data);
        }
        
        return true;
    } catch (error) {
        console.error('Notifications test failed:', error.response?.data || error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('=== Starting Security Features Tests ===\n');
    
    // Login first
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.error('Tests aborted due to login failure');
        return;
    }
    
    // Run tests
    const results = {
        securitySettings: await testSecuritySettings(),
        trustedDevices: await testTrustedDevices(),
        notificationPreferences: await testNotificationPreferences(),
        highValueTransfer: await testHighValueTransfer(),
        notifications: await testNotifications()
    };
    
    // Print summary
    console.log('\n=== Test Results Summary ===');
    for (const [test, result] of Object.entries(results)) {
        console.log(`${test}: ${result ? '✅ PASSED' : '❌ FAILED'}`);
    }
    
    const allPassed = Object.values(results).every(result => result);
    console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
}

// Run the tests
runTests().catch(error => {
    console.error('Error running tests:', error);
});
