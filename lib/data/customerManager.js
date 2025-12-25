/**
 * Customer Manager
 * Handles all customer-related database operations
 */

import { supabase } from '../supabaseClient'

/**
 * Get all customers with their related data
 */
export const getCustomers = async () => {
    if (!supabase) return []

    try {
        console.log('Fetching customers...')

        const { data, error } = await supabase
            .from('customers')
            .select(`
                *,
                taxInvoices:customer_tax_invoices(*),
                addresses:customer_addresses(*),
                contacts:customer_contacts(*)
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching customers:', error)
            throw error
        }

        console.log('Customers fetched:', data?.length || 0)

        // Map DB snake_case to UI camelCase
        return (data || []).map(c => ({
            ...c,
            lineId: c.line_id,
            mediaSource: c.media_source,
            taxInvoices: (c.taxInvoices || []).map(tax => ({
                ...tax,
                companyName: tax.company_name,
                taxId: tax.tax_id,
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
            })),
            addresses: (c.addresses || []).map(addr => ({
                ...addr,
                googleMapsLink: addr.google_maps_link,
                addrNumber: addr.addr_number,
                addrMoo: addr.addr_moo,
                addrVillage: addr.addr_village,
                addrSoi: addr.addr_soi,
                addrRoad: addr.addr_road,
                addrTambon: addr.addr_tambon,
                addrAmphoe: addr.addr_amphoe,
                province: addr.addr_province
            })),
            contacts: c.contacts || []
        }))
    } catch (error) {
        console.error('Error in getCustomers:', error)
        return []
    }
}

/**
 * Get a single customer by ID with all related data
 */
export const getCustomerById = async (id) => {
    if (!supabase || !id) return null

    try {
        const { data, error } = await supabase
            .from('customers')
            .select(`
                *,
                taxInvoices:customer_tax_invoices(*),
                addresses:customer_addresses(*),
                contacts:customer_contacts(*)
            `)
            .eq('id', id)
            .single()

        if (error) throw error
        if (!data) return null

        // Map DB snake_case to UI camelCase
        return {
            ...data,
            lineId: data.line_id,
            mediaSource: data.media_source,
            taxInvoices: (data.taxInvoices || []).map(tax => ({
                ...tax,
                companyName: tax.company_name,
                taxId: tax.tax_id,
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
            })),
            addresses: (data.addresses || []).map(addr => ({
                ...addr,
                googleMapsLink: addr.google_maps_link,
                addrNumber: addr.addr_number,
                addrMoo: addr.addr_moo,
                addrVillage: addr.addr_village,
                addrSoi: addr.addr_soi,
                addrRoad: addr.addr_road,
                addrTambon: addr.addr_tambon,
                addrAmphoe: addr.addr_amphoe,
                province: addr.addr_province
            })),
            contacts: data.contacts || []
        }
    } catch (error) {
        console.error('Error getting customer by ID:', error)
        return null
    }
}

/**
 * Save customer (create or update) with all related data
 * Returns the saved customer object or null on error
 */
export const saveCustomer = async (customerData) => {
    if (!supabase) return null

    try {
        console.log('💾 saveCustomer called with:', {
            name: customerData.name,
            phone: customerData.phone,
            hasId: !!customerData.id,
            taxInvoicesCount: customerData.taxInvoices?.length || 0,
            addressesCount: customerData.addresses?.length || 0,
            contactsCount: customerData.contacts?.length || 0
        })

        let customerId = customerData.id

        const dbPayload = {
            ...(customerId ? { id: customerId } : {}),
            name: customerData.name,
            phone: customerData.phone,
            email: customerData.email,
            line_id: customerData.line || customerData.lineId,
            facebook: customerData.facebook,
            instagram: customerData.instagram,
            media_source: customerData.mediaSource
        }

        // 1. Upsert customer
        const { data, error } = await supabase
            .from('customers')
            .upsert(dbPayload)
            .select()
            .single()

        if (error) {
            console.error('❌ Error saving customer:', error)
            throw error
        }

        const c = data
        if (!c) return null

        customerId = c.id
        console.log('✅ Customer saved, ID:', customerId)

        // Helper to check UUID
        const isValidUUID = (id) => {
            if (!id) return false
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            return uuidRegex.test(id)
        }

        // Helper to prepare payload
        const preparePayload = (item, extraFields = {}) => {
            const payload = { ...extraFields }
            if (item.id && isValidUUID(item.id)) {
                payload.id = item.id
            }
            return payload
        }

        // 2. Save contacts
        if (Array.isArray(customerData.contacts) && customerData.contacts.length > 0) {
            const validContacts = customerData.contacts.filter(c => c.name && c.name.trim() !== '')
            console.log(`📞 Saving ${validContacts.length} valid contacts (filtered from ${customerData.contacts.length})`)

            if (validContacts.length > 0) {
                const contactsPayload = validContacts.map(contact => preparePayload(contact, {
                    customer_id: customerId,
                    name: contact.name,
                    phone: contact.phone,
                    line_id: contact.lineId,
                    email: contact.email,
                    position: contact.position,
                    note: contact.note
                }))

                const newContacts = contactsPayload.filter(c => !c.id)
                const existingContacts = contactsPayload.filter(c => c.id)

                let insertedContacts = []
                if (newContacts.length > 0) {
                    const { data: insData, error: insertError } = await supabase.from('customer_contacts').insert(newContacts).select()
                    if (insertError) {
                        console.error('Error inserting contacts:', insertError)
                        throw insertError
                    }
                    insertedContacts = insData
                }
                if (existingContacts.length > 0) {
                    const { error: upsertError } = await supabase.from('customer_contacts').upsert(existingContacts)
                    if (upsertError) {
                        console.error('Error upserting contacts:', upsertError)
                        throw upsertError
                    }
                }

                // Delete removed contacts
                const { data: currentContacts } = await supabase
                    .from('customer_contacts')
                    .select('id')
                    .eq('customer_id', customerId)

                if (currentContacts) {
                    const existingIds = existingContacts.map(c => c.id)
                    const newIds = insertedContacts ? insertedContacts.map(c => c.id) : []
                    const validIds = [...existingIds, ...newIds]

                    const idsToDelete = currentContacts
                        .map(c => c.id)
                        .filter(id => !validIds.includes(id))

                    if (idsToDelete.length > 0) {
                        const { error: deleteError } = await supabase.from('customer_contacts').delete().in('id', idsToDelete)
                        if (deleteError) throw deleteError
                    }
                }
            } else {
                const { error: deleteError } = await supabase.from('customer_contacts').delete().eq('customer_id', customerId)
                if (deleteError) throw deleteError
            }
        }

        // 3. Save addresses
        if (Array.isArray(customerData.addresses) && customerData.addresses.length > 0) {
            const validAddresses = customerData.addresses.filter(addr => {
                if (isValidUUID(addr.id)) return true
                return addr.label || addr.addrNumber || addr.addrProvince || addr.address
            })
            console.log(`📍 Saving ${validAddresses.length} valid addresses (filtered from ${customerData.addresses.length})`)

            if (validAddresses.length > 0) {
                const addressesPayload = validAddresses.map(addr => {
                    // Construct full address from detailed fields
                    const addressParts = [
                        addr.addrNumber && `เลขที่ ${addr.addrNumber}`,
                        addr.addrMoo && `หมู่ ${addr.addrMoo}`,
                        addr.addrVillage && addr.addrVillage,
                        addr.addrSoi && `ซอย ${addr.addrSoi}`,
                        addr.addrRoad && `ถนน ${addr.addrRoad}`,
                        addr.addrTambon && `ตำบล${addr.addrTambon}`,
                        addr.addrAmphoe && `อำเภอ${addr.addrAmphoe}`,
                        (addr.addrProvince || addr.province) && `จังหวัด${addr.addrProvince || addr.province}`,
                        (addr.addrZipcode || addr.zipcode) && (addr.addrZipcode || addr.zipcode)
                    ].filter(Boolean).join(' ')

                    return preparePayload(addr, {
                        customer_id: customerId,
                        label: addr.label,
                        addr_number: addr.addrNumber,
                        addr_moo: addr.addrMoo,
                        addr_village: addr.addrVillage,
                        addr_soi: addr.addrSoi,
                        addr_road: addr.addrRoad,
                        addr_tambon: addr.addrTambon,
                        addr_amphoe: addr.addrAmphoe,
                        addr_province: addr.province || addr.addrProvince,
                        zipcode: addr.zipcode || addr.addrZipcode,
                        google_maps_link: addr.googleMapsLink,
                        address: addressParts || addr.address || 'ไม่ระบุ'
                    })
                })

                const newAddresses = addressesPayload.filter(a => !a.id)
                const existingAddresses = addressesPayload.filter(a => a.id)

                let insertedAddresses = []
                if (newAddresses.length > 0) {
                    const { data: insData, error: insertError } = await supabase.from('customer_addresses').insert(newAddresses).select()
                    if (insertError) {
                        console.error('Error inserting addresses:', insertError)
                        throw insertError
                    }
                    insertedAddresses = insData
                }
                if (existingAddresses.length > 0) {
                    const { error: upsertError } = await supabase.from('customer_addresses').upsert(existingAddresses)
                    if (upsertError) {
                        console.error('Error upserting addresses:', upsertError)
                        throw upsertError
                    }
                }

                // Delete removed addresses
                const { data: currentAddresses } = await supabase
                    .from('customer_addresses')
                    .select('id')
                    .eq('customer_id', customerId)

                if (currentAddresses) {
                    const existingIds = existingAddresses.map(a => a.id)
                    const newIds = insertedAddresses ? insertedAddresses.map(a => a.id) : []
                    const validIds = [...existingIds, ...newIds]

                    const idsToDelete = currentAddresses
                        .map(a => a.id)
                        .filter(id => !validIds.includes(id))

                    if (idsToDelete.length > 0) {
                        const { error: deleteError } = await supabase.from('customer_addresses').delete().in('id', idsToDelete)
                        if (deleteError) throw deleteError
                    }
                }
            } else {
                const { error: deleteError } = await supabase.from('customer_addresses').delete().eq('customer_id', customerId)
                if (deleteError) throw deleteError
            }
        }

        // 4. Save tax invoices
        if (Array.isArray(customerData.taxInvoices) && customerData.taxInvoices.length > 0) {
            const validTaxInvoices = customerData.taxInvoices.filter(tax => {
                const isUUID = isValidUUID(tax.id)
                const hasData = (tax.companyName && tax.companyName.trim() !== '') || (tax.taxId && tax.taxId.trim() !== '')
                return isUUID || hasData
            })
            console.log(`🧾 Saving ${validTaxInvoices.length} valid tax invoices (filtered from ${customerData.taxInvoices.length})`)

            if (validTaxInvoices.length > 0) {
                const taxInvoicesPayload = validTaxInvoices.map(tax => {
                    const extraFields = {
                        customer_id: customerId,
                        company_name: tax.companyName,
                        tax_id: tax.taxId,
                        branch_number: tax.branchNumber || tax.branch,
                        house_number: tax.addrNumber,
                        village_no: tax.addrMoo,
                        building: tax.addrVillage,
                        soi: tax.addrSoi,
                        road: tax.addrRoad,
                        sub_district: tax.addrTambon,
                        district: tax.addrAmphoe,
                        province: tax.addrProvince,
                        postal_code: tax.addrZipcode
                    }

                    const payload = preparePayload(tax, extraFields)
                    console.log('🧾 Tax invoice payload:', {
                        hasId: !!payload.id,
                        companyName: payload.company_name,
                        taxId: payload.tax_id
                    })
                    return payload
                })

                const newTaxInvoices = taxInvoicesPayload.filter(t => !t.id)
                const existingTaxInvoices = taxInvoicesPayload.filter(t => t.id)

                let insertedTaxInvoices = []
                if (newTaxInvoices.length > 0) {
                    const { data: insertData, error: insertError } = await supabase.from('customer_tax_invoices').insert(newTaxInvoices).select()
                    if (insertError) {
                        console.error('Error inserting tax invoices:', insertError)
                        throw insertError
                    }
                    insertedTaxInvoices = insertData
                }
                if (existingTaxInvoices.length > 0) {
                    const { error: upsertError } = await supabase.from('customer_tax_invoices').upsert(existingTaxInvoices)
                    if (upsertError) {
                        console.error('Error upserting tax invoices:', upsertError)
                        throw upsertError
                    }
                }

                // Delete removed tax invoices
                const { data: currentTaxInvoices } = await supabase
                    .from('customer_tax_invoices')
                    .select('id')
                    .eq('customer_id', customerId)

                if (currentTaxInvoices) {
                    const existingIds = existingTaxInvoices.map(t => t.id)
                    const newIds = insertedTaxInvoices ? insertedTaxInvoices.map(t => t.id) : []
                    const validIds = [...existingIds, ...newIds]

                    const idsToDelete = currentTaxInvoices
                        .map(t => t.id)
                        .filter(id => !validIds.includes(id))

                    if (idsToDelete.length > 0) {
                        await supabase.from('customer_tax_invoices').delete().in('id', idsToDelete)
                    }
                }
            } else {
                await supabase.from('customer_tax_invoices').delete().eq('customer_id', customerId)
            }
        }

        // Return updated object by re-fetching (ensures we get generated IDs/relations)
        return await getCustomerById(customerId)
    } catch (error) {
        console.error('❌ Error saving customer:', error)
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        })
        return null
    }
}

/**
 * Delete a customer
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
