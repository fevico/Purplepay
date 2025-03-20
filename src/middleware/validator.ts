import { RequestHandler } from "express";
import { sendErrorRes } from "../utils/helper";
import * as yup from "yup";
import { validationResult } from "express-validator";

const validate = (schema: yup.Schema): RequestHandler => {
  return async (req, res, next) => {
    try {
      await schema.validate(
        { ...req.body },
        { strict: true, abortEarly: true }
      );
      next();
    } catch (error) {
      if (error instanceof yup.ValidationError) {
        sendErrorRes(res, error.message, 422);
      } else {
        next();
      }
    }
  };
};

/**
 * Middleware to validate request using express-validator
 */
export const validateRequest: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

export default validate
