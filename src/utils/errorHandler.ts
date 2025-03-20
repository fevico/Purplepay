import { Request, Response } from 'express';

/**
 * Handle errors in a consistent way across the application
 */
export const handleError = (error: any, req: Request, res: Response): void => {
  console.error('Error:', error);
  
  // Check if it's a validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => err.message);
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
    return;
  }
  
  // Check if it's a duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    res.status(409).json({
      success: false,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
    });
    return;
  }
  
  // Check if it's a custom error with a specific status code
  if (error.statusCode) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
};
