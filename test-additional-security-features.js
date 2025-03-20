/**
 * Test script for additional security features
 * 
 * This script tests the security features of the Purplepay backend,
 * including security settings, trusted device management, high-value transfer authentication,
 * notification preferences, and notifications.
 * 
 * To run this script:
 * 1. Start the server
 * 2. Run: node test-additional-security-features.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:9876';
let authToken = '';
let userId = '';

// Test user credentials
const testUser = {
    email: 'security-test@example.com',
    password: 'SecurePassword123!'
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
        console.log('Attempting to login...');
        
        // Try to read token from file
        try {
            const tokenPath = path.join(__dirname, 'jwt-token.txt');
            if (fs.existsSync(tokenPath)) {
                authToken = fs.readFileSync(tokenPath, 'utf8').trim();
                console.log('Using token from jwt-token.txt');
                return;
            }
        } catch (error) {
            console.log('Could not read token from file, logging in...');
        }
        
        const response = await axios.post(`${API_URL}/auth/login`, testUser);
        authToken = response.data.token;
        userId = response.data.user.id;
        
        // Save token to file
        fs.writeFileSync(path.join(__dirname, 'jwt-token.txt'), authToken);
        console.log('JWT token saved to jwt-token.txt');
        
    } catch (error) {
        console.error('Login failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

async function testSecuritySettings() {
    console.log('\n=== Testing Security Settings ===');
    try {
        // Get security settings
        console.log('Getting security settings...');
        const getResponse = await api.get('/security/settings');
        console.log('✅ PASSED: Get Security Settings');
        console.log('Current settings:', getResponse.data.settings);
        
        // Update security settings
        console.log('\nUpdating security settings...');
        const updateResponse = await api.put('/security/settings', {
            twoFactorEnabled: true,
            loginNotifications: true,
            transactionNotifications: true,
            highValueTransferThreshold: 50000,
            requireAdditionalAuthForHighValue: true
        });
        console.log('✅ PASSED: Update Security Settings');
        console.log('Updated settings:', updateResponse.data.settings);
        
        // Test invalid input
        console.log('\nTesting invalid input...');
        try {
            await api.put('/security/settings', {
                highValueTransferThreshold: -1000
            });
            console.log('❌ FAILED: Should reject negative threshold');
        } catch (error) {
            console.log('✅ PASSED: Rejected negative threshold');
        }
        
        try {
            await api.put('/security/settings', {
                highValueTransferThreshold: 20000000
            });
            console.log('❌ FAILED: Should reject threshold above maximum');
        } catch (error) {
            console.log('✅ PASSED: Rejected threshold above maximum');
        }
        
    } catch (error) {
        console.error('Security settings test failed:', error.response?.data || error.message);
    }
}

async function testTrustedDevices() {
    console.log('\n=== Testing Trusted Device Management ===');
    try {
        // Add mobile device
        console.log('Adding mobile device...');
        const addMobileResponse = await api.post('/security/trusted-devices', {
            deviceId: deviceIds.mobile,
            deviceName: 'Test Mobile Device',
            deviceType: 'mobile'
        });
        console.log('✅ PASSED: Add Mobile Device');
        
        // Add desktop device
        console.log('\nAdding desktop device...');
        const addDesktopResponse = await api.post('/security/trusted-devices', {
            deviceId: deviceIds.desktop,
            deviceName: 'Test Desktop Device',
            deviceType: 'desktop'
        });
        console.log('✅ PASSED: Add Desktop Device');
        
        // Get trusted devices
        console.log('\nGetting trusted devices...');
        const getResponse = await api.get('/security/trusted-devices');
        console.log('✅ PASSED: Get Trusted Devices');
        console.log('Trusted devices:', getResponse.data.devices);
        
        // Update desktop device
        console.log('\nUpdating desktop device...');
        const updateResponse = await api.put(`/security/trusted-devices/${deviceIds.desktop}`, {
            deviceName: 'Updated Desktop Device'
        });
        console.log('✅ PASSED: Update Trusted Device');
        console.log('Updated device:', updateResponse.data.device);
        
        // Verify device
        console.log('\nVerifying device...');
        const verifyResponse = await api.post('/security/verify-device', {
            deviceId: deviceIds.mobile,
            verificationCode: '123456'
        });
        console.log('✅ PASSED: Verify Device');
        
        // Test invalid verification code
        console.log('\nTesting invalid verification code...');
        try {
            await api.post('/security/verify-device', {
                deviceId: deviceIds.mobile,
                verificationCode: 'abc'
            });
            console.log('❌ FAILED: Should reject non-numeric verification code');
        } catch (error) {
            console.log('✅ PASSED: Rejected non-numeric verification code');
        }
        
        // Delete desktop device
        console.log('\nDeleting desktop device...');
        const deleteResponse = await api.delete(`/security/trusted-devices/${deviceIds.desktop}`);
        console.log('✅ PASSED: Delete Trusted Device');
        
        // Get trusted devices after deletion
        console.log('\nGetting trusted devices after deletion...');
        const getFinalResponse = await api.get('/security/trusted-devices');
        console.log('✅ PASSED: Get Trusted Devices After Deletion');
        console.log('Remaining trusted devices:', getFinalResponse.data.devices);
        
    } catch (error) {
        console.error('Trusted device test failed:', error.response?.data || error.message);
    }
}

async function testHighValueTransfer() {
    console.log('\n=== Testing High-Value Transfer Authentication ===');
    try {
        // Verify high-value transfer
        console.log('Verifying high-value transfer...');
        const verifyResponse = await api.post('/security/verify-high-value-transfer', {
            transferId: `transfer-${Date.now()}`,
            verificationCode: '123456'
        });
        console.log('✅ PASSED: Verify High-Value Transfer');
        console.log('Response:', verifyResponse.data);
        
        // Test invalid verification code
        console.log('\nTesting invalid verification code...');
        try {
            await api.post('/security/verify-high-value-transfer', {
                transferId: `transfer-${Date.now()}`,
                verificationCode: 'abc'
            });
            console.log('❌ FAILED: Should reject non-numeric verification code');
        } catch (error) {
            console.log('✅ PASSED: Rejected non-numeric verification code');
        }
        
    } catch (error) {
        console.error('High-value transfer test failed:', error.response?.data || error.message);
    }
}

async function testNotificationPreferences() {
    console.log('\n=== Testing Notification Preferences ===');
    try {
        // Get notification preferences
        console.log('Getting notification preferences...');
        const getResponse = await api.get('/notification-preferences');
        console.log('✅ PASSED: Get Notification Preferences');
        console.log('Current preferences:', getResponse.data.preferences);
        
        // Update notification preferences
        console.log('\nUpdating notification preferences...');
        const updateResponse = await api.put('/notification-preferences', {
            email: true,
            push: true,
            sms: true,
            loginAlerts: true,
            paymentAlerts: true,
            promotionalAlerts: false
        });
        console.log('✅ PASSED: Update Notification Preferences');
        console.log('Updated preferences:', updateResponse.data.preferences);
        
        // Reset notification preferences
        console.log('\nResetting notification preferences...');
        const resetResponse = await api.post('/notification-preferences/reset');
        console.log('✅ PASSED: Reset Notification Preferences');
        console.log('Reset preferences:', resetResponse.data.preferences);
        
    } catch (error) {
        console.error('Notification preferences test failed:', error.response?.data || error.message);
    }
}

async function testNotifications() {
    console.log('\n=== Testing Notifications ===');
    try {
        // Get notifications
        console.log('Getting notifications...');
        const getResponse = await api.get('/notifications');
        console.log('✅ PASSED: Get Notifications');
        console.log('Notifications count:', getResponse.data.notifications.length);
        
        // Mark a notification as read
        if (getResponse.data.notifications.length > 0) {
            const notificationId = getResponse.data.notifications[0].id;
            console.log('\nMarking notification as read:', notificationId);
            const markReadResponse = await api.put(`/notifications/${notificationId}/read`);
            console.log('✅ PASSED: Mark Notification as Read');
            console.log('Updated notification:', markReadResponse.data.notification);
        } else {
            console.log('\nNo notifications to mark as read');
        }
        
    } catch (error) {
        console.error('Notifications test failed:', error.response?.data || error.message);
    }
}

async function testAuthenticationRequirements() {
    console.log('\n=== Testing Authentication Requirements ===');
    
    const endpoints = [
        { method: 'get', url: '/security/settings' },
        { method: 'put', url: '/security/settings', data: { loginNotifications: true } },
        { method: 'post', url: '/security/trusted-devices', data: { deviceId: 'test', deviceName: 'Test', deviceType: 'mobile' } },
        { method: 'get', url: '/security/trusted-devices' },
        { method: 'post', url: '/security/verify-device', data: { deviceId: 'test', verificationCode: '123456' } },
        { method: 'post', url: '/security/verify-high-value-transfer', data: { transferId: 'test', verificationCode: '123456' } },
        { method: 'get', url: '/notification-preferences' },
        { method: 'put', url: '/notification-preferences', data: { email: true } },
        { method: 'post', url: '/notification-preferences/reset' },
        { method: 'get', url: '/notifications' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`Testing ${endpoint.method.toUpperCase()} ${endpoint.url} without token...`);
            if (endpoint.method === 'get') {
                await axios.get(`${API_URL}${endpoint.url}`);
            } else if (endpoint.method === 'post') {
                await axios.post(`${API_URL}${endpoint.url}`, endpoint.data || {});
            } else if (endpoint.method === 'put') {
                await axios.put(`${API_URL}${endpoint.url}`, endpoint.data || {});
            } else if (endpoint.method === 'delete') {
                await axios.delete(`${API_URL}${endpoint.url}`);
            }
            console.log(`❌ FAILED: ${endpoint.method.toUpperCase()} ${endpoint.url} - Should require authentication`);
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log(`✅ PASSED: ${endpoint.method.toUpperCase()} ${endpoint.url} - Requires authentication`);
            } else {
                console.log(`❌ FAILED: ${endpoint.method.toUpperCase()} ${endpoint.url} - Unexpected error:`, error.response?.data || error.message);
            }
        }
    }
}

async function testInputValidation() {
    console.log('\n=== Testing Input Validation ===');
    
    // Test cases for input validation
    const testCases = [
        {
            name: 'Security Settings - Invalid Threshold',
            endpoint: '/security/settings',
            method: 'put',
            data: { highValueTransferThreshold: -1000 },
            expectError: true
        },
        {
            name: 'Trusted Device - Missing Required Fields',
            endpoint: '/security/trusted-devices',
            method: 'post',
            data: { deviceId: 'test' }, // Missing deviceName and deviceType
            expectError: true
        },
        {
            name: 'Verify Device - Invalid Verification Code',
            endpoint: '/security/verify-device',
            method: 'post',
            data: { deviceId: 'test', verificationCode: 'abc' },
            expectError: true
        },
        {
            name: 'High-Value Transfer - Invalid Verification Code',
            endpoint: '/security/verify-high-value-transfer',
            method: 'post',
            data: { transferId: 'test', verificationCode: '12345' }, // Not 6 digits
            expectError: true
        }
    ];
    
    for (const testCase of testCases) {
        try {
            console.log(`Testing ${testCase.name}...`);
            if (testCase.method === 'post') {
                await api.post(testCase.endpoint, testCase.data);
            } else if (testCase.method === 'put') {
                await api.put(testCase.endpoint, testCase.data);
            }
            
            if (testCase.expectError) {
                console.log(`❌ FAILED: ${testCase.name} - Should have rejected invalid input`);
            } else {
                console.log(`✅ PASSED: ${testCase.name}`);
            }
        } catch (error) {
            if (testCase.expectError) {
                console.log(`✅ PASSED: ${testCase.name} - Rejected invalid input`);
            } else {
                console.log(`❌ FAILED: ${testCase.name} - Unexpected error:`, error.response?.data || error.message);
            }
        }
    }
}

// Run all tests
async function runTests() {
    try {
        console.log('=== Additional Security Features Tests ===');
        console.log(`Starting tests at: ${new Date().toISOString()}`);
        console.log('-----------------------------------');
        
        await login();
        
        // Test authentication requirements first
        await testAuthenticationRequirements();
        
        // Test input validation
        await testInputValidation();
        
        // Test individual features
        await testSecuritySettings();
        await testTrustedDevices();
        await testHighValueTransfer();
        await testNotificationPreferences();
        await testNotifications();
        
        console.log('\n=== Test Summary ===');
        console.log('All tests completed. Check the logs for any failures.');
        
    } catch (error) {
        console.error('Error running tests:', error);
    }
}

// Run the tests
runTests().catch(error => {
    console.error('Error running tests:', error);
});
