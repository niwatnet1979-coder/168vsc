/**
 * Custom hook for job-related derived state
 * Provides flatJobs and currentJobInfo calculations
 */

import { useMemo } from 'react'

/**
 * Hook to calculate flat jobs list and current job info
 * @param {Array} items - Order items array
 * @param {number} selectedItemIndex - Currently selected item index
 * @param {number} selectedJobIndex - Currently selected job index
 * @returns {Object} { flatJobs, currentJobInfo }
 */
export function useJobState(items, selectedItemIndex, selectedJobIndex) {
    // Flatten all jobs from all items into a single array
    const flatJobs = useMemo(() => {
        const allJobs = []
        items.forEach((item, itemIdx) => {
            if (item.jobs && Array.isArray(item.jobs)) {
                item.jobs.forEach((job, jobIdx) => {
                    allJobs.push({
                        ...job,
                        itemIndex: itemIdx,
                        jobIndex: jobIdx,
                        productName: item.name || item.description || 'Unnamed Product'
                    })
                })
            }
        })
        return allJobs
    }, [items])

    // Get current job info based on selected indices
    const currentJobInfo = useMemo(() => {
        if (selectedItemIndex === null || selectedJobIndex === null) {
            return null
        }

        const item = items[selectedItemIndex]
        if (!item || !item.jobs || !Array.isArray(item.jobs)) {
            return null
        }

        const job = item.jobs[selectedJobIndex]
        if (!job) {
            return null
        }

        return {
            ...job,
            itemIndex: selectedItemIndex,
            jobIndex: selectedJobIndex,
            productName: item.name || item.description || 'Unnamed Product'
        }
    }, [items, selectedItemIndex, selectedJobIndex])

    return {
        flatJobs,
        currentJobInfo
    }
}
