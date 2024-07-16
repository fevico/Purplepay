import { RequestHandler } from "express";
import giftCardModel from "src/model/giftCard";

function generateRandomAlphaNumeric(length: any) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters.charAt(randomIndex);
  }
  return result;
}

const randomIdentifier = generateRandomAlphaNumeric(6);

export const getCountries: RequestHandler = async (req, res) =>{
const fetch = require('node-fetch');

const url = 'https://giftcards.reloadly.com/countries';
const options = {
  method: 'GET',
  headers: {
    Accept: 'application/com.reloadly.giftcards-v1+json',
    Authorization: `Bearer ${req.accessToken}`
    // Authorization: `Bearer eyJraWQiOiIxNjYyOWUwZC1iM2NhLTRlM2EtYThkMS0xMzUyNjgxZmZkM2EiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMzAyNiIsImlzcyI6Imh0dHBzOi8vcmVsb2FkbHktc2FuZGJveC5hdXRoMC5jb20vIiwiaHR0cHM6Ly9yZWxvYWRseS5jb20vc2FuZGJveCI6dHJ1ZSwiaHR0cHM6Ly9yZWxvYWRseS5jb20vcHJlcGFpZFVzZXJJZCI6IjIzMDI2IiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwiYXVkIjoiaHR0cHM6Ly91dGlsaXRpZXMtc2FuZGJveC5yZWxvYWRseS5jb20iLCJuYmYiOjE3MjAwOTkxMDYsImF6cCI6IjIzMDI2Iiwic2NvcGUiOiJkZXZlbG9wZXIiLCJleHAiOjE3MjAxODU1MDYsImh0dHBzOi8vcmVsb2FkbHkuY29tL2p0aSI6ImJmY2FmOTYxLTgxNjQtNDZmZS1hMTUzLWY1MTQwNDQzYmQyYyIsImlhdCI6MTcyMDA5OTEwNiwianRpIjoiOTI5NzNkNGYtZDIzZS00NDMzLWE2YmUtNWFmYmY0MmRlNjJhIn0.cqUNoMWlHozLFPWBP87bGNUEcst6Fmx_19eOpn6V7Q8`
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

export const getProducts: RequestHandler = async (req, res) => {
    const fetch = require('node-fetch'); 
    // const { size, page, productName, countryCode, includeRange, includeFixed } = req.query;
    // const url = `https://giftcards.reloadly.com/products?size=${size}&page=${page}&productName=${productName}&countryCode=${countryCode}&includeRange=${includeRange}&includeFixed=${includeFixed}`;
    const url = 'https://giftcards-sandbox.reloadly.com/products'; 
    const options = {
  method: 'GET',
  headers: {
    Accept: 'application/com.reloadly.giftcards-v1+json',
    // Authorization: `Bearer ${req.accessToken}`
    Authorization: 'Bearer eyJraWQiOiJjNGE1ZWU1Zi0xYmE2LTQ1N2UtOTI3Yi1lYzdiODliNzcxZTIiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMzAyNiIsImlzcyI6Imh0dHBzOi8vcmVsb2FkbHktc2FuZGJveC5hdXRoMC5jb20vIiwiaHR0cHM6Ly9yZWxvYWRseS5jb20vc2FuZGJveCI6dHJ1ZSwiaHR0cHM6Ly9yZWxvYWRseS5jb20vcHJlcGFpZFVzZXJJZCI6IjIzMDI2IiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwiYXVkIjoiaHR0cHM6Ly9naWZ0Y2FyZHMtc2FuZGJveC5yZWxvYWRseS5jb20iLCJuYmYiOjE3MTc0MjI0MDQsImF6cCI6IjIzMDI2Iiwic2NvcGUiOiJkZXZlbG9wZXIiLCJleHAiOjE3MTc1MDg4MDQsImh0dHBzOi8vcmVsb2FkbHkuY29tL2p0aSI6IjFiNjgxNGMxLWY1OGItNDQxOS1iNzc2LWI4Y2MwMWRkNzU0YyIsImlhdCI6MTcxNzQyMjQwNCwianRpIjoiMzNjMTFhZWEtNDdkNi00MDAzLTg5ZTQtMzM4NDgwZGU4YzBlIn0.Q7aonzbfa-kRH29hO9oXd1EOPxuOwNhnGqnCgQLxDoc'
  }
};

try {
    const response = await fetch(url, options);
    const data = await response.json();

    // Check if the response contains the expected data
    if (!response.ok) {
        return res.status(response.status).json({ error: data.message || 'Failed to fetch products' });
    }

    // Send the data back to the client
    res.status(200).json(data);
} catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: "Internal Server Error" });
}
}

export const getProductById: RequestHandler = async (req, res) => {
    const fetch = require('node-fetch');
    const productId = req.params.productId; // Get the productId from request parameters

    const url = `https://giftcards-sandbox.reloadly.com/products/${productId}`; // Append productId to the URL
    const options = {
        method: 'GET',
        headers: {
            Accept: 'application/com.reloadly.giftcards-v1+json',
            Authorization: 'Bearer eyJraWQiOiJjNGE1ZWU1Zi0xYmE2LTQ1N2UtOTI3Yi1lYzdiODliNzcxZTIiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMzAyNiIsImlzcyI6Imh0dHBzOi8vcmVsb2FkbHktc2FuZGJveC5hdXRoMC5jb20vIiwiaHR0cHM6Ly9yZWxvYWRseS5jb20vc2FuZGJveCI6dHJ1ZSwiaHR0cHM6Ly9yZWxvYWRseS5jb20vcHJlcGFpZFVzZXJJZCI6IjIzMDI2IiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwiYXVkIjoiaHR0cHM6Ly9naWZ0Y2FyZHMtc2FuZGJveC5yZWxvYWRseS5jb20iLCJuYmYiOjE3MTc0MjI0MDQsImF6cCI6IjIzMDI2Iiwic2NvcGUiOiJkZXZlbG9wZXIiLCJleHAiOjE3MTc1MDg4MDQsImh0dHBzOi8vcmVsb2FkbHkuY29tL2p0aSI6IjFiNjgxNGMxLWY1OGItNDQxOS1iNzc2LWI4Y2MwMWRkNzU0YyIsImlhdCI6MTcxNzQyMjQwNCwianRpIjoiMzNjMTFhZWEtNDdkNi00MDAzLTg5ZTQtMzM4NDgwZGU4YzBlIn0.Q7aonzbfa-kRH29hO9oXd1EOPxuOwNhnGqnCgQLxDoc'
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
}

export const getProductByISOCode: RequestHandler = async (req, res) => {
    const fetch = require('node-fetch');
    const countrycode = req.params.countrycode;
    const url = `https://giftcards-sandbox.reloadly.com/countries/${countrycode}/products`;
    const options = {
      method: 'GET',
      headers: {
        Accept: 'application/com.reloadly.giftcards-v1+json',
        Authorization: 'Bearer yJraWQiOiIxNjYyOWUwZC1iM2NhLTRlM2EtYThkMS0xMzUyNjgxZmZkM2EiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMzAyNiIsImlzcyI6Imh0dHBzOi8vcmVsb2FkbHktc2FuZGJveC5hdXRoMC5jb20vIiwiaHR0cHM6Ly9yZWxvYWRseS5jb20vc2FuZGJveCI6dHJ1ZSwiaHR0cHM6Ly9yZWxvYWRseS5jb20vcHJlcGFpZFVzZXJJZCI6IjIzMDI2IiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwiYXVkIjoiaHR0cHM6Ly91dGlsaXRpZXMtc2FuZGJveC5yZWxvYWRseS5jb20iLCJuYmYiOjE3MTc1ODQ0NTQsImF6cCI6IjIzMDI2Iiwic2NvcGUiOiJkZXZlbG9wZXIiLCJleHAiOjE3MTc2NzA4NTQsImh0dHBzOi8vcmVsb2FkbHkuY29tL2p0aSI6IjQ5NDY3MjRiLWUxZmYtNDIwZC1iODI1LWE5ZDcxZThlYWFkMCIsImlhdCI6MTcxNzU4NDQ1NCwianRpIjoiMGNmOGI2MWYtYjkxNi00OTY2LTk0NjktMjM5NmZmYjAxMTYzIn0.9EwO85Q1KsfvsTRATel3XuyAUW7iLpmcNmKypNpJoaI'
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
}

export const RedeemInstruction: RequestHandler= async (req, res) =>{
    const fetch = require('node-fetch');

const url = 'https://giftcards-sandbox.reloadly.com/redeem-instructions';
const options = {
  method: 'GET',
  headers: {
    Accept: 'application/com.reloadly.giftcards-v1+json',
    Authorization: 'Bearer eyJraWQiOiJjNGE1ZWU1Zi0xYmE2LTQ1N2UtOTI3Yi1lYzdiODliNzcxZTIiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMzAyNiIsImlzcyI6Imh0dHBzOi8vcmVsb2FkbHktc2FuZGJveC5hdXRoMC5jb20vIiwiaHR0cHM6Ly9yZWxvYWRseS5jb20vc2FuZGJveCI6dHJ1ZSwiaHR0cHM6Ly9yZWxvYWRseS5jb20vcHJlcGFpZFVzZXJJZCI6IjIzMDI2IiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwiYXVkIjoiaHR0cHM6Ly9naWZ0Y2FyZHMtc2FuZGJveC5yZWxvYWRseS5jb20iLCJuYmYiOjE3MTc1MjkzNjEsImF6cCI6IjIzMDI2Iiwic2NvcGUiOiJkZXZlbG9wZXIiLCJleHAiOjE3MTc2MTU3NjEsImh0dHBzOi8vcmVsb2FkbHkuY29tL2p0aSI6ImFkMGY2Mzc5LWVmYTMtNGQ1ZC05MjIwLTM1NjViYWI2Mjc2YyIsImlhdCI6MTcxNzUyOTM2MSwianRpIjoiODFjMWIyNzQtYzM4My00NWUwLWJlN2UtNmMzOWQ2M2M4NGQyIn0.KmTsQVrOYk4CoZbBG54eHj2QctAc92hGMvhO6vIMd4U'
  }
};

try {
    const response = await fetch(url, options);
    const data = await response.json();

    // Check if the response contains the expected data
    if (!response.ok) {
        return res.status(response.status).json({ error: data.message || 'Failed to fetch instructions' });
    }

    // Send the data back to the client
    res.status(200).json(data);
} catch (error) {
    console.error('Error fetching instructions:', error);
    res.status(500).json({ message: "Internal Server Error" });
}
}

export const redeemInstructionByBrandId: RequestHandler = async (req, res) => {
  const fetch = require('node-fetch');
  const brandId = req.params.brandId;

const url = `https://giftcards-sandbox.reloadly.com/brands/${brandId}/redeem-instructions`;
const options = {
  method: 'GET',
  headers: {
    Accept: 'application/com.reloadly.giftcards-v1+json',
    Authorization: 'Bearer eyJraWQiOiJjNGE1ZWU1Zi0xYmE2LTQ1N2UtOTI3Yi1lYzdiODliNzcxZTIiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMzAyNiIsImlzcyI6Imh0dHBzOi8vcmVsb2FkbHktc2FuZGJveC5hdXRoMC5jb20vIiwiaHR0cHM6Ly9yZWxvYWRseS5jb20vc2FuZGJveCI6dHJ1ZSwiaHR0cHM6Ly9yZWxvYWRseS5jb20vcHJlcGFpZFVzZXJJZCI6IjIzMDI2IiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwiYXVkIjoiaHR0cHM6Ly9naWZ0Y2FyZHMtc2FuZGJveC5yZWxvYWRseS5jb20iLCJuYmYiOjE3MTc1MjkzNjEsImF6cCI6IjIzMDI2Iiwic2NvcGUiOiJkZXZlbG9wZXIiLCJleHAiOjE3MTc2MTU3NjEsImh0dHBzOi8vcmVsb2FkbHkuY29tL2p0aSI6ImFkMGY2Mzc5LWVmYTMtNGQ1ZC05MjIwLTM1NjViYWI2Mjc2YyIsImlhdCI6MTcxNzUyOTM2MSwianRpIjoiODFjMWIyNzQtYzM4My00NWUwLWJlN2UtNmMzOWQ2M2M4NGQyIn0.KmTsQVrOYk4CoZbBG54eHj2QctAc92hGMvhO6vIMd4U'
  }
};

try {
    const response = await fetch(url, options);
    const data = await response.json();

    // Check if the response contains the expected data
    if (!response.ok) {
        return res.status(response.status).json({ error: data.message || 'Failed to fetch instructions' });
    }

    // Send the data back to the client
    res.status(200).json(data);
} catch (error) {
    console.error('Error fetching instructions:', error);
    res.status(500).json({ message: "Internal Server Error" });
}
}

export const getFxRate: RequestHandler = async(req, res) =>{
    const fetch = require('node-fetch');
    const {currencyCode, amount} = req.query
    const url = `https://giftcards-sandbox.reloadly.com/fx-rate?currencyCode=${currencyCode}&amount=${amount}`;
    const options = {
      method: 'GET',
      headers: {
        Accept: 'application/com.reloadly.giftcards-v1+json',
        Authorization: 'Bearer eyJraWQiOiJjNGE1ZWU1Zi0xYmE2LTQ1N2UtOTI3Yi1lYzdiODliNzcxZTIiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMzAyNiIsImlzcyI6Imh0dHBzOi8vcmVsb2FkbHktc2FuZGJveC5hdXRoMC5jb20vIiwiaHR0cHM6Ly9yZWxvYWRseS5jb20vc2FuZGJveCI6dHJ1ZSwiaHR0cHM6Ly9yZWxvYWRseS5jb20vcHJlcGFpZFVzZXJJZCI6IjIzMDI2IiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwiYXVkIjoiaHR0cHM6Ly9naWZ0Y2FyZHMtc2FuZGJveC5yZWxvYWRseS5jb20iLCJuYmYiOjE3MTc1MjkzNjEsImF6cCI6IjIzMDI2Iiwic2NvcGUiOiJkZXZlbG9wZXIiLCJleHAiOjE3MTc2MTU3NjEsImh0dHBzOi8vcmVsb2FkbHkuY29tL2p0aSI6ImFkMGY2Mzc5LWVmYTMtNGQ1ZC05MjIwLTM1NjViYWI2Mjc2YyIsImlhdCI6MTcxNzUyOTM2MSwianRpIjoiODFjMWIyNzQtYzM4My00NWUwLWJlN2UtNmMzOWQ2M2M4NGQyIn0.KmTsQVrOYk4CoZbBG54eHj2QctAc92hGMvhO6vIMd4U'
      }
    };
    
try {
    const response = await fetch(url, options);
    const data = await response.json();

    // Check if the response contains the expected data
    if (!response.ok) {
        return res.status(response.status).json({ error: data.message || 'Failed to fetch fx-rate' });
    }

    // Send the data back to the client
    res.status(200).json(data);
} catch (error) {
    console.error('Error fetching fx-rate:', error);
    res.status(500).json({ message: "Internal Server Error" });
}
}

export const getDiscount: RequestHandler = async (req, res) =>{
    const fetch = require('node-fetch');

const url = 'https://giftcards-sandbox.reloadly.com/discounts?size=&page=';
const options = {
  method: 'GET',
  headers: {
    Accept: 'application/com.reloadly.giftcards-v1+json',
    Authorization: 'Bearer eyJraWQiOiJjNGE1ZWU1Zi0xYmE2LTQ1N2UtOTI3Yi1lYzdiODliNzcxZTIiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMzAyNiIsImlzcyI6Imh0dHBzOi8vcmVsb2FkbHktc2FuZGJveC5hdXRoMC5jb20vIiwiaHR0cHM6Ly9yZWxvYWRseS5jb20vc2FuZGJveCI6dHJ1ZSwiaHR0cHM6Ly9yZWxvYWRseS5jb20vcHJlcGFpZFVzZXJJZCI6IjIzMDI2IiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwiYXVkIjoiaHR0cHM6Ly9naWZ0Y2FyZHMtc2FuZGJveC5yZWxvYWRseS5jb20iLCJuYmYiOjE3MTc1MjkzNjEsImF6cCI6IjIzMDI2Iiwic2NvcGUiOiJkZXZlbG9wZXIiLCJleHAiOjE3MTc2MTU3NjEsImh0dHBzOi8vcmVsb2FkbHkuY29tL2p0aSI6ImFkMGY2Mzc5LWVmYTMtNGQ1ZC05MjIwLTM1NjViYWI2Mjc2YyIsImlhdCI6MTcxNzUyOTM2MSwianRpIjoiODFjMWIyNzQtYzM4My00NWUwLWJlN2UtNmMzOWQ2M2M4NGQyIn0.KmTsQVrOYk4CoZbBG54eHj2QctAc92hGMvhO6vIMd4U'
  }
};

try {
    const response = await fetch(url, options);
    const data = await response.json();

    // Check if the response contains the expected data
    if (!response.ok) {
        return res.status(response.status).json({ error: data.message || 'Failed to fetch discounts' });
    }

    // Send the data back to the client
    res.status(200).json(data);
} catch (error) {
    console.error('Error fetching discounts:', error);
    res.status(500).json({ message: "Internal Server Error" });
}
}

export const getDiscountByProductId: RequestHandler = async (req, res) => {
    const fetch = require('node-fetch');
const productId = req.params.productId;
const url = `https://giftcards-sandbox.reloadly.com/products/${productId}/discounts`;
const options = {
  method: 'GET',
  headers: {
    Accept: 'application/com.reloadly.giftcards-v1+json',
    Authorization: 'Bearer eyJraWQiOiJjNGE1ZWU1Zi0xYmE2LTQ1N2UtOTI3Yi1lYzdiODliNzcxZTIiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMzAyNiIsImlzcyI6Imh0dHBzOi8vcmVsb2FkbHktc2FuZGJveC5hdXRoMC5jb20vIiwiaHR0cHM6Ly9yZWxvYWRseS5jb20vc2FuZGJveCI6dHJ1ZSwiaHR0cHM6Ly9yZWxvYWRseS5jb20vcHJlcGFpZFVzZXJJZCI6IjIzMDI2IiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwiYXVkIjoiaHR0cHM6Ly9naWZ0Y2FyZHMtc2FuZGJveC5yZWxvYWRseS5jb20iLCJuYmYiOjE3MTc1MjkzNjEsImF6cCI6IjIzMDI2Iiwic2NvcGUiOiJkZXZlbG9wZXIiLCJleHAiOjE3MTc2MTU3NjEsImh0dHBzOi8vcmVsb2FkbHkuY29tL2p0aSI6ImFkMGY2Mzc5LWVmYTMtNGQ1ZC05MjIwLTM1NjViYWI2Mjc2YyIsImlhdCI6MTcxNzUyOTM2MSwianRpIjoiODFjMWIyNzQtYzM4My00NWUwLWJlN2UtNmMzOWQ2M2M4NGQyIn0.KmTsQVrOYk4CoZbBG54eHj2QctAc92hGMvhO6vIMd4U'
  }
};

try {
    const response = await fetch(url, options);
    const data = await response.json();

    // Check if the response contains the expected data
    if (!response.ok) {
        return res.status(response.status).json({ error: data.message || 'Failed to fetch discounts' });
    }

    // Send the data back to the client
    res.status(200).json(data);
} catch (error) {
    console.error('Error fetching discounts:', error);
    res.status(500).json({ message: "Internal Server Error" });
}
}

export const orderGiftCard: RequestHandler = async (req, res) => {
    const fetch = require('node-fetch');
    const {productId, quantity, unitPrice, senderName, recipientEmail} = req.body
    const userId = req.user.id;

const url = 'https://giftcards-sandbox.reloadly.com/orders';
const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/com.reloadly.giftcards-v1+json',
    Authorization: 'Bearer eyJraWQiOiJjNGE1ZWU1Zi0xYmE2LTQ1N2UtOTI3Yi1lYzdiODliNzcxZTIiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMzAyNiIsImlzcyI6Imh0dHBzOi8vcmVsb2FkbHktc2FuZGJveC5hdXRoMC5jb20vIiwiaHR0cHM6Ly9yZWxvYWRseS5jb20vc2FuZGJveCI6dHJ1ZSwiaHR0cHM6Ly9yZWxvYWRseS5jb20vcHJlcGFpZFVzZXJJZCI6IjIzMDI2IiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwiYXVkIjoiaHR0cHM6Ly9naWZ0Y2FyZHMtc2FuZGJveC5yZWxvYWRseS5jb20iLCJuYmYiOjE3MTg3OTYyNTcsImF6cCI6IjIzMDI2Iiwic2NvcGUiOiJkZXZlbG9wZXIiLCJleHAiOjE3MTg4ODI2NTcsImh0dHBzOi8vcmVsb2FkbHkuY29tL2p0aSI6ImZiMDE5MzgzLTdjNzktNDBlNy04MDYxLWJhNzBjMGIyMzE2NCIsImlhdCI6MTcxODc5NjI1NywianRpIjoiMzUzZTkyNDUtNDQ1MS00YWU0LTk1YzQtMzRhYjBjYjhjMGJiIn0.idxnADt0b20k71cf9K3jgsHu7FNU5iGWVlDvX6kBbeM'
  },
  body: JSON.stringify({
    productId: 10,
    quantity: 2,
    unitPrice: 5,
    customIdentifier: randomIdentifier,
    senderName: 'John Doe',
    recipientEmail: 'anyone@email.com',
    recipientPhoneDetails: {countryCode: 'ES', phoneNumber: '012345678'},
    preOrder: false
  })

//   {
//     "transactionId": 31739,
//     "amount": 17.83367,
//     "discount": 0.44,
//     "currencyCode": "CAD",
//     "fee": 2.83,
//     "smsFee": 0.28,
//     "totalFee": 3.11,
//     "preOrdered": false,
//     "recipientEmail": "anyone@email.com",
//     "recipientPhone": "34012345678",
//     "customIdentifier": "obucks15",
//     "status": "SUCCESSFUL",
//     "transactionCreatedTime": "2024-06-19 07:27:07",
//     "product": {
//         "productId": 10,
//         "productName": "App Store & iTunes Austria",
//         "countryCode": "AT",
//         "quantity": 2,
//         "unitPrice": 5,
//         "totalPrice": 10,
//         "currencyCode": "EUR",
//         "brand": {
//             "brandId": 3,
//             "brandName": "App Store & iTunes"
//         }
//     }
// }
};
try {
    const response = await fetch(url, options);
    const data = await response.json();

    // Check if the response contains the expected data
    if (!response.ok) {
        return res.status(response.status).json({ error: data.message || 'Failed to fetch discounts' });
    }
    const giftcard = await giftCardModel.create({
        userId: userId,
        quantity: data.product.quantity,
        recipientEmail: data.recipientEmail,
        transactionId: data.transactionId,
        status: data.status,
        productId: data.product.productId,
        productName: data.product.productName,
        countryCode: data.product.countryCode,
        brandName: data.product.brand.brandName,
        totalPrice: data.product.totalPrice,
        currencyCode: data.product.currencyCode,
        senderName: data.senderName,
        preOrder: data.preOrdered,
        recipientPhone: data.recipientPhone,
        customIdentifier: data.customIdentifier,
        transactionCreatedTime: data.transactionCreatedTime,
        discount: data.discount,
        totalFee: data.totalFee,
        brandId: data.product.brand.brandId,
        amount: data.amount,
        recipantEmail: data.recipientEmail,
        unitPrice: data.product.unitPrice
      })
      console.log(giftcard)
    // Send the data back to the client
    res.status(200).json(data);
} catch (error) {
    console.error('Error fetching discounts:', error);
    res.status(500).json({ message: "Internal Server Error" });
}
}

export const getRedeemCode: RequestHandler = async (req, res) => {
    const fetch = require('node-fetch');

const url = 'https://giftcards-sandbox.reloadly.com/orders/transactions//cards';
const options = {
  method: 'GET',
  headers: {
    Accept: 'application/com.reloadly.giftcards-v1+json',
    Authorization: 'Bearer eyJraWQiOiJjNGE1ZWU1Zi0xYmE2LTQ1N2UtOTI3Yi1lYzdiODliNzcxZTIiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMzAyNiIsImlzcyI6Imh0dHBzOi8vcmVsb2FkbHktc2FuZGJveC5hdXRoMC5jb20vIiwiaHR0cHM6Ly9yZWxvYWRseS5jb20vc2FuZGJveCI6dHJ1ZSwiaHR0cHM6Ly9yZWxvYWRseS5jb20vcHJlcGFpZFVzZXJJZCI6IjIzMDI2IiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwiYXVkIjoiaHR0cHM6Ly9naWZ0Y2FyZHMtc2FuZGJveC5yZWxvYWRseS5jb20iLCJuYmYiOjE3MTc1MjkzNjEsImF6cCI6IjIzMDI2Iiwic2NvcGUiOiJkZXZlbG9wZXIiLCJleHAiOjE3MTc2MTU3NjEsImh0dHBzOi8vcmVsb2FkbHkuY29tL2p0aSI6ImFkMGY2Mzc5LWVmYTMtNGQ1ZC05MjIwLTM1NjViYWI2Mjc2YyIsImlhdCI6MTcxNzUyOTM2MSwianRpIjoiODFjMWIyNzQtYzM4My00NWUwLWJlN2UtNmMzOWQ2M2M4NGQyIn0.KmTsQVrOYk4CoZbBG54eHj2QctAc92hGMvhO6vIMd4U'
  }
};

try {
    const response = await fetch(url, options);
    const data = await response.json();

    // Check if the response contains the expected data
    if (!response.ok) {
        return res.status(response.status).json({ error: data.message || 'Failed to fetch order' });
    }

    // Send the data back to the client
    res.status(200).json(data);
} catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: "Internal Server Error" });
}
}

export const getTransactionsById: RequestHandler = async (req, res) => {
    const fetch = require('node-fetch');
    const transactionId = req.params.transactionId;

const url = `https://giftcards-sandbox.reloadly.com/reports/transactions/${transactionId}`;
const options = {
  method: 'GET',
  headers: {
    Accept: 'application/com.reloadly.giftcards-v1+json',
    Authorization: 'Bearer eyJraWQiOiJjNGE1ZWU1Zi0xYmE2LTQ1N2UtOTI3Yi1lYzdiODliNzcxZTIiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMzAyNiIsImlzcyI6Imh0dHBzOi8vcmVsb2FkbHktc2FuZGJveC5hdXRoMC5jb20vIiwiaHR0cHM6Ly9yZWxvYWRseS5jb20vc2FuZGJveCI6dHJ1ZSwiaHR0cHM6Ly9yZWxvYWRseS5jb20vcHJlcGFpZFVzZXJJZCI6IjIzMDI2IiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwiYXVkIjoiaHR0cHM6Ly9naWZ0Y2FyZHMtc2FuZGJveC5yZWxvYWRseS5jb20iLCJuYmYiOjE3MTc1MjkzNjEsImF6cCI6IjIzMDI2Iiwic2NvcGUiOiJkZXZlbG9wZXIiLCJleHAiOjE3MTc2MTU3NjEsImh0dHBzOi8vcmVsb2FkbHkuY29tL2p0aSI6ImFkMGY2Mzc5LWVmYTMtNGQ1ZC05MjIwLTM1NjViYWI2Mjc2YyIsImlhdCI6MTcxNzUyOTM2MSwianRpIjoiODFjMWIyNzQtYzM4My00NWUwLWJlN2UtNmMzOWQ2M2M4NGQyIn0.KmTsQVrOYk4CoZbBG54eHj2QctAc92hGMvhO6vIMd4U'
  }
};

try {
    const response = await fetch(url, options);
    const data = await response.json();

    // Check if the response contains the expected data
    if (!response.ok) {
        return res.status(response.status).json({ error: data.message || 'Failed to fetch transactions' });
    }

    // Send the data back to the client
    res.status(200).json(data);
} catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: "Internal Server Error" });
}
}

export const getTransactions: RequestHandler = async (req, res) =>{
    const fetch = require('node-fetch');
    const {size, page, customIdentifier, startDate, endDate} = req.query

    const url = `https://giftcards-sandbox.reloadly.com/reports/transactions?size=1&page=10&customIdentifier${customIdentifier}=&startDate=&endDate=`;
    const options = {
      method: 'GET',
      headers: {
        Accept: 'application/com.reloadly.giftcards-v1+json',
        Authorization: 'Bearer eyJraWQiOiJjNGE1ZWU1Zi0xYmE2LTQ1N2UtOTI3Yi1lYzdiODliNzcxZTIiLCJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMzAyNiIsImlzcyI6Imh0dHBzOi8vcmVsb2FkbHktc2FuZGJveC5hdXRoMC5jb20vIiwiaHR0cHM6Ly9yZWxvYWRseS5jb20vc2FuZGJveCI6dHJ1ZSwiaHR0cHM6Ly9yZWxvYWRseS5jb20vcHJlcGFpZFVzZXJJZCI6IjIzMDI2IiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIiwiYXVkIjoiaHR0cHM6Ly9naWZ0Y2FyZHMtc2FuZGJveC5yZWxvYWRseS5jb20iLCJuYmYiOjE3MTc2NzQ3MjMsImF6cCI6IjIzMDI2Iiwic2NvcGUiOiJkZXZlbG9wZXIiLCJleHAiOjE3MTc3NjExMjMsImh0dHBzOi8vcmVsb2FkbHkuY29tL2p0aSI6IjkyOGZjY2I5LTE1NDktNDhmNC04MzBlLWM3NGRjMmU3MGVhZCIsImlhdCI6MTcxNzY3NDcyMywianRpIjoiYjQxZjcwNTMtYTAwNS00ODRmLWIwNWUtMjllYTVhYTg4N2UwIn0.EmK633XoMULQqhehLIJXX-G3RIdvnOh3LuqlSxn7Png'
      }
    };
    
    try {
        const response = await fetch(url, options);
        const data = await response.json();
    
        // Check if the response contains the expected data
        if (!response.ok) {
            return res.status(response.status).json({ error: data.message || 'Failed to fetch transactions' });
        }
    
        // Send the data back to the client
        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: "Internal Server Error" });
    }

}