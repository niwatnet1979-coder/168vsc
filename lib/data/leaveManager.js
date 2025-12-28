import { supabase } from '../supabaseClient'

/**
 * Create a new leave request
 * @param {Object} leaveData - { user_id, user_name, user_team, start_date, end_date, reason, ... }
 */
export const createLeaveRequest = async (leaveData) => {
    const { error } = await supabase
        .from('leave_requests')
        .insert([leaveData])
    if (error) throw error
    return true
}

/**
 * Get leave requests, optionally filtered by team
 * @param {string} teamFilter - Team name or 'ทั้งหมด'
 */
export const getLeaveRequests = async (teamFilter) => {
    let query = supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false })

    if (teamFilter && teamFilter !== 'ทั้งหมด') {
        query = query.eq('user_team', teamFilter)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
}

/**
 * Approve a leave request
 * @param {string} id - Leave Request ID
 * @param {string} approverName - Name of the approver (optional)
 */
export const approveLeaveRequest = async (id, approverName) => {
    const { error } = await supabase
        .from('leave_requests')
        .update({
            status: 'approved',
            approved_by: approverName,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
    if (error) throw error
    return true
}

/**
 * Reject a leave request
 * @param {string} id - Leave Request ID
 * @param {string} reason - Rejection reason
 */
export const rejectLeaveRequest = async (id, reason) => {
    const { error } = await supabase
        .from('leave_requests')
        .update({
            status: 'rejected',
            rejection_reason: reason,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
    if (error) throw error
    return true
}
