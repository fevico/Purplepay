import {connect, ConnectOptions} from "mongoose"

// For MongoDB Atlas - replace with your actual password
// const uri = "mongodb+srv://falagbe:your_password_here@purplepayserver.y49yweq.mongodb.net/purple-pay?retryWrites=true&w=majority"

// For local MongoDB or Docker container
const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/purple-pay"

// Set environment variables for API keys if not already set
if (!process.env.PUBLIC_KEY) {
    process.env.PUBLIC_KEY = "HACMTSR37NBTFSS1Z1WFAS98CX8FK4";
}
if (!process.env.SECRET_KEY) {
    process.env.SECRET_KEY = "CF895M8RXZJE2QG3H5JAQ7HPEU1ERV";
}

// Improved connection options to prevent timeouts
const connectionOptions: ConnectOptions = {
    connectTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 30000,
    serverSelectionTimeoutMS: 30000,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    // w: 'majority' // Removed to fix TypeScript error
};

connect(uri, connectionOptions).then(() =>{
    console.log('db connected successfully.')
}).catch(err =>{
    console.log('db connection error:', err.message)
})