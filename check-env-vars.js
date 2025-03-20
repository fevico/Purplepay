require('dotenv').config();

console.log('Environment Variables:');
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set (not showing for security)' : 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set (not showing for security)' : 'Not set');
