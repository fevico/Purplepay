import mongoose from 'mongoose';

/**
 * Create a transaction record in the database
 * 
 * @param userId User ID
 * @param amount Transaction amount
 * @param type Transaction type
 * @param description Transaction description
 * @param reference Transaction reference
 * @param status Transaction status
 * @param metadata Additional metadata
 * @returns Transaction object
 */
export const createTransaction = async (
  userId: mongoose.Types.ObjectId | string,
  amount: number,
  type: string,
  description: string,
  reference: string,
  status: string = 'success',
  metadata: any = {}
) => {
  // Mock implementation for testing
  return {
    _id: new mongoose.Types.ObjectId(),
    userId,
    amount,
    type,
    description,
    reference,
    status,
    metadata,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};
