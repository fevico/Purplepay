import { RequestHandler } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import userModel from "src/model/user";
import { sendErrorRes } from "src/utils/helper";

// Define the user profile interface for the request object
interface UserProfile {
  id: string;
  name: string;
  email: string;
  verified: boolean;
}

// Extend the Express request object to include the user profile
declare global {
  namespace Express {
    interface Request {
      user: UserProfile;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET!;

export const isAuth: RequestHandler = async (req, res, next) => {
  try {
    const authToken = req.headers.authorization;
    if (!authToken) return sendErrorRes(res, "Unauthorized request!", 403);

    const token = authToken.split("Bearer ")[1];
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await userModel.findById(payload.userId);
    if (!user) return sendErrorRes(res, "Unauthorized requests!", 403);

    req.user = {
      id: user._id!.toString(), // Ensure ObjectId is converted to string
      name: user.name,
      email: user.email,
      verified: user.verified,
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return sendErrorRes(res, "Session expired!", 401);
    }

    if (error instanceof JsonWebTokenError) {
      return sendErrorRes(res, "Unauthorized access!", 401);
    }

    next(error);
  }
};
