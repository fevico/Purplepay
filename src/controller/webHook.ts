import { RequestHandler } from "express";
import fs from 'fs'
import path from "path";
// const fs = require('fs');
// const path = require('path');

export const handleWebhook: RequestHandler = async(req, res) => {
    const input = JSON.stringify(req.body);

    const logFilePath = path.join(__dirname, '..', 'logs', 'StroAccountWebHook.txt');
    const errorLogFilePath = path.join(__dirname, '..', 'logs', 'StroAccountWebHook_error_log.txt');

    fs.writeFile(logFilePath, input, (err) => {
        if (err) {
            console.error("Failed to open StroAccountWebHook.txt for writing.");
            fs.appendFile(errorLogFilePath, `Error: ${err.message}\n`, (err) => {
                if (err) console.error('Error logging to error file:', err);
            });
            return res.status(500).json({ message: "Internal Server Error" });
        }

        const response = req.body;

        if (response && response.sessionId) {
            // Extracting fields from the webhook payload
            const {
                sessionId, accountNumber, tranRemarks, transactionAmount,
                settledAmount, feeAmount, vatAmount, currency,
                initiationTranRef, settlementId, sourceAccountNumber,
                sourceAccountName, sourceBankName, channelId, tranDateTime
            } = response;

            // ... (you can add further processing here, if needed)

            return res.status(200).json({ message: "Webhook received successfully" });
        } else {
            console.error("Webhook data was not received or lacked the sessionId field.");
            return res.status(400).json({ message: "Bad Request: sessionId missing" });
        }
    });
};
