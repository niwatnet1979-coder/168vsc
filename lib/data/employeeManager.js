/**
 * Employee Manager - Employee Operations
 * Handles employee CRUD operations
 */

import { supabase } from '../supabaseClient'

/**
 * Helper to restore percentage format
 */
const restorePercent = (val) => {
    if (val === null || val === undefined || val === '') return null
    const num = parseFloat(val)
    if (isNaN(num)) return null
    // If already in decimal (0.03), convert to percentage (3)
    if (num < 1) return num * 100
    return num
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
    if (val === null || val === undefined || val === '') return null
    // Remove % sign if present
    const cleaned = String(val).replace('%', '').trim()
    const num = parseFloat(cleaned)
    if (isNaN(num)) return null
    // Store as decimal (3% -> 0.03)
    return num > 1 ? num / 100 : num
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
            .order('name')

        if (error) throw error

        // Map snake_case to camelCase and restore percentage format
        return data.map(emp => ({
            id: emp.id,
            name: emp.name,
            phone: emp.phone,
            email: emp.email,
            role: emp.role,
            bank: emp.bank,
            accountNumber: emp.account_number,
            idCard: emp.id_card,
            address: emp.address,
            emergencyContact: emp.emergency_contact,
            emergencyPhone: emp.emergency_phone,
            startDate: emp.start_date,
            endDate: emp.end_date,
            status: emp.status,
            notes: emp.notes,
            photoUrl: emp.photo_url,
            contractUrl: emp.contract_url,
            // Percentage fields - restore to percentage format for UI
            salaryPercent: restorePercent(emp.salary_percent),
            materialPercent: restorePercent(emp.material_percent),
            travelPercent: restorePercent(emp.travel_percent),
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
        // Prepare payload (snake_case for DB)
        const payload = {
            name: empData.name,
            phone: sanitize(empData.phone),
            email: sanitize(empData.email),
            role: empData.role,
            bank: sanitize(empData.bank),
            account_number: sanitize(empData.accountNumber),
            id_card: sanitize(empData.idCard),
            address: sanitize(empData.address),
            emergency_contact: sanitize(empData.emergencyContact),
            emergency_phone: sanitize(empData.emergencyPhone),
            start_date: sanitize(empData.startDate),
            end_date: sanitize(empData.endDate),
            status: empData.status || 'active',
            notes: sanitize(empData.notes),
            photo_url: sanitize(empData.photoUrl),
            contract_url: sanitize(empData.contractUrl),
            // Percentage fields - clean and convert to decimal
            salary_percent: cleanPercent(empData.salaryPercent),
            material_percent: cleanPercent(empData.materialPercent),
            travel_percent: cleanPercent(empData.travelPercent),
            updated_at: new Date().toISOString()
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
