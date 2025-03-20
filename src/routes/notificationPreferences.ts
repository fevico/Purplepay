import { Router } from "express";
import { 
    getNotificationPreferences,
    updateNotificationPreferences,
    resetNotificationPreferences
} from "../controller/notificationPreferences";
import { isAuthenticated } from "../middleware/auth";

const notificationPreferencesRouter = Router();

// Apply authentication middleware
notificationPreferencesRouter.use(isAuthenticated);

// Get notification preferences for the authenticated user
notificationPreferencesRouter.get("/", getNotificationPreferences);

// Update notification preferences
notificationPreferencesRouter.put("/", updateNotificationPreferences);

// Reset notification preferences to default
notificationPreferencesRouter.post("/reset", resetNotificationPreferences);

export default notificationPreferencesRouter;
