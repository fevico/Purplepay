import { Response } from "express";

export const sendErrorRes = (res:Response, message: string, statusCode: number) => {
    res.status(statusCode).json({ message });
}

export const generateToken = (length = 4) =>{
    // decallar variable 
    let otp = "";
    
    for(let i = 0; i < length; i++){
        const digit = Math.floor(Math.random() * 10)
        otp += digit
    }
    return otp;
}

/**
 * Generate a unique reference for transactions and bill payments
 * @param prefix Optional prefix for the reference
 * @returns A unique reference string
 */
export const generateReference = (prefix = 'BP') => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${timestamp}${random}`;
}