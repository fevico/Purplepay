import axios from "axios";
import { RequestHandler } from "express";
import walletModel from "src/model/wallet";
import { sendErrorRes } from "src/utils/helper";

const PUBLIC_KEY = process.env.PUBLIC_KEY;

// {
//     "success": true,
//     "message": "Account Generated Successfully.",
//     "bank_name": "Bankly Sandbox Bank",
//     "account_name": "Favour Victor",
//     "account_number": 682257943
//   }


export const createWallet: RequestHandler = async (req, res) => {
    const user = req.user.id;
    const webhook = "https://purplepay.com.ng/webhook/create"
    const { email, account_name, phone} = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const options = {
        method: 'POST',
        url: `https://strowallet.com/api/virtual-bank/paga`,
        params: {
            public_key: PUBLIC_KEY,
           email,
           account_name,
           phone,
           webhook_url: webhook
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await axios(options);
        
        // Extract data from the response
        const {
            bank_name: bankName,
            account_name: accountName,
            account_number: accountNumber
        } = response.data;
 
        console.log(response.data)
        // Save the extracted data to the database
        const createWallet = await walletModel.create({
            bankName,
            accountName,
            accountNumber,
            userId: user
        });
        
        return res.json({ message: "Wallet created successfully", createWallet });
    } catch (error) {
        console.error('Error creating wallet, invalid bvn/phone number:', error);
        return res.status(500).json({ message: "Error creating wallet, Invalid bvn/phone number" });
    }
};

export const fetchBankList: RequestHandler = async (req, res) => {
    const user = req.user.id;

    const wallet = await walletModel.findOne({ userId: user });
    if(!wallet) return sendErrorRes(res, "No wallet record!", 422)
     

    const options = {
        method: 'GET',
        url: `https://strowallet.com/api/fetchBanks/`, 
        params: {
            public_key: PUBLIC_KEY,
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await axios(options);
        res.json(response.data);
    } catch (error) {
        console.error('Error finding wallet transactions:', error);
        return res.status(500).json({ message: "Error finding wallet transactions" });
    }
};

export const getAccountDetails: RequestHandler = async (req, res) => {
    const user = req.user.id;
    const { accountNumber, sortCode } = req.body;

    const wallet = await walletModel.findOne({ userId: user });
    if(!wallet) return sendErrorRes(res, "No wallet record!", 422)
     

    const options = {
        method: 'GET',
        url: `https://strowallet.com/api/fetchAccountDetails/`,
        params: {
            public_key: PUBLIC_KEY,
            accountNumber: accountNumber,
            sortCode: sortCode,
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await axios(options);
        res.json(response.data);
    } catch (error) {
        console.error('Error finding wallet transactions:', error);
        return res.status(500).json({ message: "Error finding wallet transactions" });
    }
};

// export const bankTransfer: RequestHandler = async (req, res) => {
//     const user = req.user.id;
//     const { accountNumber, sortCode, amount, narration } = req.body;
//     const SERVICE_CHARGE = 53;
  
//     // Validate request body
//     if (!accountNumber || !sortCode || !amount || !narration) {
//       return res.status(400).json({ message: "All required fields must be provided" });
//     }
  
//     try {
//       const wallet = await walletModel.findOne({ userId: user });
//       if (!wallet) {
//         return sendErrorRes(res, "No wallet record!", 422);
//       }
  
//       const totalAmount = amount + SERVICE_CHARGE;
  
//       if (wallet.balance < totalAmount) {
//         return sendErrorRes(res, "Insufficient balance!", 422);
//       }
  
//       const options = {
//         method: 'POST',
//         url: `https://strowallet.com/api/bankTransfer/`,
//         params: {
//           public_key: process.env.PUBLIC_KEY, // Ensure PUBLIC_KEY is set in your environment variables
//           accountNumber: accountNumber,
//           sortCode: sortCode,
//           customerId: wallet.customerId,
//           narration: narration,
//           amount: amount,
//         },
//         headers: {
//           'Content-Type': 'application/json'
//         }
//       };
  
//       const response = await axios(options);
  
//       // Deduct the total amount from the wallet
//       wallet.balance -= totalAmount;
//       await wallet.save();
  
//       res.json(response.data);
//     } catch (error) {
//       console.error('Error processing bank transfer:', error);
//       return res.status(500).json({ message: "Error processing bank transfer" });
//     }
//   };
