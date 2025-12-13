import { useState, useEffect, useCallback } from 'react'
import { DataManager } from '../lib/dataManager'
import { useRealtime } from './useRealtime'

/**
 * Custom hook to manage Jobs state with real-time updates
 * Centralizes data fetching logic for standardizing across Desktop/Mobile
 */
export const useJobs = () => {
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const loadJobs = useCallback(async () => {
        try {
            // Note: DataManager.getJobs() fetches joined data (Customer, Order)
            const data = await DataManager.getJobs()
            setJobs(data)
            setLoading(false)
        } catch (err) {
            console.error('Error loading jobs:', err)
            setError(err)
            setLoading(false)
        }
    }, [])

    // Initial load
    useEffect(() => {
        loadJobs()

        // Keep legacy local storage sync for now (inter-tab sync)
        const onStorage = () => loadJobs()
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
    }, [loadJobs])

    // Real-time Subscription to 'jobs' table
    useRealtime('jobs', (payload) => {
        console.log('🔄 Real-time job update detected:', payload.eventType)
        loadJobs()
    })

    return { jobs, loading, error, refresh: loadJobs }
}
