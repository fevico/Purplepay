import { Request, Response } from 'express';
import axios from 'axios';
import logger from '../utils/logger';
import User from '../models/user';
import { createNotification } from './notification';
import dotenv from 'dotenv';

dotenv.config();

// Strowallet API configuration
const STROWALLET_API_URL = 'https://strowallet.com/api';
const STROWALLET_PUBLIC_KEY = process.env.STROWALLET_PUBLIC_KEY || 'your_public_key_here';
const STROWALLET_MODE = process.env.NODE_ENV === 'production' ? 'live' : 'sandbox';

/**
 * Verify a user's BVN using the Strowallet API
 * @route POST /bvn/verify
 */
export const verifyBvn = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const { bvn, firstName, lastName, dateOfBirth, phoneNumber } = req.body;

        // Validate input
        if (!bvn) {
            return res.status(400).json({
                success: false,
                message: 'BVN is required'
            });
        }

        if (!firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'First name and last name are required'
            });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Make request to Strowallet API
        const apiUrl = `${STROWALLET_API_URL}/kyc_bvn/`;
        
        const params = {
            public_key: STROWALLET_PUBLIC_KEY,
            number: bvn,
            firstName: firstName.toUpperCase(),
            lastName: lastName.toUpperCase(),
            dateOfBirth: dateOfBirth || '', // Format: DD-MM-YYYY
            phoneNumber: phoneNumber || '',
            mode: STROWALLET_MODE
        };

        logger.info(`Verifying BVN for user ${userId}`, { userId, bvn });

        // Use sandbox data for testing
        if (STROWALLET_MODE === 'sandbox') {
            // For sandbox testing, simulate a successful verification
            const mockResponse = {
                status: "success",
                message: "BVN verification successful",
                data: {
                    bvn: bvn,
                    firstName: firstName.toUpperCase(),
                    lastName: lastName.toUpperCase(),
                    middleName: "",
                    dateOfBirth: dateOfBirth || "01-01-1990",
                    phoneNumber: phoneNumber || "08012345678",
                    gender: "Male",
                    verified: true,
                    transactionRef: `TRX-${Date.now()}`
                }
            };

            // Update user's BVN verification status
            user.bvnVerified = true;
            user.bvnVerificationDate = new Date();
            user.bvnData = mockResponse.data;
            await user.save();

            // Create notification
            await createNotification({
                userId,
                type: 'security',
                title: 'BVN Verification Successful',
                message: 'Your BVN has been successfully verified.',
                reference: mockResponse.data.transactionRef
            });

            return res.status(200).json({
                success: true,
                message: 'BVN verified successfully',
                data: {
                    verified: true,
                    bvn: bvn,
                    name: `${firstName} ${lastName}`,
                    transactionRef: mockResponse.data.transactionRef
                }
            });
        }

        // Make actual API call in production
        const response = await axios.post(apiUrl, null, { params });
        
        if (response.data.status === 'success') {
            // Update user's BVN verification status
            user.bvnVerified = true;
            user.bvnVerificationDate = new Date();
            user.bvnData = response.data.data;
            await user.save();

            // Create notification
            await createNotification({
                userId,
                type: 'security',
                title: 'BVN Verification Successful',
                message: 'Your BVN has been successfully verified.',
                reference: response.data.data.transactionRef
            });

            return res.status(200).json({
                success: true,
                message: 'BVN verified successfully',
                data: {
                    verified: true,
                    bvn: bvn,
                    name: `${response.data.data.firstName} ${response.data.data.lastName}`,
                    transactionRef: response.data.data.transactionRef
                }
            });
        } else {
            logger.error(`BVN verification failed for user ${userId}`, { 
                userId, 
                error: response.data.message 
            });

            return res.status(400).json({
                success: false,
                message: response.data.message || 'BVN verification failed',
                data: {
                    verified: false
                }
            });
        }
    } catch (error: any) {
        logger.error('Error verifying BVN', { error: error.message });
        
        return res.status(500).json({
            success: false,
            message: 'An error occurred while verifying BVN',
            error: error.message
        });
    }
};

/**
 * Get BVN verification status for the authenticated user
 * @route GET /bvn/status
 */
export const getBvnStatus = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                verified: user.bvnVerified || false,
                bvn: user.bvnData?.bvn || null,
                verificationDate: user.bvnVerificationDate || null
            }
        });
    } catch (error: any) {
        logger.error('Error getting BVN status', { error: error.message });
        
        return res.status(500).json({
            success: false,
            message: 'An error occurred while getting BVN status',
            error: error.message
        });
    }
};

/**
 * Confirm BVN with OTP (for two-factor verification)
 * @route POST /bvn/confirm
 */
export const confirmBvnWithOtp = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;
        const { transactionRef, otp } = req.body;

        // Validate input
        if (!transactionRef || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Transaction reference and OTP are required'
            });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Make request to Strowallet API for OTP confirmation
        const apiUrl = `${STROWALLET_API_URL}/kyc_bvnotp/`;
        
        const params = {
            trx: transactionRef,
            otp: otp,
            mode: STROWALLET_MODE
        };

        logger.info(`Confirming BVN with OTP for user ${userId}`, { userId, transactionRef });

        // Use sandbox data for testing
        if (STROWALLET_MODE === 'sandbox') {
            // For sandbox testing, simulate a successful confirmation
            const mockResponse = {
                status: "success",
                message: "BVN confirmation successful",
                data: {
                    confirmed: true
                }
            };

            // Update user's BVN confirmation status
            user.bvnConfirmed = true;
            user.bvnConfirmationDate = new Date();
            await user.save();

            // Create notification
            await createNotification({
                userId,
                type: 'security',
                title: 'BVN Confirmation Successful',
                message: 'Your BVN has been successfully confirmed with OTP.',
                reference: transactionRef
            });

            return res.status(200).json({
                success: true,
                message: 'BVN confirmed successfully',
                data: {
                    confirmed: true
                }
            });
        }

        // Make actual API call in production
        const response = await axios.post(apiUrl, null, { params });
        
        if (response.data.status === 'success') {
            // Update user's BVN confirmation status
            user.bvnConfirmed = true;
            user.bvnConfirmationDate = new Date();
            await user.save();

            // Create notification
            await createNotification({
                userId,
                type: 'security',
                title: 'BVN Confirmation Successful',
                message: 'Your BVN has been successfully confirmed with OTP.',
                reference: transactionRef
            });

            return res.status(200).json({
                success: true,
                message: 'BVN confirmed successfully',
                data: {
                    confirmed: true
                }
            });
        } else {
            logger.error(`BVN confirmation failed for user ${userId}`, { 
                userId, 
                error: response.data.message 
            });

            return res.status(400).json({
                success: false,
                message: response.data.message || 'BVN confirmation failed',
                data: {
                    confirmed: false
                }
            });
        }
    } catch (error: any) {
        logger.error('Error confirming BVN with OTP', { error: error.message });
        
        return res.status(500).json({
            success: false,
            message: 'An error occurred while confirming BVN with OTP',
            error: error.message
        });
    }
};

/**
 * Get BVN details from Strowallet API
 * @route GET /bvn/details
 */
export const getBvnDetails = async (req: Request, res: Response) => {
    try {
        const userId = req.user.id;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user has verified BVN
        if (!user.bvnVerified) {
            return res.status(400).json({
                success: false,
                message: 'BVN not verified yet'
            });
        }

        // Return BVN details from user data
        return res.status(200).json({
            success: true,
            data: {
                bvn: user.bvnData?.bvn || null,
                firstName: user.bvnData?.firstName || null,
                lastName: user.bvnData?.lastName || null,
                middleName: user.bvnData?.middleName || null,
                dateOfBirth: user.bvnData?.dateOfBirth || null,
                phoneNumber: user.bvnData?.phoneNumber || null,
                gender: user.bvnData?.gender || null,
                verified: user.bvnVerified || false,
                confirmed: user.bvnConfirmed || false,
                verificationDate: user.bvnVerificationDate || null
            }
        });
    } catch (error: any) {
        logger.error('Error getting BVN details', { error: error.message });
        
        return res.status(500).json({
            success: false,
            message: 'An error occurred while getting BVN details',
            error: error.message
        });
    }
};
