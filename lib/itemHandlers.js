/**
 * Item Handler Utilities for Order Component
 * Provides wrapper functions for item-related operations
 */

/**
 * Creates item handler functions
 * @param {Object} handlers - Handler functions from createOrderHandlers
 * @returns {Object} Item handler functions
 */
export function createItemHandlers(handlers) {
    return {
        saveItem: (itemData, setEditingItemIndex) => handlers.saveItem(itemData, setEditingItemIndex),
        addJobToItem: () => handlers.addJobToItem(),
        // FIX: Pass itemIndex to deleteItem handler
        deleteItem: (itemIndex) => handlers.deleteItem(itemIndex),
        deleteJobFromItem: (jobIdx) => handlers.deleteJobFromItem(jobIdx)
    }
}
