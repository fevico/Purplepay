import cron from 'node-cron';
import { executeScheduledTransfers } from '../controller/wallet';
import { logger } from '../utils/logger';

/**
 * Initialize scheduled transfer job
 * This job runs every hour to check and execute scheduled transfers
 */
export const initScheduledTransferJob = () => {
    let isRunning = false;
    
    // Run every hour at minute 0
    const scheduledJob = cron.schedule('0 * * * *', async () => {
        isRunning = true;
        logger.info('Running scheduled transfer job at:', new Date().toISOString());
        
        try {
            const result = await executeScheduledTransfers();
            
            if (result.success) {
                logger.info(`Successfully executed ${result.executedCount} scheduled transfers`);
                
                // Log details about executed transfers
                if ('executedTransfers' in result && result.executedTransfers && result.executedTransfers.length > 0) {
                    logger.info(`Details of executed transfers: ${JSON.stringify(result.executedTransfers)}`);
                }
            } else {
                logger.error('Failed to execute scheduled transfers:', result.error);
            }
        } catch (error) {
            logger.error('Error in scheduled transfer job:', error);
        } finally {
            isRunning = false;
        }
    }, {
        scheduled: false // Don't start automatically
    });
    
    logger.info('Scheduled transfer job initialized');
    
    // Start the job
    scheduledJob.start();
    
    return {
        start: () => {
            scheduledJob.start();
            logger.info('Scheduled transfer job started');
        },
        stop: () => {
            scheduledJob.stop();
            logger.info('Scheduled transfer job stopped');
        },
        getStatus: () => {
            // Return a simple status string
            return isRunning ? 'running' : 'idle';
        },
        runNow: async () => {
            if (isRunning) {
                return { success: false, error: 'Job is already running' };
            }
            
            isRunning = true;
            logger.info('Manually running scheduled transfer job at:', new Date().toISOString());
            
            try {
                const result = await executeScheduledTransfers();
                return result;
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                logger.error('Error in manual scheduled transfer job execution:', errorMessage);
                return { success: false, error: errorMessage };
            } finally {
                isRunning = false;
            }
        }
    };
};
