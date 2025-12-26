/**
 * Team Manager - Team and Service Fee Operations
 * Handles team CRUD and service fee batch management
 */

import { supabase } from '../supabaseClient'

/**
 * Get all teams
 */
export const getTeams = async () => {
    if (!supabase) return []
    try {
        const { data, error } = await supabase
            .from('teams')
            .select('*')
            .order('name')
        if (error) throw error
        return data
    } catch (error) {
        console.error('Error fetching teams:', error)
        return []
    }
}

/**
 * Get available teams (active teams only)
 * Backward compatibility function
 * Returns array of team NAMES (strings), not objects
 */
export const getAvailableTeams = async () => {
    if (!supabase) return []
    try {
        const { data, error } = await supabase
            .from('teams')
            .select('name, team_type')
            .in('team_type', ['ช่าง', 'QC', 'Mechanic']) // Support both Thai and potential English keys
            .eq('status', 'active')
            .order('name')

        if (error) throw error

        // Return array of team NAMES only (strings)
        return (data || []).map(t => t.name)
    } catch (error) {
        console.error('Error fetching available teams:', error)
        return []
    }
}

/**
 * Find existing team or create new one
 */
export const findOrCreateTeam = async (name) => {
    if (!supabase || !name) return null
    try {
        const normalizedName = String(name).trim()
        if (!normalizedName) return null

        // Try to find existing
        const { data: existing, error: findError } = await supabase
            .from('teams')
            .select('*')
            .or(`name.eq.${normalizedName},name.eq.${normalizedName.toLowerCase()}`)
            .maybeSingle()

        if (existing) return existing

        // Create if not found
        console.log('[TeamManager] Auto-creating team:', normalizedName)
        const { data: newTeam, error: createError } = await supabase
            .from('teams')
            .insert({ name: normalizedName, status: 'active' })
            .select()
            .single()

        if (createError) throw createError
        return newTeam
    } catch (error) {
        console.error('Error finding/creating team:', error)
        return null
    }
}

/**
 * Save team (create or update)
 */
export const saveTeam = async (teamData) => {
    try {
        const payload = {
            name: teamData.name,
            payment_qr_url: teamData.payment_qr_url,
            team_type: teamData.teamType || 'General',
            status: teamData.status || 'active',
            updated_at: new Date().toISOString()
        }
        if (teamData.id) payload.id = teamData.id

        const { data, error } = await supabase
            .from('teams')
            .upsert(payload)
            .select()
            .single()

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Error saving team:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Get team service fees (with calculations)
 */
export const getTeamServiceFees = async (teamId = null) => {
    if (!supabase) return []
    try {
        let query = supabase
            .from('team_service_fees')
            .select(`
                *,
                team:teams(name),
                adjustments:team_service_fee_adjustments(*),
                payments:team_service_fee_payments(*),
                jobs:team_service_fee_jobs(job_id)
            `)
            .order('created_at', { ascending: false })

        if (teamId) {
            query = query.eq('team_id', teamId)
        }

        const { data, error } = await query
        if (error) throw error

        // Calculate aggregated fields for UI
        return data.map(batch => {
            const labor = Number(batch.labor_cost) || 0
            const material = Number(batch.material_cost) || 0
            const travel = Number(batch.travel_cost) || 0
            const adjustmentsTotal = (batch.adjustments || []).reduce((sum, adj) => sum + (Number(adj.amount) || 0), 0)

            const base = labor + material + travel
            const deduct = base * ((Number(batch.deduct_percent) || 3) / 100)
            const totalDue = (base - deduct) + adjustmentsTotal

            const totalPaid = (batch.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
            const remaining = totalDue - totalPaid

            return {
                ...batch,
                totalBeforeDeduct: base,
                deductAmount: deduct,
                adjustmentsTotal,
                totalDue,
                totalPaid,
                remaining,
                jobs: (batch.jobs || []).map(j => ({ id: j.job_id }))
            }
        })
    } catch (error) {
        console.error('Error fetching service fees:', error)
        return []
    }
}

/**
 * Get single service fee by ID
 */
export const getTeamServiceFeeById = async (id) => {
    if (!supabase) return null
    try {
        const { data, error } = await supabase
            .from('team_service_fees')
            .select(`
                *,
                team:teams(*),
                adjustments:team_service_fee_adjustments(*),
                payments:team_service_fee_payments(*),
                jobs:team_service_fee_jobs(job_id, created_at)
            `)
            .eq('id', id)
            .single()

        if (error) throw error
        if (!data) return null

        // Calculate totals
        const labor = Number(data.labor_cost) || 0
        const material = Number(data.material_cost) || 0
        const travel = Number(data.travel_cost) || 0
        const adjustmentsTotal = (data.adjustments || []).reduce((sum, adj) => sum + (Number(adj.amount) || 0), 0)

        const base = labor + material + travel
        const deduct = base * ((Number(data.deduct_percent) || 3) / 100)
        const totalDue = (base - deduct) + adjustmentsTotal

        const totalPaid = (data.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
        const remaining = totalDue - totalPaid

        return {
            ...data,
            totalBeforeDeduct: base,
            deductAmount: deduct,
            adjustmentsTotal,
            totalDue,
            totalPaid,
            remaining,
            jobs: (data.jobs || []).map(j => ({ id: j.job_id }))
        }
    } catch (error) {
        console.error('Error fetching service fee by ID:', error)
        return null
    }
}

/**
 * Save service fee batch
 */
export const saveTeamServiceFee = async (data) => {
    try {
        const payload = {
            team_id: data.team_id,
            labor_cost: data.labor_cost,
            material_cost: data.material_cost,
            travel_cost: data.travel_cost,
            deduct_percent: data.deduct_percent,
            note: data.note,
            status: data.status || 'active',
            updated_at: new Date().toISOString()
        }
        if (data.id) payload.id = data.id

        const { data: savedBatch, error } = await supabase
            .from('team_service_fees')
            .upsert(payload)
            .select()
            .single()

        if (error) throw error
        return { success: true, data: savedBatch }
    } catch (error) {
        console.error('Error saving service fee batch:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Add service fee adjustment
 */
export const addServiceFeeAdjustment = async (adjustmentData) => {
    try {
        const { data, error } = await supabase
            .from('team_service_fee_adjustments')
            .insert(adjustmentData)
            .select()
        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Delete service fee adjustment
 */
export const deleteServiceFeeAdjustment = async (id) => {
    try {
        const { error } = await supabase
            .from('team_service_fee_adjustments')
            .delete()
            .eq('id', id)
        if (error) throw error
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Link jobs to service fee
 */
export const linkServiceFeeJobs = async (serviceFeeId, jobIds = []) => {
    try {
        if (!jobIds.length) return { success: true }

        // Remove jobs from any existing service fees
        const { error: deleteError } = await supabase
            .from('team_service_fee_jobs')
            .delete()
            .in('job_id', jobIds)

        if (deleteError) throw deleteError

        // Insert new links
        const payload = jobIds.map(jid => ({
            service_fee_id: serviceFeeId,
            job_id: jid
        }))

        const { error } = await supabase
            .from('team_service_fee_jobs')
            .upsert(payload, { onConflict: 'service_fee_id, job_id', ignoreDuplicates: true })

        if (error) throw error
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Unlink job from service fee
 */
export const unlinkServiceFeeJob = async (jobId) => {
    try {
        const { error } = await supabase
            .from('team_service_fee_jobs')
            .delete()
            .eq('job_id', jobId)

        if (error) throw error
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Add service fee payment
 */
export const addServiceFeePayment = async (paymentData) => {
    try {
        const { data, error } = await supabase
            .from('team_service_fee_payments')
            .insert({
                service_fee_id: paymentData.service_fee_id,
                amount: paymentData.amount,
                payment_method: paymentData.payment_method,
                slip_url: paymentData.slip_url,
                note: paymentData.note,
                paid_at: paymentData.paid_at || new Date().toISOString()
            })
            .select()
        if (error) throw error
        return { success: true, data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Get team outstanding balance
 */
export const getTeamOutstanding = async (teamId) => {
    if (!teamId) return 0
    try {
        const batches = await getTeamServiceFees(teamId)
        const totalOutstanding = batches.reduce((sum, b) => sum + (b.remaining || 0), 0)
        return totalOutstanding
    } catch (error) {
        console.error('Error calculating team outstanding:', error)
        return 0
    }
}

/**
 * Delete service fee batch (and all related data)
 */
export const deleteTeamServiceFee = async (batchId) => {
    try {
        if (!batchId) throw new Error('Missing batch ID')

        // 1. Delete Adjustments
        const { error: adjError } = await supabase
            .from('team_service_fee_adjustments')
            .delete()
            .eq('service_fee_id', batchId)
        if (adjError) throw adjError

        // 2. Delete Payments
        const { error: payError } = await supabase
            .from('team_service_fee_payments')
            .delete()
            .eq('service_fee_id', batchId)
        if (payError) throw payError

        // 3. Delete Job Links
        const { error: linkError } = await supabase
            .from('team_service_fee_jobs')
            .delete()
            .eq('service_fee_id', batchId)
        if (linkError) throw linkError

        // 4. Delete Batch
        const { error: batchError } = await supabase
            .from('team_service_fees')
            .delete()
            .eq('id', batchId)
        if (batchError) throw batchError

        return { success: true }
    } catch (error) {
        console.error('Error deleting service fee batch:', error)
        return { success: false, error: error.message }
    }
}
