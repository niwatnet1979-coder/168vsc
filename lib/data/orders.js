import { DataManager } from '../dataManager';

/**
 * Save order (create or update)
 * Delegates to the existing DataManager.saveOrder for full logic.
 */
export async function saveOrder(orderData) {
    try {
        console.log('[OrdersAPI.saveOrder] Delegating to DataManager.saveOrder');
        const result = await DataManager.saveOrder(orderData);
        console.log('[OrdersAPI.saveOrder] Result:', result);
        return result;
    } catch (error) {
        console.error('[OrdersAPI.saveOrder] Error:', error);
        throw error;
    }
}

// Export as OrdersAPI object for compatibility
export const OrdersAPI = {
    saveOrder
};
