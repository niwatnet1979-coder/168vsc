/**
 * Job Handler Utilities for Order Component
 * Provides functions for job-related operations
 */

/**
 * Creates job handler functions
 * @param {Object} currentJobInfo - Current job information
 * @param {Function} handlersJobInfoUpdate - Job info update handler from createOrderHandlers
 * @param {Array} items - Order items array
 * @param {Function} setItems - Set items function
 * @returns {Object} Job handler functions
 */
export function createJobHandlers(
    currentJobInfo,
    handlersJobInfoUpdate,
    items,
    setItems
) {
    return {
        updateJobInfo: (updates) => handlersJobInfoUpdate(updates),

        shareJobInfo: () => {
            if (!currentJobInfo) return

            if (confirm('คุณต้องการใช้ข้อมูลงานนี้กับสินค้าทุกรายการในออเดอร์ทางใช่หรือไม่?')) {
                // Prepare shared data object
                const sharedData = {
                    jobType: currentJobInfo.jobType,
                    appointmentDate: currentJobInfo.appointmentDate,
                    completionDate: currentJobInfo.completionDate,
                    installLocationName: currentJobInfo.installLocationName,
                    installAddress: currentJobInfo.installAddress,
                    googleMapLink: currentJobInfo.googleMapLink,
                    distance: currentJobInfo.distance,
                    team: currentJobInfo.team,
                    inspector: currentJobInfo.inspector,
                    note: currentJobInfo.note
                }

                setItems(prev => prev.map(item => {
                    // Update ALL jobs in the jobs array (not just jobs[0])
                    let newJobs = [...(item.jobs || [])]

                    if (newJobs.length > 0) {
                        // Update every job in the array
                        newJobs = newJobs.map(job => ({
                            ...job,
                            ...sharedData
                        }))
                    } else {
                        // If no jobs exist, create one with shared data
                        newJobs = [{
                            jobType: 'installation',
                            ...sharedData
                        }]
                    }

                    return {
                        ...item,
                        jobs: newJobs
                    }
                }))
            }
        }
    }
}
