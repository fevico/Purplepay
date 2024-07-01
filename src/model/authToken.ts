import { compare, genSalt, hash } from "bcrypt";
import { ObjectId, Schema, model } from "mongoose";

interface AuthTokenDocument extends Document{
  owner: ObjectId;
  token: string;
  createdAt: Date;
}

interface methods{
    compareToken(token: string): Promise<boolean>
}

const tokenSchema = new Schema<AuthTokenDocument, {}, methods>({
  owner: { type: Schema.Types.ObjectId,
    ref: 'User'
},
token:{
    type: String,
}, 
createdAt:{
    type: Date,
    expires: 3600,
    default: Date.now,
}
},{timestamps: true});

tokenSchema.pre('save', async function(next){
    if(this.isModified('token')){
        const salt = await genSalt(10)
        this.token = await hash(this.token, salt)
    }
    next()
})
tokenSchema.methods.compareToken = async function(token){
  return  await compare(token, this.token)
}

const TokenModel = model("AuthToken", tokenSchema);
export default TokenModel;
