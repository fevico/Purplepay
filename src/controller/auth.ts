import { RequestHandler } from "express";
import TokenModel from "src/model/authToken";
import userModel from "src/model/user";
import { generateToken, sendErrorRes } from "src/utils/helper";
import { ForgetPasswordToken, sendVerificationToken } from "src/utils/mail";
import jwt from "jsonwebtoken";
import passwordResetTokenModel from "src/model/passwordResetToken";

export const createUser: RequestHandler = async (req, res) => {
  const { email, password } = req.body;
  const emailExist = await userModel.findOne({ email });
  if (emailExist) {
    return sendErrorRes(res, "User already exist!", 403);
  }
  const user = await userModel.create({ email, password });
  const token = generateToken();
  await TokenModel.create({ owner: user._id, token });
  sendVerificationToken(email, token);
  return res.status(200).json({ user });
};
 
export const verifyAuthToken: RequestHandler = async (req, res) => {
  const { owner, token } = req.body;
  const tokenDoc = await TokenModel.findOne({ owner });
  if (!tokenDoc)
    return sendErrorRes(res, "Uanthorize request, Invalid token!", 403);
  const user = await userModel.findById(owner);
  if (!user)
    return sendErrorRes(res, "Uanthorize request, Invalid token!", 403);
  const matchToken = tokenDoc.compareToken(token);
  if (!matchToken) return sendErrorRes(res, "Invalid token!", 403);
  user.verified = true;
  await user.save();
  return res.json({ message: "user verified" });
};

export const updateProfile: RequestHandler = async (req, res) => {
    const { userId, name, phoneNumber, referralCode, country } = req.body;
    const user = await userModel.findByIdAndUpdate(userId, { name, phoneNumber, referralCode, country});
    if (!user) return sendErrorRes(res, "User not found!", 404);
    // if (name) user.name = name;
    // if (phoneNumber) user.phoneNumber = phoneNumber;
    // if (password) user.password = password;
    // if (referralCode) user.password = referralCode;
    // if (country) user.password = country;
    await user.save();
    return res.json({ user: {name, phoneNumber, country} });
}

export const login: RequestHandler = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find user by email
      const user = await userModel.findOne({ email });
  
      // If user not found, return error response
      if (!user) {
        return sendErrorRes(res, "User not found!", 404);
      }

      if(!user.verified) return sendErrorRes(res, "User not verified! Please verify your email address", 403);
  
      // Compare provided password with stored password
      const matchPassword = await user.comparePassword(password);
  
      // If password does not match, return error response
      if (!matchPassword) {
        return sendErrorRes(res, "Invalid password!", 401);
      }
  
      // Generate JWT token
      const token = jwt.sign({ userId: user._id, name: user.name },  process.env.JWT_SECRET as string, { expiresIn: "1h" });
  
      // Send the token as a response
      res.json({ token });
    } catch (error) {
      // Handle any unexpected errors
      console.log(error)
      sendErrorRes(res, "Something went wrong!", 500); 
    }
  };

  export const setTransactionPin: RequestHandler = async (req, res) =>{
    const {transactionPin} = req.body;
    const user = await userModel.findById(req.user.id);
    if(!user) return sendErrorRes(res, "Unauthorize request, User not found!", 403);
    user.transactionPin = transactionPin;
    await user.save();
    res.json({message: "Transaction pin set successfully!"})
  }

export const verifyTransactionPin: RequestHandler = async (req, res) =>{
  const {transactionPin} = req.body;
  const user = await userModel.findById(req.user.id);
  if(!user) return sendErrorRes(res, "Unauthorize request, User not found!", 403);
  // if(user.transactionPin !== transactionPin) return sendErrorRes(res, "Invalid transaction pin!", 401);
  const tokenMatch = await user.comparePin(transactionPin);
  if(!tokenMatch) return sendErrorRes(res, "Invalid transaction pin!", 401);
  res.json({message: "Transaction pin verified successfully!"})
}

export const sendForgetPasswordToken: RequestHandler = async (req, res) => {
  const { email } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) return sendErrorRes(res, "User not found!", 404);
  const token = generateToken()
  await passwordResetTokenModel.create({ token, owner: user._id})

  ForgetPasswordToken(email, token, user.name);
  
  res.json({ message: "Token sent to your email!" });
}

export const verifyForgetPasswordToken: RequestHandler = async (req, res) => {
  const { token, owner } = req.body;
  const passwordResetToken = await passwordResetTokenModel.findOne({ owner });
  if (!passwordResetToken) return sendErrorRes(res, "Invalid or expired token!", 404);
  const user = await userModel.findById(owner);
  if (!user) return sendErrorRes(res, "User not found!", 404);
  const tokenMatch = await passwordResetToken.compareToken(token);
  if(!tokenMatch) return sendErrorRes(res, "Invalid or expired token!", 404);
  res.json({message: "Token verified sucessfully!"})
}

export const resetPassword: RequestHandler = async (req, res) => {
  const { userId, password } = req.body;
  const user = await userModel.findById(userId);
  if (!user) return sendErrorRes(res, "User not found!", 404);
  user.password = password;
  await user.save();
  
  await passwordResetTokenModel.findOneAndDelete({owner: user._id});
  res.json({message: "Password reset successfully!"})
}
  
