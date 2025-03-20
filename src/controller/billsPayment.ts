import { RequestHandler } from "express";
import axios from "axios";
import walletModel from "../model/wallet";
import { generateReference, sendErrorRes } from "../utils/helper";
import { sendChannelNotification } from "../utils/notification";
import BillsPayment from "../models/billsPayment";
import Transaction from "../models/transaction";

const PUBLIC_KEY = process.env.PUBLIC_KEY || "";

// New comprehensive bill payment functions

/**
 * Initiate a bill payment
 * This function handles the initiation of a bill payment transaction
 */
export const initiateBillPayment: RequestHandler = async (req, res) => {
  try {
    const { billType, provider, customerReference, amount, currency = "NGN", metadata = {} } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!billType || !provider || !customerReference || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: billType, provider, customerReference, and amount are required"
      });
    }

    // Find user wallet
    const wallet = await walletModel.findOne({ userId });
    if (!wallet) {
      return sendErrorRes(res, "Wallet not found", 404);
    }

    // Check if user has sufficient balance
    if (wallet.balance < amount) {
      return sendErrorRes(res, "Insufficient wallet balance", 400);
    }

    // Generate unique reference
    const reference = generateReference();

    // Create bill payment record
    const billPayment = new BillsPayment({
      userId,
      walletId: wallet._id,
      billType,
      provider,
      customerReference,
      amount,
      currency,
      status: 'pending',
      reference,
      metadata
    });

    await billPayment.save();

    // Create a pending transaction
    const transaction = new Transaction({
      userId,
      walletId: wallet._id,
      type: 'bill_payment',
      amount,
      currency,
      reference,
      status: 'pending',
      description: `${billType} bill payment to ${provider}`,
      metadata: {
        billType,
        provider,
        customerReference,
        ...metadata
      }
    });

    await transaction.save();

    // Update bill payment with transaction ID
    billPayment.transactionId = transaction._id as any;
    await billPayment.save();

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Bill payment initiated successfully",
      reference,
      billPayment
    });
  } catch (error: any) {
    console.error("Error initiating bill payment:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while initiating bill payment",
      error: error.message
    });
  }
};

/**
 * Process a bill payment
 * This function handles the actual processing of the payment with the provider
 */
export const processBillPayment: RequestHandler = async (req, res) => {
  try {
    const { reference } = req.params;
    const userId = req.user.id;

    // Find the bill payment
    const billPayment = await BillsPayment.findOne({ reference });
    if (!billPayment) {
      return res.status(404).json({
        success: false,
        message: "Bill payment not found"
      });
    }

    // Verify that the bill payment belongs to the user
    if (billPayment.userId.toString() !== userId) {
      return sendErrorRes(res, "Unauthorized access to this bill payment", 403);
    }

    // Check if bill payment is already processed
    if (billPayment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Bill payment already ${billPayment.status}`
      });
    }

    // Find the wallet
    const wallet = await walletModel.findById(billPayment.walletId);
    if (!wallet) {
      return sendErrorRes(res, "Wallet not found", 404);
    }

    // Double-check if user has sufficient balance
    if (wallet.balance < billPayment.amount) {
      // Update bill payment and transaction status to failed
      billPayment.status = 'failed';
      await billPayment.save();

      const transaction = await Transaction.findById(billPayment.transactionId);
      if (transaction) {
        transaction.status = 'failed';
        await transaction.save();
      }

      return sendErrorRes(res, "Insufficient wallet balance", 400);
    }

    // Process the payment with the provider
    // This is where you would integrate with the actual bill payment provider API
    let paymentResponse;
    try {
      // Different processing logic based on bill type
      switch (billPayment.billType) {
        case 'electricity':
          paymentResponse = await processElectricityBill(billPayment);
          break;
        case 'water':
          paymentResponse = await processWaterBill(billPayment);
          break;
        case 'internet':
          paymentResponse = await processInternetBill(billPayment);
          break;
        case 'tv':
          paymentResponse = await processTvBill(billPayment);
          break;
        default:
          paymentResponse = await processGenericBill(billPayment);
      }
    } catch (error: any) {
      // Update bill payment and transaction status to failed
      billPayment.status = 'failed';
      billPayment.metadata = {
        ...billPayment.metadata,
        error: error.message,
        errorDetails: error.response?.data || {}
      };
      await billPayment.save();

      const transaction = await Transaction.findById(billPayment.transactionId);
      if (transaction) {
        transaction.status = 'failed';
        transaction.metadata = {
          ...transaction.metadata,
          error: error.message
        };
        await transaction.save();
      }

      // Send notification about failed payment
      try {
        await sendChannelNotification(
          userId.toString(),
          'transaction',
          'Bill Payment Failed',
          `Your ${billPayment.billType} bill payment of ${billPayment.amount} ${billPayment.currency} to ${billPayment.provider} has failed.`,
          'email'
        );
      } catch (notifError) {
        console.error("Error sending notification:", notifError);
      }

      return res.status(500).json({
        success: false,
        message: "Bill payment processing failed",
        error: error.message,
        details: error.response?.data || {}
      });
    }

    // Update wallet balance
    wallet.balance -= billPayment.amount;
    await wallet.save();

    // Update bill payment status to completed
    billPayment.status = 'completed';
    billPayment.metadata = {
      ...billPayment.metadata,
      providerResponse: paymentResponse
    };
    await billPayment.save();

    // Update transaction status to completed
    const transaction = await Transaction.findById(billPayment.transactionId);
    if (transaction) {
      transaction.status = 'completed';
      transaction.metadata = {
        ...transaction.metadata,
        providerResponse: paymentResponse
      };
      await transaction.save();
    }

    // Send notification about successful payment
    try {
      await sendChannelNotification(
        userId.toString(),
        'transaction',
        'Bill Payment Successful',
        `Your ${billPayment.billType} bill payment of ${billPayment.amount} ${billPayment.currency} to ${billPayment.provider} was successful.`,
        'email'
      );
    } catch (notifError) {
      console.error("Error sending notification:", notifError);
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: "Bill payment processed successfully",
      billPayment,
      providerResponse: paymentResponse
    });
  } catch (error: any) {
    console.error("Error processing bill payment:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing bill payment",
      error: error.message
    });
  }
};

/**
 * Get bill payment status
 * This function retrieves the status of a bill payment
 */
export const getBillPaymentStatus: RequestHandler = async (req, res) => {
  try {
    const { reference } = req.params;
    const userId = req.user.id;

    // Find the bill payment
    const billPayment = await BillsPayment.findOne({ reference });
    if (!billPayment) {
      return res.status(404).json({
        success: false,
        message: "Bill payment not found"
      });
    }

    // Verify that the bill payment belongs to the user
    if (billPayment.userId.toString() !== userId) {
      return sendErrorRes(res, "Unauthorized access to this bill payment", 403);
    }

    // Return bill payment details
    return res.status(200).json({
      success: true,
      billPayment
    });
  } catch (error: any) {
    console.error("Error getting bill payment status:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting bill payment status",
      error: error.message
    });
  }
};

/**
 * Get user bill payment history
 * This function retrieves the bill payment history for a user
 */
export const getBillPaymentHistory: RequestHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { billType, provider, status, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter: any = { userId };
    
    if (billType) filter.billType = billType;
    if (provider) filter.provider = provider;
    if (status) filter.status = status;
    
    // Add date range filter if provided
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    // Calculate pagination
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Get bill payments with pagination
    const billPayments = await BillsPayment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    // Get total count for pagination
    const total = await BillsPayment.countDocuments(filter);

    // Return bill payment history
    return res.status(200).json({
      success: true,
      billPayments,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error: any) {
    console.error("Error getting bill payment history:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while getting bill payment history",
      error: error.message
    });
  }
};

// Helper functions for processing different bill types
async function processElectricityBill(billPayment: any) {
  // Implement electricity bill payment logic
  // This is where you would integrate with the electricity provider API
  const options = {
    method: 'POST',
    url: `https://strowallet.com/api/electricity/request/`,
    data: {
      public_key: PUBLIC_KEY,
      service_name: billPayment.provider,
      amount: billPayment.amount,
      meter_number: billPayment.customerReference,
      service_id: billPayment.metadata.service_id || '',
      variation_code: billPayment.metadata.variation_code || ''
    },
    headers: { 
      'Content-Type': 'application/json'
    }
  };

  const response = await axios(options);
  return response.data;
}

async function processWaterBill(billPayment: any) {
  // Implement water bill payment logic
  // This is a placeholder for water bill payment integration
  const options = {
    method: 'POST',
    url: `https://strowallet.com/api/water/request/`,
    data: {
      public_key: PUBLIC_KEY,
      service_name: billPayment.provider,
      amount: billPayment.amount,
      customer_id: billPayment.customerReference,
      service_id: billPayment.metadata.service_id || ''
    },
    headers: { 
      'Content-Type': 'application/json'
    }
  };

  const response = await axios(options);
  return response.data;
}

async function processInternetBill(billPayment: any) {
  // Implement internet bill payment logic
  // This is a placeholder for internet bill payment integration
  const options = {
    method: 'POST',
    url: `https://strowallet.com/api/internet/request/`,
    data: {
      public_key: PUBLIC_KEY,
      service_name: billPayment.provider,
      amount: billPayment.amount,
      account_number: billPayment.customerReference,
      service_id: billPayment.metadata.service_id || '',
      variation_code: billPayment.metadata.variation_code || ''
    },
    headers: { 
      'Content-Type': 'application/json'
    }
  };

  const response = await axios(options);
  return response.data;
}

async function processTvBill(billPayment: any) {
  // Implement TV bill payment logic using the existing subscribeCableTv function
  const options = {
    method: 'POST',
    url: `https://strowallet.com/api/cable-subscription/request/`,
    data: {
      public_key: PUBLIC_KEY,
      service_name: billPayment.provider,
      amount: billPayment.amount,
      smart_card_number: billPayment.customerReference,
      service_id: billPayment.metadata.service_id || '',
      variation_code: billPayment.metadata.variation_code || ''
    },
    headers: { 
      'Content-Type': 'application/json'
    }
  };

  const response = await axios(options);
  return response.data;
}

async function processGenericBill(billPayment: any) {
  // Generic bill payment logic for other bill types
  const options = {
    method: 'POST',
    url: `https://strowallet.com/api/generic/request/`,
    data: {
      public_key: PUBLIC_KEY,
      service_name: billPayment.provider,
      amount: billPayment.amount,
      customer_id: billPayment.customerReference,
      ...billPayment.metadata
    },
    headers: { 
      'Content-Type': 'application/json'
    }
  };

  const response = await axios(options);
  return response.data;
}

// Existing functions below

export const getAllDataPlans: RequestHandler = async (req, res) => {
    const { service_name } = req.query; // Extract service_name from query parameters

    if (!service_name) {
        return res.status(400).json({ message: "service_name is required" });
    }

    const options = {
        method: 'GET',
        url: `https://strowallet.com/api/buydata/plans/`,
        params: {
            public_key: PUBLIC_KEY,
            service_name: service_name as string, // Type assertion to string
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await axios(options);
        res.json(response.data);
    } catch (error: any) {
        console.error('Error fetching data plans:', error);
        res.status(500).json({ message: "Error fetching data plans" });
    }
};


export const purchaseData: RequestHandler = async (req, res) => {
    const { service_name, amount, phone, variation_code, service_id } = req.body;
    // const userId = req.user.id;
    // console.log(userId)
  
    if (!service_name) {
      return res.status(400).json({ message: "service_name is required" });
    }
  
    const options = {
      method: 'POST',
      url: `https://strowallet.com/api/buydata/request/`,
      data: {
        public_key: PUBLIC_KEY,
        service_name: service_name,
        amount: amount,
        phone: phone,
        service_id: service_id,
        variation_code: variation_code
      },
      headers: { 
        'Content-Type': 'application/json'
      }
    };
  
    try {
    //   const wallet = await walletModel.findOne({ userId });
    //   if (!wallet) {
    //     return sendErrorRes(res, "Unauthorized request: cannot perform this operation", 401);
    //   }
  
    //   if (wallet.balance < amount) {
    //     return sendErrorRes(res, "Insufficient balance", 401);
    //   }
  
      const response = await axios(options);
  
      // Assuming response.data contains success information, deduct the amount from the user's balance
    //   wallet.balance -= amount;
    //   await wallet.save();
  
      res.json(response.data);
    } catch (error: any) {
      console.error('Error fetching data plans:', error);
  
      // Check if it's an Axios error and provide more details
      if (axios.isAxiosError(error)) {
        res.status(500).json({ message: "Error fetching data plans", details: error.response?.data || error.message });
      } else {
        res.status(500).json({ message: "An unexpected error occurred" });
      }
    }
  };

export const purchaseAirtime: RequestHandler = async (req, res) => {
    const { service_name, amount, phone } = req.body;
    const userId = req.user.id;


    if (!service_name) {
        return res.status(400).json({ message: "service_name is required" });
    }

    const options = {
        method: 'POST',
        url: `https://strowallet.com/api/buyairtime/request/`,
        params: {
            public_key: PUBLIC_KEY,
            service_name: service_name,
            amount: amount,
            phone: phone,
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const wallet = await walletModel.findOne({ userId });
        if (!wallet) {
          return sendErrorRes(res, "Unauthorized request: cannot perform this operation", 401);
        }
    
        if (wallet.balance < amount) {
          return sendErrorRes(res, "Insufficient balance", 401);
        }

        const response = await axios(options);
        wallet.balance -= amount;
        await wallet.save();

        res.json(response.data);
        console.log(response.data)
        // {
        //     "success": true,
        //     "message": "Transaction Successfully.",
        //     "response": {
        //         "code": "000",
        //         "content": {
        //             "transactions": {
        //                 "status": "delivered",
        //                 "product_name": "MTN Airtime VTU",
        //                 "unique_element": "08136819208",
        //                 "unit_price": 100,
        //                 "quantity": 1,
        //                 "service_verification": null,
        //                 "channel": "api",
        //                 "commission": 3,
        //                 "total_amount": 97,
        //                 "discount": null,
        //                 "type": "Airtime Recharge",
        //                 "email": "osenijamiu9@gmail.com",
        //                 "phone": "08166568886",
        //                 "name": null,
        //                 "convinience_fee": 0,
        //                 "amount": 100,
        //                 "platform": "api",
        //                 "method": "api",
        //                 "transactionId": "17166710157089166237850437"
        //             }
        //         },
        //         "response_description": "TRANSACTION SUCCESSFUL",
        //         "requestId": "2024052522031936431435",
        //         "amount": "100.00",
        //         "transaction_date": "2024-05-25T21:03:35.000000Z",
        //         "purchased_code": ""
        //     }
        // }
          
    } catch (error: any) {
        console.error('Error fetching data plans:', error);
        res.status(500).json({ message: "Error fetching data plans" });
    }
};

export const getCableTvPlan: RequestHandler = async (req, res) => {
    const { service_id } = req.query;

    if (!service_id) {
        return res.status(400).json({ message: "service_name is required" });
    }

    const options = {
        method: 'GET',
        url: `https://strowallet.com/api/cable-subscription/plans/`,
        params: {
            public_key: PUBLIC_KEY,
            service_id: service_id,
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await axios(options);
        res.json(response.data);
    } catch (error: any) {
        console.error('Error fetching data plans:', error);
        res.status(500).json({ message: "Error fetching data plans" });
    }
};

export const VerifySmartCardNumber: RequestHandler = async (req, res) => {
    const { service_id, customer_id  } = req.body;

    if (!service_id) {
        return res.status(400).json({ message: "service_name is required" });
    }

    const options = {
        method: 'POST',
        url: `https://strowallet.com/api/cable-subscription/verify-merchant`,
        params: {
            public_key: PUBLIC_KEY,
            service_id: service_id,
            customer_id: customer_id
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await axios(options);
        res.json(response.data);
    } catch (error: any) {
        console.error('Error fetching data plans:', error);
        res.status(500).json({ message: "Error fetching data plans" });
    }
};

export const subscribeCableTv: RequestHandler = async (req, res) => {
    const { service_name, customer_id, amount, phone, service_id, variation_code } = req.body;
    const userId = req.user.id;

    if (!service_name) {
        return res.status(400).json({ message: "service_name is required" });
    }

    const options = {
        method: 'POST',
        url: `https://https://strowallet.com/api/cable-subscription/request`,
        params: {
            public_key: PUBLIC_KEY,
            service_name: service_name,
            customer_id: customer_id,
            amount: amount,
            phone: phone,
            service_id: service_id,
            variation_code: variation_code
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const wallet = await walletModel.findOne({ userId });
        if (!wallet) {
          return sendErrorRes(res, "Unauthorized request: cannot perform this operation", 401);
        }
    
        if (wallet.balance < amount) {
          return sendErrorRes(res, "Insufficient balance", 401);
        }

        const response = await axios(options);
        wallet.balance -= amount;
        await wallet.save();

        res.json(response.data);
    } catch (error: any) {
        console.error('Error fetching data plans:', error);
        res.status(500).json({ message: "Error fetching data plans" });
    }
};

export const generateResultPin: RequestHandler = async (req, res) => {
    const { service_name, amount, phone, variation_code } = req.body;
    const userId = req.user.id;

    if (!service_name) {
        return res.status(400).json({ message: "service_name is required" });
    }

    const options = {
        method: 'POST',
        url: `https://strowallet.com/api/educational/request`,
        params: {
            public_key: PUBLIC_KEY,
            service_name: service_name,
            variation_code: variation_code,
            phone: phone,
            amount: amount,
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };

// {
//     "success": true,
//     "message": "Transaction SuccessfullySerial No:WRN232549599, pin: 331016027192",
//     "response": {
//       "code": "000",
//       "content": {
//         "transactions": {
//           "status": "delivered",
//           "product_name": "WAEC Result Checker PIN",
//           "unique_element": "08136819208",
//           "unit_price": 3900,
//           "quantity": 1,
//           "service_verification": null,
//           "channel": "api",
//           "commission": 250,
//           "total_amount": 3650,
//           "discount": null,
//           "type": "Education",
//           "email": "osenijamiu9@gmail.com",
//           "phone": "08166568886",
//           "name": null,
//           "convinience_fee": 0,
//           "amount": 3900,
//           "platform": "api",
//           "method": "api",
//           "transactionId": "17168147989742365154176947"
//         }
//       },
//       "response_description": "TRANSACTION SUCCESSFUL",
//       "requestId": "2024052713591709463645",
//       "amount": "3900.00",
//       "transaction_date": "2024-05-27T12:59:58.000000Z",
//       "purchased_code": "Serial No:WRN232549599, pin: 331016027192",
//       "cards": [
//         {
//           "Serial": "WRN232549599",
//           "Pin": "331016027192"
//         }
//       ]
//     }
//   }
    try {
        const wallet = await walletModel.findOne({ userId });
        if (!wallet) {
          return sendErrorRes(res, "Unauthorized request: cannot perform this operation", 401);
        }
    
        if (wallet.balance < amount) {
          return sendErrorRes(res, "Insufficient balance", 401);
        }

        const response = await axios(options);
        wallet.balance -= amount;
        await wallet.save();
        res.json(response.data);
    } catch (error: any) {
        console.error('Error fetching data plans:', error);
        res.status(500).json({ message: "Error fetching data plans" });
    }
};


export const rechargeCardPrinting: RequestHandler = async (req, res) => {
    const {  value, quantity, card_network } = req.body;
    const userId = req.user.id;

    if (!value) {
        return res.status(400).json({ message: "value is required" });
    }

    const options = {
        method: 'POST',
        url: `https://strowallet.com/api/buy_epin/`,
        params: {
            public_key: PUBLIC_KEY,
            quantity: quantity,
            card_network: card_network,
            value: value,
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };

// {
//     "status": "success",
//     "message": "Transaction Done Successfully",
//     "data": {
//         "card_network": "MTN",
//         "value": "100",
//         "quantity": "2",
//         "cards": [
//             {
//                 "pin": "55983371727771988",
//                 "serial": "00000028848444444\r\n"
//             },
//             {
//                 "pin": "31512551989921396",
//                 "serial": "00000028842444444\r\n"
//             }
//         ],
//         "trxid": "4Z7OXUX48BK6"
//     }
// }

    try {
        // const wallet = await walletModel.findOne({ userId });
        // if (!wallet) {
        //   return sendErrorRes(res, "Unauthorized request: cannot perform this operation", 401);
        // }
    
        // if (wallet.balance < amount) {
        //   return sendErrorRes(res, "Insufficient balance", 401);
        // }

        const response = await axios(options);
        res.json(response.data);
    } catch (error: any) {
        console.error('Error fetching data plans:', error);
        res.status(500).json({ message: "Error fetching data plans" });
    }
};


export const sendBulkSMS: RequestHandler = async (req, res) => {
    const { message, phone } = req.body;
const  sender_id = process.env.SENDER_ID
    if (!sender_id) {
        return res.status(400).json({ message: "Brand/Company name is required!" });
    }

    const options = {
        method: 'POST',
        url: `https://strowallet.com/api/bulk-sms`,
        params: {
            public_key: PUBLIC_KEY,
            sender_id: sender_id,
            message: message,
            phone: phone,
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };

// {
//     "success": true,
//     "message": "Message Sent"
// }
    try {
        const response = await axios(options);
        res.json(response.data);
    } catch (error: any) {
        console.error('Error fetching data plans:', error);
        res.status(500).json({ message: "Error fetching data plans" });
    }
};

export const buyData: RequestHandler = async (req, res) => { 
    const { network } = req.query

    const url = `https://sandbox.payscribe.ng/api/v1data/lookup?network=${network}`

    const options = {
        method: 'GET',
    //   const url = `https://sandbox.payscribe.ng/api/v1data/lookup?network=${network}`,
        headers: {
            Authorization: 'Bearer ps_test_04042f39b22a74a2c543279f3d6392436c77084aa9d4b4a31ec4b162effd93ed'
        } 
    }; 

    try {
        const response = await fetch(url, options);
        const data = await response.json();

        // Check if the response contains the expected data
        if (!response.ok) {
            return res.status(response.status).json({ error: data.message || 'Failed to fetch product' });
        }

        // Send the data back to the client
        res.status(200).json(data);
    } catch (error: any) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }

    // try {
    //     const response = await axios(options);
    //     console.log(response.data); 
    //     res.status(200).json(response.data);
    // } catch (error: any) {
    //     console.error('Error buying data:', error);
    //     res.status(500).json({ message: "Internal Server Error" });
    // }
}
