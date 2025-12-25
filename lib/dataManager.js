/**
 * DataManager - Main Facade
 * Re-exports all data management functions from modular files
 * Maintains backward compatibility with existing code
 */

import { supabase } from './supabaseClient'

// Import all refactored modules
import * as helpers from './data/helpers'
import * as uploadManager from './data/uploadManager'
import * as employeeManager from './data/employeeManager'
import * as teamManager from './data/teamManager'
import * as qcManager from './data/qcManager'
import * as inventoryManager from './data/inventoryManager'
import * as productManager from './data/productManager'
import * as customerManager from './data/customerManager'
import * as orderManager from './data/orderManager'

/**
 * Main DataManager object - combines all modules
 * Maintains 100% backward compatibility
 */
export const DataManager = {
    // Export supabase for Realtime subscriptions
    supabase,

    // Helpers (refactored)
    ...helpers,

    // Upload Manager (refactored)
    ...uploadManager,

    // Employee Manager (refactored)
    ...employeeManager,

    // Team Manager (refactored)
    ...teamManager,

    // QC Manager (refactored)
    ...qcManager,

    // Inventory Manager (refactored)
    ...inventoryManager,

    // Product Manager (refactored)
    ...productManager,

    // Customer Manager (refactored)
    ...customerManager,

    // Order Manager (refactored)
    ...orderManager
}
