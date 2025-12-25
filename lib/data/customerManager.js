/**
 * Customer Manager - Customer CRUD Operations
 * Handles customers, contacts, addresses, and tax invoices
 */

import { supabase } from '../supabaseClient'

/**
 * Get all customers with related data
 */
export const getCustomers = async () => {
    if (!supabase) return []
    try {
        const { data, error } = await supabase
            .from('customers')
            .select(`
                *,
                contacts:customer_contacts(*),
                addresses:customer_addresses(*),
                taxInvoices:customer_tax_invoices(*)
            `)
            .order('name')

        if (error) throw error

        return data.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            email: c.email,
            lineId: c.line_id,
            line: c.line_id,
            facebook: c.facebook,
            instagram: c.instagram,
            mediaSource: c.media_source,
            mediaSourceOther: c.media_source_other,
            address: c.address,
            contacts: (c.contacts || []).map(contact => ({
                id: contact.id,
                name: contact.name,
                phone: contact.phone,
                lineId: contact.line_id,
                email: contact.email,
                position: contact.position,
                note: contact.note
            })),
            addresses: (c.addresses || []).map(addr => ({
                id: addr.id,
                label: addr.label,
                addrNumber: addr.addr_number || addr.house_number,
                addrMoo: addr.addr_moo || addr.village_no,
                addrVillage: addr.addr_village || addr.building,
                addrSoi: addr.addr_soi || addr.soi,
                addrRoad: addr.addr_road || addr.road,
                addrTambon: addr.addr_tambon || addr.subdistrict,
                addrAmphoe: addr.addr_amphoe || addr.district,
                addrProvince: addr.addr_province || addr.province,
                province: addr.addr_province || addr.province,
                zipcode: addr.zipcode || addr.postcode,
                googleMapsLink: addr.google_maps_link || addr.google_map_link,
                address: addr.address
            })),
            taxInvoices: (c.taxInvoices || []).map(tax => ({
                id: tax.id,
                companyName: tax.company_name,
                taxId: tax.tax_id,
                address: tax.address,
                branch: tax.branch_number,
                branchNumber: tax.branch_number,
                branchName: tax.branch_name,
                addrNumber: tax.house_number,
                addrMoo: tax.village_no,
                addrVillage: tax.building,
                addrSoi: tax.soi,
                addrRoad: tax.road,
                addrTambon: tax.sub_district,
                addrAmphoe: tax.district,
                addrProvince: tax.province,
                province: tax.province,
                addrZipcode: tax.postal_code
            }))
        }))
    } catch (error) {
        console.error('Error fetching customers:', error)
        return []
    }
}

/**
 * Get customer by ID with related data
 */
export const getCustomerById = async (id) => {
    if (!supabase) return null
    try {
        const { data, error } = await supabase
            .from('customers')
            .select(`
                *,
                contacts:customer_contacts(*),
                addresses:customer_addresses(*),
                taxInvoices:customer_tax_invoices(*)
            `)
            .eq('id', id)
            .single()

        if (error) throw error
        if (!data) return null

        return {
            id: data.id,
            name: data.name,
            phone: data.phone,
            email: data.email,
            lineId: data.line_id,
            line: data.line_id,
            facebook: data.facebook,
            instagram: data.instagram,
            mediaSource: data.media_source,
            mediaSourceOther: data.media_source_other,
            address: data.address,
            contacts: (data.contacts || [])
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                .map(contact => ({
                    id: contact.id,
                    name: contact.name,
                    phone: contact.phone,
                    lineId: contact.line_id,
                    email: contact.email,
                    position: contact.position,
                    note: contact.note
                })),
            addresses: (data.addresses || [])
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                .map(addr => ({
                    id: addr.id,
                    label: addr.label,
                    addrNumber: addr.addr_number || addr.house_number,
                    addrMoo: addr.addr_moo || addr.village_no,
                    addrVillage: addr.addr_village || addr.building,
                    addrSoi: addr.addr_soi || addr.soi,
                    addrRoad: addr.addr_road || addr.road,
                    addrTambon: addr.addr_tambon || addr.subdistrict,
                    addrAmphoe: addr.addr_amphoe || addr.district,
                    addrProvince: addr.addr_province || addr.province,
                    province: addr.addr_province || addr.province,
                    zipcode: addr.zipcode || addr.postcode,
                    googleMapsLink: addr.google_maps_link || addr.google_map_link,
                    address: addr.address
                })),
            taxInvoices: (data.taxInvoices || [])
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                .map(tax => ({
                    id: tax.id,
                    companyName: tax.company_name,
                    taxId: tax.tax_id,
                    address: tax.address,
                    branch: tax.branch_number,
                    branchNumber: tax.branch_number,
                    branchName: tax.branch_name,
                    addrNumber: tax.house_number,
                    addrMoo: tax.village_no,
                    addrVillage: tax.building,
                    addrSoi: tax.soi,
                    addrRoad: tax.road,
                    addrTambon: tax.sub_district,
                    addrAmphoe: tax.district,
                    addrProvince: tax.province,
                    addrZipcode: tax.postal_code
                }))
        }
    } catch (error) {
        console.error('Error fetching customer by ID:', error)
        return null
    }
}

/**
 * Save customer (create or update) with related data
 */
export const saveCustomer = async (customerData) => {
    if (!supabase) return { success: false, error: 'No supabase client' }

    try {
        // Helper to check UUID
        const isValidUUID = (id) => {
            if (!id) return false
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            return uuidRegex.test(id)
        }

        // Helper to prepare payload
        const preparePayload = (item, extraFields = {}) => {
            const payload = { ...extraFields }
            Object.keys(item).forEach(key => {
                if (item[key] !== undefined && item[key] !== null && item[key] !== '') {
                    payload[key] = item[key]
                }
            })
            return payload
        }

        // 1. Save main customer
        const customerPayload = {
            name: customerData.name,
            phone: customerData.phone,
            email: customerData.email,
            line_id: customerData.lineId || customerData.line,
            facebook: customerData.facebook,
            instagram: customerData.instagram,
            media_source: customerData.mediaSource,
            media_source_other: customerData.mediaSourceOther,
            address: customerData.address
        }

        if (customerData.id && isValidUUID(customerData.id)) {
            customerPayload.id = customerData.id
        }

        const { data: savedCustomer, error: customerError } = await supabase
            .from('customers')
            .upsert(customerPayload)
            .select()
            .single()

        if (customerError) throw customerError

        const customerId = savedCustomer.id

        // 2. Save contacts
        if (customerData.contacts && Array.isArray(customerData.contacts)) {
            // Filter out empty contacts
            const validContacts = customerData.contacts.filter(contact =>
                contact.name || contact.phone || contact.email
            )

            for (const contact of validContacts) {
                const contactPayload = preparePayload(contact, {
                    customer_id: customerId,
                    name: contact.name,
                    phone: contact.phone,
                    line_id: contact.lineId,
                    email: contact.email,
                    position: contact.position,
                    note: contact.note
                })

                if (contact.id && isValidUUID(contact.id)) {
                    contactPayload.id = contact.id
                }

                const { error: contactError } = await supabase.from('customer_contacts').upsert(contactPayload)
                if (contactError) {
                    console.error('Error saving contact:', contactError)
                }
            }
        }

        // 3. Save addresses
        if (customerData.addresses && Array.isArray(customerData.addresses)) {
            // Filter out empty addresses
            const validAddresses = customerData.addresses.filter(addr =>
                addr.label || addr.address || addr.googleMapsLink ||
                addr.addrNumber || addr.addrTambon || addr.addrAmphoe || addr.province
            )

            for (const addr of validAddresses) {
                const addrPayload = preparePayload(addr, {
                    customer_id: customerId,
                    label: addr.label,
                    addr_number: addr.addrNumber,
                    addr_moo: addr.addrMoo,
                    addr_village: addr.addrVillage,
                    addr_soi: addr.addrSoi,
                    addr_road: addr.addrRoad,
                    addr_tambon: addr.addrTambon,
                    addr_amphoe: addr.addrAmphoe,
                    addr_province: addr.addrProvince || addr.province,
                    zipcode: addr.zipcode,
                    google_maps_link: addr.googleMapsLink,
                    address: addr.address
                })

                if (addr.id && isValidUUID(addr.id)) {
                    addrPayload.id = addr.id
                }

                const { error: addrError } = await supabase.from('customer_addresses').upsert(addrPayload)
                if (addrError) {
                    console.error('Error saving address:', addrError)
                }
            }
        }

        // 4. Save tax invoices
        if (customerData.taxInvoices && Array.isArray(customerData.taxInvoices)) {
            // Filter out empty tax invoices
            const validTaxInvoices = customerData.taxInvoices.filter(tax =>
                tax.companyName || tax.taxId || tax.address
            )

            for (const tax of validTaxInvoices) {
                const taxPayload = preparePayload(tax, {
                    customer_id: customerId,
                    company_name: tax.companyName,
                    tax_id: tax.taxId,
                    branch_number: tax.branchNumber || tax.branch,
                    branch_name: tax.branchName,
                    house_number: tax.addrNumber,
                    village_no: tax.addrMoo,
                    building: tax.addrVillage,
                    soi: tax.addrSoi,
                    road: tax.addrRoad,
                    sub_district: tax.addrTambon,
                    district: tax.addrAmphoe,
                    province: tax.addrProvince || tax.province,
                    postal_code: tax.addrZipcode,
                    address: tax.address
                })

                // Only set ID if it's a valid UUID (existing record)
                if (tax.id && isValidUUID(tax.id)) {
                    taxPayload.id = tax.id
                }
                // For new records (Date.now() IDs), let Supabase generate UUID

                const { error: taxError } = await supabase.from('customer_tax_invoices').upsert(taxPayload)
                if (taxError) {
                    console.error('Error saving tax invoice:', taxError)
                }
            }
        }

        return { success: true, data: savedCustomer }
    } catch (error) {
        console.error('Error saving customer:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Delete customer
 */
export const deleteCustomer = async (id) => {
    if (!supabase) return false
    try {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    } catch (error) {
        console.error('Error deleting customer:', error)
        return false
    }
}

/**
 * Update customer address
 */
export const updateCustomerAddress = async (id, addressData) => {
    if (!supabase) return null
    try {
        console.log('Updating customer address:', id, addressData)
        const { data, error } = await supabase
            .from('customer_addresses')
            .update(addressData)
            .eq('id', id)
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error updating customer address:', error)
        return null
    }
}
