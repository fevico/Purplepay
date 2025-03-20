import { Router } from "express";
import { 
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
} from "../controller/notification";
import { isAuthenticated } from "../middleware/auth";

const notificationRouter = Router();

// Apply authentication middleware
notificationRouter.use(isAuthenticated);

// Get all notifications for the authenticated user
notificationRouter.get("/", getNotifications);

// Mark a notification as read
notificationRouter.put("/:id/read", markNotificationAsRead);

// Mark all notifications as read
notificationRouter.put("/read-all", markAllNotificationsAsRead);

// Delete a notification
notificationRouter.delete("/:id", deleteNotification);

export default notificationRouter;
