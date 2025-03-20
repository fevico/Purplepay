/**
 * Test script for notification services
 * 
 * This script tests the email and SMS notification services
 * 
 * To run this script:
 * 1. Make sure MongoDB is running
 * 2. Run: node test-notification-services.js
 */

// Import required modules
const mongoose = require('mongoose');
require('dotenv').config();

// Import notification service
const { sendEmail, sendSMS, verifySMSCode } = require('./dist/services/notificationService');
const { logger } = require('./dist/utils/logger');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/purplepay')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Test email and SMS functions
async function testEmailService() {
    console.log('\n--- Testing Email Service ---');
    
    try {
        // Test sending an email
        const testEmail = 'test@example.com'; // Replace with a real email for actual testing
        const emailResult = await sendEmail(
            testEmail,
            'Purplepay Test Email',
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #6200ea; margin: 0;">Purplepay</h1>
                </div>
                <div style="margin-bottom: 20px;">
                    <h2 style="color: #333;">Test Email</h2>
                    <p style="color: #555; line-height: 1.5;">This is a test email from the Purplepay notification system.</p>
                    <p style="color: #555; line-height: 1.5;">If you received this email, the email service is working correctly.</p>
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #888; font-size: 12px;">
                    <p>This is an automated message from Purplepay. Please do not reply to this email.</p>
                    <p>If you have any questions, please contact our support team.</p>
                </div>
            </div>
            `
        );
        
        console.log('Email sending result:', emailResult);
        console.log('Email test result:', emailResult.success ? '✅ PASSED' : '❌ FAILED');
        
        return emailResult.success;
    } catch (error) {
        console.error('Email test error:', error);
        return false;
    }
}

async function testSMSService() {
    console.log('\n--- Testing SMS Service ---');
    
    try {
        // Test sending an SMS
        const testPhone = '+1234567890'; // Replace with a real phone number for actual testing
        const smsResult = await sendSMS(
            testPhone,
            'Purplepay: This is a test SMS message from the Purplepay notification system.'
        );
        
        console.log('SMS sending result:', smsResult);
        console.log('SMS test result:', smsResult.success ? '✅ PASSED' : '❌ FAILED');
        
        // Test verifying an SMS code
        if (smsResult.success) {
            console.log('\nTesting SMS verification...');
            console.log('Enter the code you received on your phone:');
            
            // For testing purposes, we'll just simulate a successful verification
            const verificationResult = await verifySMSCode(testPhone, '123456');
            
            console.log('SMS verification result:', verificationResult);
            console.log('SMS verification test result:', verificationResult.success ? '✅ PASSED' : '❌ FAILED');
            
            return verificationResult.success;
        }
        
        return smsResult.success;
    } catch (error) {
        console.error('SMS test error:', error);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('=== Starting Notification Services Tests ===\n');
    
    // Run tests
    const results = {
        emailService: await testEmailService(),
        smsService: await testSMSService()
    };
    
    // Print summary
    console.log('\n=== Test Results Summary ===');
    for (const [test, result] of Object.entries(results)) {
        console.log(`${test}: ${result ? '✅ PASSED' : '❌ FAILED'}`);
    }
    
    const allPassed = Object.values(results).every(result => result);
    console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
}

// Run the tests
runTests().catch(error => {
    console.error('Error running tests:', error);
    mongoose.disconnect();
});
