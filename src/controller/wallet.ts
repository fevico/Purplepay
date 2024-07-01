import axios from "axios";
import { RequestHandler } from "express";
import walletModel from "src/model/wallet";
import { sendErrorRes } from "src/utils/helper";

const PUBLIC_KEY = process.env.PUBLIC_KEY;


export const createWallet: RequestHandler = async (req, res) => {
    const user = req.user.id;
    const { bvn, firstName, lastName, email, phoneNumber, address, dateOfBirth } = req.body;

    if (!bvn) {
        return res.status(400).json({ message: "BVN is required" });
    }

    const options = {
        method: 'POST',
        url: `https://strowallet.com/api/xpress/createwallet/`,
        params: {
            public_key: PUBLIC_KEY,
            bvn,
            firstName,
            lastName,
            email,
            phoneNumber,
            address,
            dateOfBirth
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await axios(options);
        
        // Extract data from the response
        const {
            status,
            bankName,
            accountName,
            accountNumber,
            bookedBalance,
            availableBalance,
            bvn: walletBVN,
            phoneNumber: walletPhoneNumber,
            address: walletAddress,
            BVNLastName,
            BVNFirstName,
            customerId
        } = response.data.wallet;

        // Save the extracted data to the database
        const createWallet = await walletModel.create({
            bvn: walletBVN,
            firstName,
            lastName,
            email,
            phoneNumber: walletPhoneNumber,
            address: walletAddress,
            dateOfBirth,
            status,
            bankName,
            accountName,
            accountNumber,
            bookedBalance,
            availableBalance,
            BVNLastName,
            BVNFirstName,
            customerId,
            userId: user
        });
        
        return res.json({ message: "Wallet created successfully", createWallet });

        // {
        //     "message": "Wallet created successfully",
        //     "createWallet": {
        //         "balance": 0,
        //         "firstName": "Isaac",
        //         "lastName": "James",
        //         "email": "ajayivictor291@gmail.com",
        //         "phoneNumber": "2349067327877",
        //         "address": "lekki, lagos state",
        //         "dateOfBirth": "2003-05-24T00:00:00.000Z",
        //         "userId": "666b378156855cc66ff95db7",
        //         "status": "true",
        //         "accountName": "Isaac James",
        //         "accountNumber": 8836397989,
        //         "bankName": "Xpresswallet",
        //         "bvn": "22482749727",
        //         "bookedBalance": 0,
        //         "availableBalance": 0,
        //         "BVNLastName": "LAWAL",
        //         "BVNFirstName": "ISAAC",
        //         "customerId": "f3e2427b-c278-4123-a748-610718288460",
        //         "_id": "666c11300efea09141b7b269",
        //         "createdAt": "2024-06-14T09:45:20.806Z",
        //         "updatedAt": "2024-06-14T09:45:20.806Z",
        //         "__v": 0
        //     }
        // }
    } catch (error) {
        // console.error('Error creating wallet, invalid bvn/phone number:', error);
        return res.status(500).json({ message: "Error creating wallet, Invalid bvn/phone number" });
    }
};

export const walletDetails: RequestHandler = async (req, res) => {
    const user = req.user.id;

    const wallet = await walletModel.findOne({ userId: user });
    if(!wallet) return sendErrorRes(res, "No wallet record!", 422)
     

    const options = {
        method: 'GET',
        url: `https://strowallet.com/api/xpress/walletdetails/`,
        params: {
            public_key: PUBLIC_KEY,
            customerId: wallet.customerId,
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await axios(options);
        res.json(response.data);
    } catch (error) {
        console.error('Error finding wallet details:', error);
        return res.status(500).json({ message: "Error finding wallet details" });
    }
};

export const walletTransactions: RequestHandler = async (req, res) => {
    const user = req.user.id;

    const wallet = await walletModel.findOne({ userId: user });
    if(!wallet) return sendErrorRes(res, "No wallet record!", 422)
     

    const options = {
        method: 'GET',
        url: `https://strowallet.com/api/xpress/transactionsforwallet/`,
        params: {
            public_key: PUBLIC_KEY,
            customerId: wallet.customerId,
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

export const bankTransfer: RequestHandler = async (req, res) => {
    const user = req.user.id;
    const { accountNumber, sortCode, amount, narration } = req.body;
    const SERVICE_CHARGE = 53;
  
    // Validate request body
    if (!accountNumber || !sortCode || !amount || !narration) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }
  
    try {
      const wallet = await walletModel.findOne({ userId: user });
      if (!wallet) {
        return sendErrorRes(res, "No wallet record!", 422);
      }
  
      const totalAmount = amount + SERVICE_CHARGE;
  
      if (wallet.balance < totalAmount) {
        return sendErrorRes(res, "Insufficient balance!", 422);
      }
  
      const options = {
        method: 'POST',
        url: `https://strowallet.com/api/bankTransfer/`,
        params: {
          public_key: process.env.PUBLIC_KEY, // Ensure PUBLIC_KEY is set in your environment variables
          accountNumber: accountNumber,
          sortCode: sortCode,
          customerId: wallet.customerId,
          narration: narration,
          amount: amount,
        },
        headers: {
          'Content-Type': 'application/json'
        }
      };
  
      const response = await axios(options);
  
      // Deduct the total amount from the wallet
      wallet.balance -= totalAmount;
      await wallet.save();
  
      res.json(response.data);
    } catch (error) {
      console.error('Error processing bank transfer:', error);
      return res.status(500).json({ message: "Error processing bank transfer" });
    }
  };
