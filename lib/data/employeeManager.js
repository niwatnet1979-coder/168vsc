/**
 * Employee Manager - Employee Operations
 * Handles employee CRUD operations
 */

import { supabase } from '../supabaseClient'

/**
 * Helper to restore percentage format
 * Returns string '3' from decimal 0.03
 */
const restorePercent = (val) => {
    if (val === null || val === undefined || val === '') return ''
    const num = parseFloat(val)
    if (isNaN(num)) return ''
    if (num <= 1 && num > 0) return (num * 100).toString()
    return val.toString()
}

/**
 * Helper to sanitize numeric/date fields
 */
const sanitize = (val) => {
    if (val === '' || val === null || val === undefined) return null
    return val
}

/**
 * Helper to clean percentage strings
 */
const cleanPercent = (val) => {
    if (!val) return null
    if (typeof val === 'string') {
        const cleaned = val.replace('%', '').trim()
        return cleaned === '' ? null : cleaned
    }
    return val
}

/**
 * Get all employees
 */
export const getEmployees = async () => {
    if (!supabase) return []
    try {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .order('eid', { ascending: true })

        if (error) throw error

        // Map snake_case to camelCase
        return data.map(emp => ({
            id: emp.id,
            eid: emp.eid,
            nickname: emp.nickname,
            firstname: emp.firstname,
            lastname: emp.lastname,
            fullname: emp.fullname,

            // Team Relation
            teamId: emp.team_id,
            team: emp.team,
            teamType: emp.team_type,

            // Job Details
            job: emp.job_position,
            level: emp.job_level,
            userType: emp.role,

            // Contact
            email: emp.email,
            phone1: emp.phone1,
            phone2: emp.phone2,
            address: emp.address,

            // Dates
            startDate: emp.start_date,
            endDate: emp.end_date,
            birthDay: emp.birth_date,

            // Work & Pay
            workType: emp.work_type,
            payType: emp.pay_type,
            payRate: emp.pay_rate,
            incentiveRate: emp.incentive_rate,

            // Personal & Bank
            citizenId: emp.citizen_id,
            bank: emp.bank_name,
            acNumber: emp.account_number,
            status: emp.status,
            photos: emp.photos || {},

            // Legacy/Technician specific fields
            salaryPercent: emp.salary_percent,
            materialPercent: emp.material_percent,
            travelPercent: emp.travel_percent,

            created_at: emp.created_at,
            updated_at: emp.updated_at
        }))
    } catch (error) {
        console.error('Error fetching employees:', error)
        return []
    }
}

/**
 * Save employee (create or update)
 */
export const saveEmployee = async (empData) => {
    if (!supabase) return { success: false, error: 'No supabase client' }

    try {
        const payload = {
            eid: empData.eid,
            nickname: empData.nickname,
            firstname: empData.firstname,
            lastname: empData.lastname,

            team_id: sanitize(empData.teamId),
            team: empData.team,
            team_type: empData.teamType,

            job_position: empData.job,
            job_level: empData.level,
            role: empData.userType,

            email: sanitize(empData.email),
            phone1: sanitize(empData.phone1),
            phone2: sanitize(empData.phone2),
            address: sanitize(empData.address),

            start_date: sanitize(empData.startDate),
            end_date: sanitize(empData.endDate),

            work_type: empData.workType,
            pay_type: empData.payType,
            pay_rate: sanitize(empData.payRate),
            incentive_rate: cleanPercent(empData.incentiveRate),

            citizen_id: sanitize(empData.citizenId),
            birth_date: sanitize(empData.birthDay),
            bank_name: empData.bank,
            account_number: empData.acNumber,

            status: empData.status || 'current',
            photos: empData.photos,
        }

        if (empData.id) {
            payload.id = empData.id
        }

        const { data, error } = await supabase
            .from('employees')
            .upsert(payload)
            .select()
            .single()

        if (error) throw error

        return { success: true, data }
    } catch (error) {
        console.error('Error saving employee:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Delete employee
 */
export const deleteEmployee = async (id) => {
    if (!supabase) return false
    try {
        const { error } = await supabase
            .from('employees')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error deleting employee:', error)
        return false
    }
}
/**
 * Get active team members for dropdown
 */
export const getActiveEmployees = async () => {
    if (!supabase) return []
    try {
        const { data, error } = await supabase
            .from('employees')
            .select('id, nickname, email, fullname')
            .eq('status', 'current')
            .order('nickname', { ascending: true })

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error fetching active employees:', error)
        return []
    }
}

/**
 * Get employee by Email (for auto-creator)
 */
export const getEmployeeByEmail = async (email) => {
    if (!supabase || !email) return null
    try {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('email', email)
            .single()

        if (error) return null // not found is ok
        return data
    } catch (error) {
        console.error('Error finding employee by email:', error)
        return null
    }
}
