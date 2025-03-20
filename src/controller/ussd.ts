import { Request, Response } from 'express';
import User from '../models/user';
import Wallet from '../models/wallet';
import Transaction from '../models/transaction';
import { generateTransactionReference } from '../utils/helpers';
import bcrypt from 'bcrypt';

/**
 * USSD Controller for handling USSD requests
 * This provides a backup system for users to access their accounts without internet
 */

// Define session interface for type safety
interface UssdSession {
  phoneNumber: string;
  authenticated: boolean;
  currentMenu: string;
  userId?: string;
  data: Record<string, any>;
  lastActivity: number;
}

// USSD session storage (in production, this should be in Redis or similar)
const ussdSessions: Record<string, UssdSession> = {};

/**
 * Process USSD request
 * @param req Request
 * @param res Response
 */
export const processUssdRequest = async (req: Request, res: Response) => {
  try {
    const { sessionId, serviceCode, phoneNumber, text } = req.body;

    // Initialize or retrieve session
    if (!ussdSessions[sessionId]) {
      ussdSessions[sessionId] = {
        phoneNumber,
        authenticated: false,
        currentMenu: 'main',
        data: {},
        lastActivity: Date.now()
      };
    } else {
      // Update last activity timestamp
      ussdSessions[sessionId].lastActivity = Date.now();
    }

    const session = ussdSessions[sessionId];
    let response = '';

    // Check if user exists based on phone number
    const user = await User.findOne({ phoneNumber: phoneNumber.replace('+', '') });
    
    if (!user && text === '') {
      // User not registered
      response = 'CON Welcome to PurplePay USSD Service\n';
      response += 'You are not registered. Please use our app to register.';
      return res.send({
        session_operation: 'end',
        session_type: 4,
        session_id: sessionId,
        session_msg: response
      });
    }

    // If user exists but not authenticated yet
    if (user && !session.authenticated && text === '') {
      session.userId = user._id.toString();
      response = 'CON Welcome to PurplePay USSD Service\n';
      response += 'Please enter your transaction PIN to continue:';
      session.currentMenu = 'auth';
      return res.send({
        session_operation: 'continue',
        session_type: 1,
        session_id: sessionId,
        session_msg: response
      });
    }

    // Handle authentication
    if (session.currentMenu === 'auth' && user && user.transactionPin) {
      const pin = text;
      
      // Verify transaction PIN
      const isValid = await bcrypt.compare(pin, user.transactionPin);
      
      if (!isValid) {
        response = 'END Invalid transaction PIN. Please try again.';
        delete ussdSessions[sessionId]; // Clear session on failed auth
        return res.send({
          session_operation: 'end',
          session_type: 4,
          session_id: sessionId,
          session_msg: response
        });
      }
      
      // Authentication successful
      session.authenticated = true;
      session.currentMenu = 'main';
      
      // Show main menu
      response = 'CON PurplePay Menu\n';
      response += '1. Check Balance\n';
      response += '2. Send Money\n';
      response += '3. Buy Airtime\n';
      response += '4. Check Transaction History\n';
      response += '5. Exit';
      
      return res.send({
        session_operation: 'continue',
        session_type: 1,
        session_id: sessionId,
        session_msg: response
      });
    }

    // Process main menu options
    if (session.authenticated && session.currentMenu === 'main') {
      const option = text.split('*').pop();
      
      switch (option) {
        case '1': // Check Balance
          const wallet = await Wallet.findOne({ userId: session.userId });
          response = `END Your PurplePay wallet balance is: NGN ${wallet.balance.toFixed(2)}`;
          delete ussdSessions[sessionId]; // Clear session
          return res.send({
            session_operation: 'end',
            session_type: 4,
            session_id: sessionId,
            session_msg: response
          });
          
        case '2': // Send Money
          session.currentMenu = 'send_money_recipient';
          response = 'CON Enter recipient\'s PurplePay tag or phone number:';
          return res.send({
            session_operation: 'continue',
            session_type: 1,
            session_id: sessionId,
            session_msg: response
          });
          
        case '3': // Buy Airtime
          session.currentMenu = 'buy_airtime_amount';
          response = 'CON Enter phone number for airtime:';
          return res.send({
            session_operation: 'continue',
            session_type: 1,
            session_id: sessionId,
            session_msg: response
          });
          
        case '4': // Transaction History
          const transactions = await Transaction.find({ userId: session.userId })
            .sort({ createdAt: -1 })
            .limit(5);
          
          if (transactions.length === 0) {
            response = 'END You have no recent transactions.';
          } else {
            response = 'END Recent Transactions:\n';
            transactions.forEach((txn, index) => {
              response += `${index + 1}. ${txn.type.toUpperCase()} - NGN ${txn.amount} - ${txn.status}\n`;
            });
          }
          
          delete ussdSessions[sessionId]; // Clear session
          return res.send({
            session_operation: 'end',
            session_type: 4,
            session_id: sessionId,
            session_msg: response
          });
          
        case '5': // Exit
          response = 'END Thank you for using PurplePay USSD Service.';
          delete ussdSessions[sessionId]; // Clear session
          return res.send({
            session_operation: 'end',
            session_type: 4,
            session_id: sessionId,
            session_msg: response
          });
          
        default:
          response = 'CON Invalid option. Please try again.\n';
          response += '1. Check Balance\n';
          response += '2. Send Money\n';
          response += '3. Buy Airtime\n';
          response += '4. Check Transaction History\n';
          response += '5. Exit';
          return res.send({
            session_operation: 'continue',
            session_type: 1,
            session_id: sessionId,
            session_msg: response
          });
      }
    }

    // Process send money flow
    if (session.authenticated && session.currentMenu === 'send_money_recipient') {
      const recipient = text.split('*').pop();
      session.data.recipient = recipient;
      session.currentMenu = 'send_money_amount';
      
      response = 'CON Enter amount to send (NGN):';
      return res.send({
        session_operation: 'continue',
        session_type: 1,
        session_id: sessionId,
        session_msg: response
      });
    }

    if (session.authenticated && session.currentMenu === 'send_money_amount') {
      const textParts = text.split('*');
      const amount = parseFloat(textParts[textParts.length - 1]);
      
      if (isNaN(amount) || amount <= 0) {
        response = 'CON Invalid amount. Please enter a valid amount:';
        return res.send({
          session_operation: 'continue',
          session_type: 1,
          session_id: sessionId,
          session_msg: response
        });
      }
      
      session.data.amount = amount;
      session.currentMenu = 'send_money_confirm';
      
      // Find recipient
      let recipientInfo = 'the recipient';
      let recipientQuery = {};
      
      // Check if recipient is a tag or phone number
      if (session.data.recipient.startsWith('@')) {
        // It's a tag
        const tag = session.data.recipient.substring(1);
        recipientQuery = { tag };
      } else {
        // It's a phone number
        recipientQuery = { phoneNumber: session.data.recipient.replace('+', '') };
      }
      
      const recipientUser = await User.findOne(recipientQuery);
      
      if (recipientUser) {
        recipientInfo = recipientUser.name;
        session.data.recipientId = recipientUser._id.toString();
      } else {
        response = 'END Recipient not found. Please try again with a valid tag or phone number.';
        delete ussdSessions[sessionId];
        return res.send({
          session_operation: 'end',
          session_type: 4,
          session_id: sessionId,
          session_msg: response
        });
      }
      
      response = `CON Send NGN ${amount} to ${recipientInfo}?\n`;
      response += '1. Confirm\n';
      response += '2. Cancel';
      
      return res.send({
        session_operation: 'continue',
        session_type: 1,
        session_id: sessionId,
        session_msg: response
      });
    }

    if (session.authenticated && session.currentMenu === 'send_money_confirm') {
      const option = text.split('*').pop();
      
      if (option === '1') {
        // Confirm transfer
        // Check sender's wallet balance
        const senderWallet = await Wallet.findOne({ userId: session.userId });
        
        if (senderWallet.balance < session.data.amount) {
          response = 'END Insufficient balance. Transaction cancelled.';
          delete ussdSessions[sessionId];
          return res.send({
            session_operation: 'end',
            session_type: 4,
            session_id: sessionId,
            session_msg: response
          });
        }
        
        // Get recipient's wallet
        const recipientWallet = await Wallet.findOne({ userId: session.data.recipientId });
        
        if (!recipientWallet) {
          response = 'END Recipient wallet not found. Transaction cancelled.';
          delete ussdSessions[sessionId];
          return res.send({
            session_operation: 'end',
            session_type: 4,
            session_id: sessionId,
            session_msg: response
          });
        }
        
        // Create transaction reference
        const reference = generateTransactionReference();
        
        // Update sender's wallet
        senderWallet.balance -= session.data.amount;
        await senderWallet.save();
        
        // Create sender's transaction record
        await Transaction.create({
          userId: session.userId,
          type: 'transfer',
          amount: session.data.amount,
          currency: 'NGN',
          status: 'completed',
          reference,
          description: 'USSD Transfer',
          metadata: {
            recipientId: session.data.recipientId
          }
        });
        
        // Update recipient's wallet
        recipientWallet.balance += session.data.amount;
        await recipientWallet.save();
        
        // Create recipient's transaction record
        await Transaction.create({
          userId: session.data.recipientId,
          type: 'receive',
          amount: session.data.amount,
          currency: 'NGN',
          status: 'completed',
          reference,
          description: 'USSD Receive',
          metadata: {
            senderId: session.userId
          }
        });
        
        response = `END Transfer of NGN ${session.data.amount} successful.\nYour new balance is NGN ${senderWallet.balance.toFixed(2)}`;
      } else {
        response = 'END Transfer cancelled.';
      }
      
      delete ussdSessions[sessionId];
      return res.send({
        session_operation: 'end',
        session_type: 4,
        session_id: sessionId,
        session_msg: response
      });
    }

    // Process buy airtime flow
    if (session.authenticated && session.currentMenu === 'buy_airtime_amount') {
      const phoneNumber = text.split('*').pop();
      session.data.airtimePhone = phoneNumber;
      session.currentMenu = 'buy_airtime_value';
      
      response = 'CON Enter airtime amount (NGN):';
      return res.send({
        session_operation: 'continue',
        session_type: 1,
        session_id: sessionId,
        session_msg: response
      });
    }

    if (session.authenticated && session.currentMenu === 'buy_airtime_value') {
      const textParts = text.split('*');
      const amount = parseFloat(textParts[textParts.length - 1]);
      
      if (isNaN(amount) || amount <= 0) {
        response = 'CON Invalid amount. Please enter a valid amount:';
        return res.send({
          session_operation: 'continue',
          session_type: 1,
          session_id: sessionId,
          session_msg: response
        });
      }
      
      session.data.airtimeAmount = amount;
      session.currentMenu = 'buy_airtime_confirm';
      
      response = `CON Buy NGN ${amount} airtime for ${session.data.airtimePhone}?\n`;
      response += '1. Confirm\n';
      response += '2. Cancel';
      
      return res.send({
        session_operation: 'continue',
        session_type: 1,
        session_id: sessionId,
        session_msg: response
      });
    }

    if (session.authenticated && session.currentMenu === 'buy_airtime_confirm') {
      const option = text.split('*').pop();
      
      if (option === '1') {
        // Confirm airtime purchase
        // Check wallet balance
        const wallet = await Wallet.findOne({ userId: session.userId });
        
        if (wallet.balance < session.data.airtimeAmount) {
          response = 'END Insufficient balance. Transaction cancelled.';
          delete ussdSessions[sessionId];
          return res.send({
            session_operation: 'end',
            session_type: 4,
            session_id: sessionId,
            session_msg: response
          });
        }
        
        // Create transaction reference
        const reference = generateTransactionReference();
        
        // Update wallet
        wallet.balance -= session.data.airtimeAmount;
        await wallet.save();
        
        // Create transaction record
        await Transaction.create({
          userId: session.userId,
          type: 'airtime',
          amount: session.data.airtimeAmount,
          currency: 'NGN',
          status: 'completed',
          reference,
          description: `Airtime purchase for ${session.data.airtimePhone}`,
          metadata: {
            phoneNumber: session.data.airtimePhone
          }
        });
        
        // In a real implementation, you would integrate with an airtime provider here
        
        response = `END Airtime purchase of NGN ${session.data.airtimeAmount} for ${session.data.airtimePhone} successful.\nYour new balance is NGN ${wallet.balance.toFixed(2)}`;
      } else {
        response = 'END Airtime purchase cancelled.';
      }
      
      delete ussdSessions[sessionId];
      return res.send({
        session_operation: 'end',
        session_type: 4,
        session_id: sessionId,
        session_msg: response
      });
    }

    // Default response for any other scenario
    response = 'END An error occurred. Please try again.';
    delete ussdSessions[sessionId];
    return res.send({
      session_operation: 'end',
      session_type: 4,
      session_id: sessionId,
      session_msg: response
    });
    
  } catch (error) {
    console.error('USSD Error:', error);
    return res.status(500).send({
      session_operation: 'end',
      session_type: 4,
      session_id: req.body.sessionId || 'unknown',
      session_msg: 'END An error occurred. Please try again later.'
    });
  }
};

// Cleanup expired sessions (should be called periodically)
export const cleanupUssdSessions = () => {
  const now = Date.now();
  const sessionTimeout = 5 * 60 * 1000; // 5 minutes
  
  Object.keys(ussdSessions).forEach(sessionId => {
    const session = ussdSessions[sessionId];
    if (session.lastActivity && (now - session.lastActivity) > sessionTimeout) {
      delete ussdSessions[sessionId];
    }
  });
};
