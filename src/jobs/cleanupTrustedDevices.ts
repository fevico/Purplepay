import cron from 'node-cron';
import { cleanupOldTrustedDevices } from '../controller/security';
import { logger } from '../utils/logger';

let cleanupJob: cron.ScheduledTask | null = null;

/**
 * Initialize the trusted device cleanup job
 * By default, runs once a week (every Sunday at 2:00 AM)
 * @param cronSchedule Custom cron schedule (optional)
 */
export const initCleanupTrustedDevicesJob = (cronSchedule: string = '0 2 * * 0'): void => {
    try {
        // Cancel any existing job
        if (cleanupJob) {
            cleanupJob.stop();
        }

        // Schedule the new job
        cleanupJob = cron.schedule(cronSchedule, async () => {
            logger.info('Starting scheduled cleanup of old trusted devices');
            try {
                await cleanupOldTrustedDevices(90); // Remove devices not used in 90 days
                logger.info('Scheduled cleanup of old trusted devices completed successfully');
            } catch (error) {
                logger.error('Error in scheduled cleanup of old trusted devices:', error);
            }
        });

        logger.info(`Trusted device cleanup job scheduled with cron pattern: ${cronSchedule}`);
    } catch (error) {
        logger.error('Error initializing trusted device cleanup job:', error);
    }
};

/**
 * Stop the trusted device cleanup job
 */
export const stopCleanupTrustedDevicesJob = (): void => {
    if (cleanupJob) {
        cleanupJob.stop();
        cleanupJob = null;
        logger.info('Trusted device cleanup job stopped');
    }
};

/**
 * Run the trusted device cleanup job manually
 * @param daysThreshold Number of days of inactivity before a device is considered old (default: 90)
 */
export const runCleanupTrustedDevicesJobManually = async (daysThreshold: number = 90): Promise<void> => {
    logger.info('Running trusted device cleanup job manually');
    try {
        await cleanupOldTrustedDevices(daysThreshold);
        logger.info('Manual trusted device cleanup completed successfully');
    } catch (error) {
        logger.error('Error in manual trusted device cleanup:', error);
    }
};
