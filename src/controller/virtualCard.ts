import { RequestHandler } from "express";
import axios, { AxiosError } from "axios";
import strollwalletClient from "../services/strollwallet";
import { logger } from "../utils/logger";

const PUBLIC_KEY = process.env.PUBLIC_KEY;

export const createCustomer: RequestHandler = async (req, res) => {
    const { houseNumber, firstName, lastName, idNumber, customerEmail, phoneNumber, dateOfBirth, idImage, userPhoto,line1, state, zipCode, city, country, idType } = req.body;

    if (!firstName) {
        return res.status(400).json({ message: "firstName is required" });
    }
    
    if (!lastName) {
        return res.status(400).json({ message: "lastName is required" });
    }
    
    if (!customerEmail) {
        return res.status(400).json({ message: "customerEmail is required" });
    }
    
    if (!phoneNumber) {
        return res.status(400).json({ message: "phoneNumber is required" });
    }
    
    if (!PUBLIC_KEY) {
        return res.status(500).json({ message: "StrollWallet API key not configured" });
    }
 
    try {
        // Log the request
        logger.info('Creating customer', { 
            userId: req.user?.id,
            customerEmail
        });
        
        // Call StrollWallet API client
        const response = await strollwalletClient.createCustomer({
            firstName,
            lastName,
            customerEmail,
            phoneNumber,
            dateOfBirth,
            idImage,
            userPhoto,
            line1,
            state,
            zipCode,
            city,
            country,
            idType,
            houseNumber,
            idNumber
        });
        
        return res.status(200).json(response);
    } catch (error) {
        logger.error('Error creating customer', { 
            userId: req.user?.id,
            customerEmail,
            error: error instanceof AxiosError ? error.response?.data : error
        });
        
        if (error instanceof AxiosError) {
            return res.status(error.response?.status || 500).json(error.response?.data || { message: "Error creating customer" });
        }
        
        return res.status(500).json({ message: "Error creating customer" });
    }
}

export const createCard: RequestHandler = async (req, res) => {
    const { name_on_card, amount, customerEmail } = req.body;

    if (!name_on_card) {
        return res.status(400).json({ message: "name_on_card is required" });
    }
    
    if (!amount) {
        return res.status(400).json({ message: "amount is required" });
    }
    
    if (!customerEmail) {
        return res.status(400).json({ message: "customerEmail is required" });
    }
    
    if (!PUBLIC_KEY) {
        return res.status(500).json({ message: "StrollWallet API key not configured" });
    }

    try {
        // Log the request
        logger.info('Creating card', { 
            userId: req.user?.id,
            customerEmail,
            amount
        });
        
        // Call StrollWallet API client
        const response = await strollwalletClient.createCard({
            name_on_card,
            amount,
            customerEmail
        });
        
        return res.status(200).json(response);
    } catch (error) {
        logger.error('Error creating card', { 
            userId: req.user?.id,
            customerEmail,
            error: error instanceof AxiosError ? error.response?.data : error
        });
        
        if (error instanceof AxiosError) {
            return res.status(error.response?.status || 500).json(error.response?.data || { message: "Error creating card" });
        }
        
        return res.status(500).json({ message: "Error creating card" });
    }
}

export const fundCard: RequestHandler = async (req, res) => {
    const { card_id, amount } = req.body;

    if (!card_id) {
        return res.status(400).json({ message: "card_id is required" });
    }
    
    if (!amount) {
        return res.status(400).json({ message: "amount is required" });
    }
    
    if (!PUBLIC_KEY) {
        return res.status(500).json({ message: "StrollWallet API key not configured" });
    }
    
    try {
        // Log the request
        logger.info('Funding card', { 
            userId: req.user?.id,
            cardId: card_id,
            amount
        });
        
        // Call StrollWallet API client
        const response = await strollwalletClient.fundCard({
            card_id,
            amount
        });
        
        // Store funding data for middleware
        res.locals.fundingData = {
            cardId: card_id,
            amount,
            currency: "NGN",
            reference: `FUND-${Date.now()}`
        };
        
        return res.status(200).json(response);
    } catch (error) {
        logger.error('Error funding card', { 
            userId: req.user?.id,
            cardId: card_id,
            error: error instanceof AxiosError ? error.response?.data : error
        });
        
        if (error instanceof AxiosError) {
            return res.status(error.response?.status || 500).json(error.response?.data || { message: "Error funding card" });
        }
        
        return res.status(500).json({ message: "Error funding card" });
    }
}

export const cardDetails: RequestHandler = async (req, res) => {
    const { card_id } = req.body;

    if (!card_id) {
        return res.status(400).json({ message: "card_id is required" });
    }
    
    if (!PUBLIC_KEY) {
        return res.status(500).json({ message: "StrollWallet API key not configured" });
    }
    
    try {
        // Log the request
        logger.info('Getting card details', { 
            userId: req.user?.id,
            cardId: card_id
        });
        
        // Call StrollWallet API client
        const response = await strollwalletClient.cardDetails({
            card_id
        });
        
        return res.status(200).json(response);
    } catch (error) {
        logger.error('Error getting card details', { 
            userId: req.user?.id,
            cardId: card_id,
            error: error instanceof AxiosError ? error.response?.data : error
        });
        
        if (error instanceof AxiosError) {
            return res.status(error.response?.status || 500).json(error.response?.data || { message: "Error getting card details" });
        }
        
        return res.status(500).json({ message: "Error getting card details" });
    }
}

export const cardTransactions: RequestHandler = async (req, res) => {
    const { card_id } = req.body;

    if (!card_id) {
        return res.status(400).json({ message: "card_id is required" });
    }
    
    if (!PUBLIC_KEY) {
        return res.status(500).json({ message: "StrollWallet API key not configured" });
    }
    
    try {
        // Log the request
        logger.info('Getting card transactions', { 
            userId: req.user?.id,
            cardId: card_id
        });
        
        // Call StrollWallet API client
        const response = await strollwalletClient.cardTransactions({
            card_id
        });
        
        // Store transaction data for middleware if there are transactions
        if (response.response && Array.isArray(response.response.transactions) && response.response.transactions.length > 0) {
            // Process each transaction for rewards
            response.response.transactions.forEach((transaction: any) => {
                if (transaction.status === "completed" && !transaction.processed_for_rewards) {
                    res.locals.cardTransaction = {
                        cardId: card_id,
                        amount: transaction.amount,
                        currency: transaction.currency,
                        reference: transaction.reference,
                        description: transaction.description,
                        merchantName: transaction.merchant_name
                    };
                    
                    // Mark as processed to avoid duplicate rewards
                    transaction.processed_for_rewards = true;
                }
            });
        }
        
        return res.status(200).json(response);
    } catch (error) {
        logger.error('Error getting card transactions', { 
            userId: req.user?.id,
            cardId: card_id,
            error: error instanceof AxiosError ? error.response?.data : error
        });
        
        if (error instanceof AxiosError) {
            return res.status(error.response?.status || 500).json(error.response?.data || { message: "Error getting card transactions" });
        }
        
        return res.status(500).json({ message: "Error getting card transactions" });
    }
}

export const freezeAndUnfreezeCard: RequestHandler = async (req, res) => {
    const { card_id, status } = req.body;

    if (!card_id) {
        return res.status(400).json({ message: "card_id is required" });
    }
    
    if (!status || !['freeze', 'unfreeze'].includes(status)) {
        return res.status(400).json({ message: "status is required and must be 'freeze' or 'unfreeze'" });
    }
    
    if (!PUBLIC_KEY) {
        return res.status(500).json({ message: "StrollWallet API key not configured" });
    }
    
    try {
        // Log the request
        logger.info(`${status === 'freeze' ? 'Freezing' : 'Unfreezing'} card`, { 
            userId: req.user?.id,
            cardId: card_id,
            status
        });
        
        // Call StrollWallet API client
        const response = await strollwalletClient.freezeUnfreezeCard({
            card_id,
            status: status as 'freeze' | 'unfreeze'
        });
        
        return res.status(200).json(response);
    } catch (error) {
        logger.error(`Error ${status === 'freeze' ? 'freezing' : 'unfreezing'} card`, { 
            userId: req.user?.id,
            cardId: card_id,
            error: error instanceof AxiosError ? error.response?.data : error
        });
        
        if (error instanceof AxiosError) {
            return res.status(error.response?.status || 500).json(error.response?.data || { message: `Error ${status === 'freeze' ? 'freezing' : 'unfreezing'} card` });
        }
        
        return res.status(500).json({ message: `Error ${status === 'freeze' ? 'freezing' : 'unfreezing'} card` });
    }
};

export const cardHistory: RequestHandler = async (req, res) => {
    const { card_id } = req.query;

    if (!card_id) {
        return res.status(400).json({ message: "card_id is required" });
    }
    
    if (!PUBLIC_KEY) {
        return res.status(500).json({ message: "StrollWallet API key not configured" });
    }
    
    try {
        // Log the request
        logger.info('Getting card history', { 
            userId: req.user?.id,
            cardId: card_id
        });
        
        // Call StrollWallet API client
        const response = await strollwalletClient.cardHistory({
            card_id: card_id as string
        });
        
        return res.status(200).json(response);
    } catch (error) {
        logger.error('Error getting card history', { 
            userId: req.user?.id,
            cardId: card_id,
            error: error instanceof AxiosError ? error.response?.data : error
        });
        
        if (error instanceof AxiosError) {
            return res.status(error.response?.status || 500).json(error.response?.data || { message: "Error getting card history" });
        }
        
        return res.status(500).json({ message: "Error getting card history" });
    }
}

export const withdrawFromCard: RequestHandler = async (req, res) => {
    const { card_id, amount } = req.body;

    if (!card_id) {
        return res.status(400).json({ message: "card_id is required" });
    }
    
    if (!amount) {
        return res.status(400).json({ message: "amount is required" });
    }
    
    if (!PUBLIC_KEY) {
        return res.status(500).json({ message: "StrollWallet API key not configured" });
    }
    
    try {
        // Log the request
        logger.info('Withdrawing from card', { 
            userId: req.user?.id,
            cardId: card_id,
            amount
        });
        
        // Call StrollWallet API client
        const response = await strollwalletClient.withdrawFromCard({
            card_id,
            amount
        });
        
        // Store withdrawal data for middleware
        res.locals.withdrawalData = {
            cardId: card_id,
            amount,
            currency: "NGN",
            reference: `WDRW-${Date.now()}`
        };
        
        return res.status(200).json(response);
    } catch (error) {
        logger.error('Error withdrawing from card', { 
            userId: req.user?.id,
            cardId: card_id,
            error: error instanceof AxiosError ? error.response?.data : error
        });
        
        if (error instanceof AxiosError) {
            return res.status(error.response?.status || 500).json(error.response?.data || { message: "Error withdrawing from card" });
        }
        
        return res.status(500).json({ message: "Error withdrawing from card" });
    }
}

export const cardStatus: RequestHandler = async (req, res) => {
    const { card_id } = req.body;

    if (!card_id) {
        return res.status(400).json({ message: "card_id is required" });
    }
    
    if (!PUBLIC_KEY) {
        return res.status(500).json({ message: "StrollWallet API key not configured" });
    }
    
    try {
        // Log the request
        logger.info('Getting card status', { 
            userId: req.user?.id,
            cardId: card_id
        });
        
        // Call StrollWallet API client
        const response = await strollwalletClient.cardStatus({
            card_id
        });
        
        return res.status(200).json(response);
    } catch (error) {
        logger.error('Error getting card status', { 
            userId: req.user?.id,
            cardId: card_id,
            error: error instanceof AxiosError ? error.response?.data : error
        });
        
        if (error instanceof AxiosError) {
            return res.status(error.response?.status || 500).json(error.response?.data || { message: "Error getting card status" });
        }
        
        return res.status(500).json({ message: "Error getting card status" });
    }
}