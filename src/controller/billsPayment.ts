import { RequestHandler } from "express";
import axios from "axios";
import walletModel from "src/model/wallet";
import { sendErrorRes } from "src/utils/helper";

const PUBLIC_KEY = process.env.PUBLIC_KEY;


export const getAllDataPlans: RequestHandler = async (req, res) => {
    const { service_name } = req.body;

    if (!service_name) {
        return res.status(400).json({ message: "service_name is required" });
    }

    const options = {
        method: 'GET',
        url: `https://strowallet.com/api/buydata/plans/`,
        params: {
            public_key: PUBLIC_KEY,
            service_name: service_name
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await axios(options);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data plans:', error);
        res.status(500).json({ message: "Error fetching data plans" });
    }
};

export const purchaseData: RequestHandler = async (req, res) => {
    const { service_name, amount, phone, variation_code, service_id } = req.body;
    const userId = req.user.id;
  
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
      const wallet = await walletModel.findOne({ userId });
      if (!wallet) {
        return sendErrorRes(res, "Unauthorized request: cannot perform this operation", 401);
      }
  
      if (wallet.balance < amount) {
        return sendErrorRes(res, "Insufficient balance", 401);
      }
  
      const response = await axios(options);
  
      // Assuming response.data contains success information, deduct the amount from the user's balance
      wallet.balance -= amount;
      await wallet.save();
  
      res.json(response.data);
    } catch (error) {
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
          
    } catch (error) {
        console.error('Error fetching data plans:', error);
        res.status(500).json({ message: "Error fetching data plans" });
    }
};

export const getCableTvPlan: RequestHandler = async (req, res) => {
    const { service_id } = req.body;

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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }

    // try {
    //     const response = await axios(options);
    //     console.log(response.data); 
    //     res.status(200).json(response.data);
    // } catch (error) {
    //     console.error('Error buying data:', error);
    //     res.status(500).json({ message: "Internal Server Error" });
    // }
}
