import { Router } from "express";
import { 
    getSecuritySettings, 
    updateSecuritySettings, 
    addTrustedDevice, 
    removeTrustedDevice,
    getTrustedDevices,
    updateTrustedDevice,
    verifyTrustedDevice,
    verifyHighValueTransfer,
    setTransactionPin
} from "../controller/security";
import { isAuthenticated } from "../middleware/auth";

const securityRouter = Router();

// Apply auth middleware to all security routes
securityRouter.use(isAuthenticated);

// Security settings routes
securityRouter.get('/settings', getSecuritySettings);
securityRouter.put('/settings', updateSecuritySettings);

// Transaction PIN route
securityRouter.post('/set-transaction-pin', setTransactionPin);

// Trusted device routes
securityRouter.get('/trusted-devices', getTrustedDevices);
securityRouter.post('/trusted-devices', addTrustedDevice);
securityRouter.put('/trusted-devices/:deviceId', updateTrustedDevice);
securityRouter.delete('/trusted-devices/:deviceId', removeTrustedDevice);
securityRouter.post('/trusted-devices/verify', verifyTrustedDevice);

// High value transfer verification
securityRouter.post('/verify-transfer', verifyHighValueTransfer);

export default securityRouter;
