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