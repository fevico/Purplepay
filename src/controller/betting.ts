import { RequestHandler } from "express";

const API_KEY = process.env.BETTING_API_KEY;

export const getBettingProvider: RequestHandler = async (req, res) => {

const url = " https://sandbox.giftbills.com/api/v1/betting";
const options = {
  method: 'GET',
  headers: {
    Authorization: `Bearer W6SJYL4YYRYZR8HIWV6R5LRIHK3ERGD`,
    MerchantId: "fevico",
    ContentType: 'application/json'
  }
};

try {
    const response = await fetch(url, options);
    const data = await response.json();

    // Check if the response contains the expected data
    if (!response.ok) {
        return res.status(response.status).json({ error: data.message || 'Failed to fetch betting providers' });
    }

    // Send the data back to the client
    res.status(200).json(data);
} catch (error) {
    console.error('Error fetching betting providers:', error);
    res.status(500).json({ message: "Internal Server Error" });
}
}


export const validateCustormerId: RequestHandler = async (req, res) => {

    const {customerId, provider} = req.body

    const url = " https://sandbox.giftbills.com/api/v1/betting/validate";
    const options = {
  method: 'POST',
  headers: {
    Authorization: `Bearer W6SJYL4YYRYZR8HIWV6R5LRIHK3ERGD`,
    MerchantId: "fevico",
    ContentType: 'application/json'
  },
  body: JSON.stringify({
    customerId: customerId,
    provider: provider
  })
};

try {
    const response = await fetch(url, options);
    const data = await response.json();

    // Check if the response contains the expected data
    if (!response.ok) {
        return res.status(response.status).json({ error: data.message || 'Failed to fetch betting providers' });
    }

    // Send the data back to the client
    res.status(200).json(data);
} catch (error) {
    console.error('Error fetching betting providers:', error);
    res.status(500).json({ message: "Internal Server Error" });
}
}

export const bettingTopUp: RequestHandler = async (req, res) => {

  const url = "https://sandbox.giftbills.com/api/v1/betting/topup";
  const options = {
      method: 'POST',
      headers: {
          Authorization: `Bearer W6SJYL4YYRYZR8HIWV6R5LRIHK3ERGD`,
          MerchantId: "fevico",
          Encryption: "ZCP30A6Y6Q131718662062",
          ContentType: 'application/json'
      },
      body: JSON.stringify({
          customerId: req.body.customerId,
          provider: req.body.provider,
          reference: req.body.reference,
          amount: req.body.amount
      })
  };
  
  try {
      const response = await fetch(url, options);
      const data = await response.json();
  
      if (!response.ok) {
          return res.status(response.status).json({ error: data.message || 'Failed to fetch betting providers' });
      }
  
      res.status(200).json(data);
  } catch (error) {
      console.error('Error fetching betting providers:', error);
      res.status(500).json({ message: "Internal Server Error" });
  }
  
}

export const bettingStatus: RequestHandler = async (req, res) => {

    const {customerId, provider, reference, amount} = req.body

    const url = " https://sandbox.giftbills.com/api/v1/betting/status";
    const options = {
  method: 'POST',
  headers: {
    Authorization: `Bearer W6SJYL4YYRYZR8HIWV6R5LRIHK3ERGD`,
    MerchantId: "fevico",
    ContentType: 'application/json'
  },
  body: JSON.stringify({
    customerId: customerId,
    provider: provider,
    reference: reference,
    amount: amount
  })
};

try {
    const response = await fetch(url, options);
    const data = await response.json();

    // Check if the response contains the expected data
    if (!response.ok) {
        return res.status(response.status).json({ error: data.message || 'Failed to fetch betting providers' });
    }

    // Send the data back to the client
    res.status(200).json(data);
} catch (error) {
    console.error('Error fetching betting providers:', error);
    res.status(500).json({ message: "Internal Server Error" });
}
}