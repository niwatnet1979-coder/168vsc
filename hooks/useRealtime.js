import { useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Custom hook for subscribing to Supabase real-time changes
 * @param {string} table - Table name to subscribe to
 * @param {function} callback - Callback function triggered on change
 * @param {string} filter - Optional filter string (e.g. 'id=eq.123')
 */
export const useRealtime = (table, callback, filter = null) => {
    useEffect(() => {
        // Create channel
        const channelName = filter ? `public:${table}:${filter}` : `public:${table}`
        const channel = supabase
            .channel(channelName)
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: table,
                    filter: filter
                },
                (payload) => {
                    callback(payload)
                }
            )
            .subscribe()

        // Cleanup
        return () => {
            supabase.removeChannel(channel)
        }
    }, [table, filter]) // Re-subscribe if table or filter changes
}
