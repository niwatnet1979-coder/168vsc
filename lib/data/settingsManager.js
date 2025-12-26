/**
 * Settings Manager - System Settings & Options
 * Handles shop settings, configuration, and dynamic options
 */

import { supabase } from '../supabaseClient'
import { _withRetry } from './helpers'

/**
 * Get Settings (Shop Info + System Options)
 */
export const getSettings = async () => {
    if (!supabase) return null
    try {
        const [settingsResult, optionsResult] = await Promise.all([
            _withRetry('getSettings', () =>
                supabase.from('settings').select('*').eq('id', 'default').single()
            ),
            _withRetry('getSystemOptions', () =>
                supabase.from('system_options_lists').select('*').eq('is_active', true).order('sort_order')
            )
        ])

        if (settingsResult.error) throw settingsResult.error

        const data = settingsResult.data
        const optionsData = optionsResult.data || []

        // Transform normalized list data back to object with arrays
        // Priority: JSON column (system_options) > Legacy Table (system_options_lists)
        const jsonOptions = data.system_options || {}

        const systemOptions = {
            ...jsonOptions,
            shopLat: data.shop_lat,
            shopLon: data.shop_lon,
        }

        // Merge legacy data (Table is now the correct Source of Truth for lists since we save there)
        const tableOptions = {}
        optionsData.forEach(item => {
            if (!tableOptions[item.category]) {
                tableOptions[item.category] = []
            }
            tableOptions[item.category].push(item.value)
        })

        // Merge table options into systemOptions (Overwriting JSON if both exist, as Table is active Storage)
        Object.keys(tableOptions).forEach(key => {
            systemOptions[key] = tableOptions[key]
        })

        return {
            shopName: data.shop_name,
            shopAddress: data.shop_address,
            shopPhone: data.shop_phone,
            shopEmail: data.shop_email,
            shopTaxId: data.shop_tax_id,
            vatRegistered: data.vat_registered,
            vatRate: data.vat_rate,
            systemOptions: systemOptions, // Populated from table + JSON
            promptpayQr: data.promptpay_qr,
            // Quotation Settings
            quotationDefaultTerms: data.quotation_default_terms,
            quotationWarrantyPolicy: data.quotation_warranty_policy
        }
    } catch (error) {
        console.error('Error fetching settings (SettingsManager):', error)
        return null
    }
}

/**
 * Save Settings
 */
export const saveSettings = async (settings) => {
    if (!supabase) return false
    try {
        // 1. Update basic settings + Lat/Lon (Primitive Fields)
        // Note: We do NOT save system_options JSON here as it may not exist or cause issues.
        // We save lists to the dedicated table below.
        const payload = {
            shop_name: settings.shopName,
            shop_address: settings.shopAddress,
            shop_phone: settings.shopPhone,
            shop_email: settings.shopEmail,
            shop_tax_id: settings.shopTaxId,
            vat_registered: settings.vatRegistered,
            vat_rate: settings.vatRate,
            promptpay_qr: settings.promptpayQr,
            shop_lat: settings.systemOptions?.shopLat ? parseFloat(settings.systemOptions.shopLat) : null,
            shop_lon: settings.systemOptions?.shopLon ? parseFloat(settings.systemOptions.shopLon) : null,
            quotation_default_terms: settings.quotationDefaultTerms,
            quotation_warranty_policy: settings.quotationWarrantyPolicy,
            updated_at: new Date().toISOString()
        }

        const { error: settingsError } = await supabase
            .from('settings')
            .upsert({ id: 'default', ...payload }) // Ensure ID is default

        if (settingsError) throw settingsError

        // 2. Update System Options Lists (Legacy Table but Reliable)
        if (settings.systemOptions) {
            // Filter only arrays (lists)
            const listKeys = Object.keys(settings.systemOptions).filter(k => Array.isArray(settings.systemOptions[k]))

            for (const key of listKeys) {
                const values = settings.systemOptions[key]

                // Delete existing for this category
                const { error: deleteError } = await supabase
                    .from('system_options_lists')
                    .delete()
                    .eq('category', key)

                if (deleteError) {
                    console.warn(`Error deleting options for ${key}:`, deleteError)
                    // Continue anyway to try insert
                }

                if (values.length > 0) {
                    const insertPayload = values.map((val, idx) => ({
                        category: key,
                        value: val,
                        label: val,
                        sort_order: idx,
                        is_active: true
                    }))

                    const { error: insertError } = await supabase
                        .from('system_options_lists')
                        .insert(insertPayload)

                    if (insertError) {
                        console.error(`Error inserting options for ${key}:`, insertError)
                        // Don't throw, partial success is better than none
                    }
                }
            }
        }

        // 3. Try access JSON column if it exists (Optional/Future-proof)
        // We skip this for now to avoid the "Column not found" error that likely caused the failure.

        return true
    } catch (error) {
        console.error('Error saving settings:', error)
        return false
    }
}
