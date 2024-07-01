import { RequestHandler } from "express";
import axios from "axios";

const PUBLIC_KEY = process.env.PUBLIC_KEY;

export const createCustomer: RequestHandler = async (req, res) => {
    const { houseNumber, firstName, lastName, idNumber, customerEmail, phoneNumber, dateOfBirth, idImage, userPhoto,line1, state, zipCode, city, country, idType } = req.body;

    if (!firstName) {
        return res.status(400).json({ message: "firstName is required" });
    }
 
    const options = {
        method: 'POST',
        url: `https://strowallet.com/api/bitvcard/create-user/`,
        params: {
            public_key: PUBLIC_KEY,
            firstName: firstName,
            houseNumber: houseNumber,
            lastName: lastName,
            idNumber: idNumber,
            customerEmail: customerEmail,
            phoneNumber: phoneNumber,
            dateOfBirth: dateOfBirth,
            idImage: idImage,
            userPhoto: userPhoto,
            line1: line1,
            state: "Accra",
            zipCode: zipCode,
            city: "Accra",
            country: "Ghana",
            idType: "PASSPORT",

        },
        headers: {
            'Content-Type': 'application/json'
        }
    };
    // "success": true,
//     "message": "successfully registered user",
//     "response": {
//         "customerEmail": "ajayivictor291@gmail.com",
//         "firstName": "Victor",
//         "lastName": "Ajayi",
//         "phoneNumber": "08136819208",
//         "city": "Accra",
//         "state": "Accra",
//         "country": "Ghana",
//         "line1": "lagos nigeria",
//         "zipCode": "260101",
//         "houseNumber": "ayokomi",
//         "idNumber": "34567822",
//         "idType": "PASSPORT",
//         "idImage": "https://www.google.com/url?sa=i",
//         "userPhoto": "https://www.google.com/url?sa=i",
//         "dateOfBirth": "2000-02-24",
//         "bitvcard_customer_id": "c501afdb-a937-46a6-a76a-458ebcd679a0",
//         "card_brand": "visa"
//     }
// }
    try {
        const response = await axios(options);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data plans:', error);
        res.status(500).json({ message: "Error fetching data plans" });
    }
}

export const createCard: RequestHandler = async (req, res) => {
    const { name_on_card, amount, customerEmail, card_type } = req.body;

    if (!name_on_card) {
        return res.status(400).json({ message: "name_on_card is required" });
    }

    const options = {
        method: 'POST',
        url: `https://strowallet.com/api/bitvcard/create-card/`,
        params: {
            public_key: PUBLIC_KEY, 
            name_on_card: name_on_card,
            card_type: card_type,
            amount: amount,
            customerEmail: customerEmail,
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };
    // {
    //     "success": true,
    //     "message": "Card creation in progress",
    //     "response": {
    //       "name_on_card": "Ajayi Victor",
    //       "card_id": 6001119434,
    //       "card_created_date": "2024-05-29",
    //       "card_type": "virtual",
    //       "card_brand": "visa",
    //       "card_user_id": "12d4-9290113c29e2",
    //       "reference": 43209,
    //       "card_status": "pending",
    //       "customer_id": "4070fc3e-1d76-46"
    //     }
    //   }

    try {
        const response = await axios(options);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data plans:', error);
        res.status(500).json({ message: "Error fetching data plans" });
    }
}

export const fundCard: RequestHandler = async (req, res) => {
    const { card_id, amount} = req.body;

    if (!card_id) {
        return res.status(400).json({ message: "card_id is required" });
    }

    const options = {
        method: 'POST',
        url: `https://strowallet.com/api/bitvcard/fund-card/`,
        params: {
            public_key: PUBLIC_KEY,
            card_id: card_id,
            amount: amount,
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };
    // {
    //     "success": true,
    //     "message": "Done successfully",
    //     "apiresponse": {
    //       "status": true,
    //       "message": "card topup in progress",
    //       "data": {
    //         "id": "db4ed907-2b6a-469a-8732-86d0e1d26ca4",
    //         "createdAt": "2024-03-06T18:08:35.886Z",
    //         "updatedAt": "2024-03-06T18:08:35.886Z",
    //         "type": "credit",
    //         "method": "topup",
    //         "cardId": "d7baacc7-c349-427e-b922-9160fcf9fcc0",
    //         "currency": "usd",
    //         "centAmount": 200,
    //         "narrative": "Top-up card",
    //         "status": "pending",
    //         "reference": "7F1U53SD5F59",
    //         "amount": 2
    //       }
    //     }
    //   }

    try {
        const response = await axios(options);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data plans:', error);
        res.status(500).json({ message: "Error fetching data plans" });
    }
}


export const cardDetails: RequestHandler = async (req, res) => {
    const { card_id} = req.body;

    if (!card_id) {
        return res.status(400).json({ message: "card_id is required" });
    }

    const options = {
        method: 'POST',
        url: `https://strowallet.com/api/bitvcard/fetch-card-detail/`,
        params: {
            public_key: PUBLIC_KEY,
            card_id: card_id,
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };
    // {
    //     "success": true,
    //     "message": "Done successfully",
    //     "apiresponse": {
    //       "status": true,
    //       "message": "card topup in progress",
    //       "data": {
    //         "id": "db4ed907-2b6a-469a-8732-86d0e1d26ca4",
    //         "createdAt": "2024-03-06T18:08:35.886Z",
    //         "updatedAt": "2024-03-06T18:08:35.886Z",
    //         "type": "credit",
    //         "method": "topup",
    //         "cardId": "d7baacc7-c349-427e-b922-9160fcf9fcc0",
    //         "currency": "usd",
    //         "centAmount": 200,
    //         "narrative": "Top-up card",
    //         "status": "pending",
    //         "reference": "7F1U53SD5F59",
    //         "amount": 2
    //       }
    //     }
    //   }

    try {
        const response = await axios(options);
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching data plans:', error);
        res.status(500).json({ message: "Error fetching data plans" });
    }
}

export const cardTransactions: RequestHandler = async (req, res) => {
    const { card_id} = req.body;

    if (!card_id) {
        return res.status(400).json({ message: "card_id is required" });
    }

    const options = {
        method: 'POST',
        url: `https://strowallet.com/api/bitvcard/card-transactions/`,
        params: {
            public_key: PUBLIC_KEY,
            card_id: card_id,
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
}

export const freezeAndUnfreezeCard: RequestHandler = async (req, res) => {
    const { card_id, action} = req.body;

    if (!card_id) {
        return res.status(400).json({ message: "card_id is required" });
    }

    const options = {
        method: 'POST',
        url: `https://strowallet.com/api/bitvcard/action/status/`,
        params: {
            public_key: PUBLIC_KEY,
            card_id: card_id,
            action: action
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
}

export const cardHistory: RequestHandler = async (req, res) => {
    const { card_id, page, take} = req.body;

    if (!card_id) {
        return res.status(400).json({ message: "card_id is required" });
    }

    const options = {
        method: 'GET',
        url: `https://strowallet.com/api/apicard-transactions/`,
        params: {
            public_key: PUBLIC_KEY,
            page: 1,
            take: 10
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
}


export const withdrawFromCard: RequestHandler = async (req, res) => {
    const { card_id, amount} = req.body;

    if (!card_id) {
        return res.status(400).json({ message: "card_id is required" });
    }

    const options = {
        method: 'POST',
        url: `https://strowallet.com/api/bitvcard/card_withdraw/`,
        params: {
            public_key: PUBLIC_KEY,
            card_id: card_id,
            amount: amount
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
}
export const cardStatus: RequestHandler = async (req, res) => {
    const { reference} = req.body;

    if (!reference) {
        return res.status(400).json({ message: "reference is required" });
    }

    const options = {
        method: 'POST',
        url: `https://strowallet.com/api/bitvcard/card_withdraw/`,
        params: {
            public_key: PUBLIC_KEY,
            reference: reference
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
}