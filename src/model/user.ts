import { compare, genSalt, hash } from "bcrypt";
import { Document, Schema, model } from "mongoose";

interface userDocument extends Document {
  name: string;
  email: string;
  password: string;
  phoneNumber: number;
  country: string;
  referralCode: string;
  verified: boolean;
  transactionPin: string;
  role: "admin" | "user";
  tag: string;
  tagPrivacy: "public" | "friends" | "private";
  profilePicture: string;
}

interface methods {
  comparePassword(password: string): Promise<boolean>;
  comparePin(transactionPin: string): Promise<boolean>;
}

const userSchema = new Schema<userDocument, {}, methods>({
  name: { type: String },
  email: { type: String, required: true },
  password: { type: String },
  phoneNumber: {
    type: Number,
  },
  country: { type: String },
  referralCode: { type: String },
  verified: { type: Boolean, default: false },
  transactionPin: { type: String },
  role: { type: String, default: "user" },
  tag: { 
    type: String, 
    unique: true, 
    sparse: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^[a-zA-Z0-9_]{3,20}$/.test(v);
      },
      message: (props: { value: string }) => `${props.value} is not a valid tag! Use 3-20 alphanumeric characters or underscores.`
    }
  },
  tagPrivacy: { 
    type: String, 
    enum: ["public", "friends", "private"], 
    default: "public" 
  },
  profilePicture: { type: String },
  // transactions: [{ type: Schema.Types.ObjectId, ref: "Transaction" }],
}, {timestamps: true});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await genSalt(10);
    this.password = await hash(this.password, salt);
  }
  next();
});
userSchema.methods.comparePassword = async function (password) {
  return await compare(password, this.password);
};
userSchema.pre("save", async function (next) {
  if (this.isModified("transactionPin")) {
    const salt = await genSalt(10);
    this.transactionPin = await hash(this.transactionPin, salt);
  }
  next();
});
userSchema.methods.comparePin = async function (transactionPin) {
  return await compare(transactionPin, this.transactionPin);
};

const userModel = model("User", userSchema);
export default userModel;
