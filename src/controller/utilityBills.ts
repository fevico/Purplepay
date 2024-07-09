import { RequestHandler } from "express";
import { Request } from 'express';
import utilityModel from "src/model/utility";
import walletModel from "src/model/wallet";
import { sendErrorRes } from "src/utils/helper";

declare module 'express-serve-static-core' {
  interface Request {
    accessToken?: string;
  }
}

const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET

function generateReferenceId() {
    const timestamp = new Date().getTime(); // Get current timestamp in milliseconds
    const randomChars = Math.random().toString(36).substring(2, 8); // Generate random characters

    // Combine timestamp and random characters to form a unique reference ID
    const referenceId = `${timestamp}${randomChars}`; 

    return referenceId;
}

const referenceId = generateReferenceId();


export const acessToken: RequestHandler = async (req, res, next) => {
    const fetch = require('node-fetch');

    const url = 'https://auth.reloadly.com/oauth/token';
    const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'client_credentials',
            audience: 'https://giftcards.reloadly.com'
          })
    };

    try {
        const response = await fetch(url, options);
        const data = await response.json();

        // Check if the response contains the expected data
        if (!response.ok) {
            return res.status(response.status).json({ error: data.message || 'Failed to get token' });
        }

        // Attach the token to the req object
        req.accessToken = data.access_token as string;

        console.log(data);
        next();
    } catch (error) {
        console.error('Error fetching token:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export const getBillers: RequestHandler = async(req, res) =>{
    const fetch = require('node-fetch');

    const { id, name, type, serviceType, countryISOCode, page, size } = req.query;
    const url = `https://utilities-sandbox.reloadly.com/billers?id=${id}&name=${name}&type=${type}&serviceType=${serviceType}&countryISOCode=${countryISOCode}&page=${page}&size=${size}`;
    const options = {
  method: 'GET',
  headers: {
    Accept: 'application/com.reloadly.utilities-v1+json',
    Authorization: `Bearer ${req.accessToken}`,
  }
};
    try {
            const response = await fetch(url, options);
            const data = await response.json();
    
            // Check if the response contains the expected data
            if (!response.ok) {
                return res.status(response.status).json({ error: data.message || 'Failed to fetch billers' });
            }
    
            // Send the data back to the client
            res.status(200).json(data);
        } catch (error) {
            console.error('Error fetching billers:', error);
            res.status(500).json({ message: "Internal Server Error" });
        }
}

// export const payBillers: RequestHandler = async(req, res) =>{
//     const fetch = require('node-fetch');
//     const userId = req.user.id
//     const {billerId, subscriberAccountNumber, countryISOCode, page, size, amount, phoneNumber} = req.body

//     const url = 'https://utilities-sandbox.reloadly.com/pay';
//     const options = {
//     method: 'POST',
//     headers: {
//     'Content-Type': 'application/json',
//     Accept: 'application/com.reloadly.utilities-v1+json',
//     Authorization: `Bearer ${req.accessToken}`
//   },
//   body: JSON.stringify({
//     subscriberAccountNumber: '04223568280',
//     amount: amount,
//     amountId: null,
//     billerId: 5,
//     useLocalAmount: false,
//     referenceId: referenceId,
//     additionalInfo: {invoiceId: null}
//   })
// };

// // {
// //     "id": 3127,
// //     "status": "PROCESSING",
// //     "referenceId": "june-electricity-bills",
// //     "code": "PAYMENT_PROCESSING_IN_PROGRESS",
// //     "message": "The payment is being processed, status will be updated when biller processes the payment.",
// //     "submittedAt": "2024-06-19 12:29:28",
// //     "finalStatusAvailabilityAt": "2024-06-20 12:29:27"
// // }

// try {
//     const wallet = await walletModel.findOne({ userId });
//     if (!wallet) {
//       return sendErrorRes(res, "Unauthorized request: cannot perform this operation", 401);
//     }

//     if (wallet.balance < amount) {
//       return sendErrorRes(res, "Insufficient balance", 401);
//     }

//     const response = await fetch(url, options);
//     const data = await response.json();

//     wallet.balance -= amount
//     await wallet.save();

//     // Check if the response contains the expected data
//     if (!response.ok) {
//         return res.status(response.status).json({ error: data.message || 'Failed to fetch billers' });
//     }
//     const utility = await utilityModel.create({
//         userId: userId,
//         billerId: billerId,
//         subscriberAccountNumber: subscriberAccountNumber,
//         amount: amount,
//         utilityReferenceId: referenceId,
//         phoneNumber: phoneNumber,
//         referenceId: referenceId,
//         utilityStatus: data.status,
//         id: data.id,
//         code: data.code,
//         message: data.message,
//         submittedAt: data.submittedAt,
//         finalStatusAvailabilityAt: data.finalStatusAvailabilityAt,
//     })
    
//     // Send the data back to the client
//     res.status(200).json(data);
// } catch (error) { 
//     console.error('Error fetching billers:', error);
//     res.status(500).json({ message: "Internal Server Error" });
// }
// }

export const payBillers: RequestHandler = async (req, res) => {
    const { billerId, subscriberAccountNumber, countryISOCode, page, size, amount, phoneNumber, referenceId } = req.body;
    const userId = req.user.id;
  
    // Validate request body
    if (!billerId || !subscriberAccountNumber || !amount || !phoneNumber || !referenceId) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }
  
    const url = 'https://utilities-sandbox.reloadly.com/pay';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/com.reloadly.utilities-v1+json',
        Authorization: `Bearer ${req.accessToken}`
      },
      body: JSON.stringify({
        subscriberAccountNumber,
        amount,
        amountId: null,
        billerId,
        useLocalAmount: false,
        referenceId,
        additionalInfo: { invoiceId: null }
      })
    };
  
    try {
      const wallet = await walletModel.findOne({ userId });
      if (!wallet) {
        return sendErrorRes(res, "Unauthorized request: cannot perform this operation", 401);
      }
  
      if (wallet.balance < amount) {
        return sendErrorRes(res, "Insufficient balance", 401);
      }
  
      const response = await fetch(url, options);
      const data = await response.json();
  
      // Check if the response contains the expected data
      if (!response.ok) {
        return res.status(response.status).json({ error: data.message || 'Failed to fetch billers' });
      }
  
      // Deduct the amount from the wallet balance
      wallet.balance -= amount;
      await wallet.save();
  
      // Create a record in the utility model
      const utility = await utilityModel.create({
        userId,
        billerId,
        subscriberAccountNumber,
        amount,
        utilityReferenceId: referenceId,
        phoneNumber,
        referenceId,
        utilityStatus: data.status,
        id: data.id,
        code: data.code,
        message: data.message,
        submittedAt: data.submittedAt,
        finalStatusAvailabilityAt: data.finalStatusAvailabilityAt,
      });
  
      // Send the data back to the client
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching billers:', error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };