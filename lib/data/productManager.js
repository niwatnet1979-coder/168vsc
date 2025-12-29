/**
 * Product Manager - Product CRUD Operations
 * Handles products, variants, and product options
 */

import { supabase } from '../supabaseClient'
import { _withRetry, parseCode } from './helpers'

/**
 * Get all products with variants and stock info
 */
export const getProducts = async () => {
    if (!supabase) return []
    try {
        // Fetch Products with variants (Filter out deleted)
        const { data: products, error: prodError } = await supabase
            .from('products')
            .select(`
                *,
                variants:product_variants (
                    id,
                    product_id,
                    color,
                    size,
                    sku,
                    price,
                    image_url,
                    crystal_color,
                    min_stock_level
                )
            `)
            .order('name')

        if (prodError) throw prodError

        // Fetch Live Stock View
        const { data: liveStock, error: viewError } = await supabase
            .from('view_product_stock_live')
            .select('*')

        if (viewError) console.warn("Could not fetch live stock view", viewError)

        // Create stock map
        const stockMap = {}
        if (liveStock) {
            liveStock.forEach(item => {
                stockMap[item.variant_id] = item
            })
        }

        return products.map(p => {
            const variants = (p.variants || []).map(v => {
                const sInfo = stockMap[v.id] || {}
                return {
                    ...v,
                    stock: sInfo.physical_stock ?? v.stock ?? 0,
                    allocated: sInfo.allocated_stock ?? 0,
                    available: sInfo.available_stock ?? (v.stock ?? 0),
                    minStock: v.min_stock_level || 0, // Map for frontend
                    total_sold: 0,
                    total_pending: sInfo.allocated_stock ?? 0,
                    images: v.image_url ? [v.image_url] : [],
                    image: v.image_url,
                    crystal_color: v.crystal_color,
                    crystalColor: v.crystal_color,
                    dimensions: (() => {
                        if (!v.size) return { length: 0, width: 0, height: 0 };
                        const parts = v.size.split('x');
                        return {
                            length: parseInt(parts[0]) || 0,
                            width: parseInt(parts[1]) || 0,
                            height: parseInt(parts[2]) || 0
                        };
                    })()
                }
            })

            // Aggregates
            const totalStock = variants.reduce((acc, v) => acc + (v.stock || 0), 0)
            const totalAllocated = variants.reduce((acc, v) => acc + (v.allocated || 0), 0)
            const totalAvailable = variants.reduce((acc, v) => acc + (v.available || 0), 0)

            return {
                uuid: p.uuid,                   // Explicit UUID for DB operations
                product_code: p.product_code,   // Explicit Product Code for Display
                name: p.name,
                category: p.category,
                subcategory: p.subcategory,
                description: p.description,
                material: p.material,
                stock: totalStock,
                available: totalAvailable,
                allocated: totalAllocated,
                variants: variants,
                price: p.price,
                image_url: p.image_url || ((variants[0] && variants[0].image_url) ? variants[0].image_url : null),
                images: p.image_url ? [p.image_url] : (variants.map(v => v.image_url).filter(Boolean)),
                min_stock_level: p.min_stock_level
            }
        })
    } catch (error) {
        console.error('Error fetching products:', error)
        return []
    }
}

/**
 * Save product (create or update) with variants
 */
export const saveProduct = async (productData) => {
    try {
        if (!supabase) throw new Error('Supabase client not initialized')

        const variants = productData.variants || []

        // Calculate aggregates
        const prices = variants.map(v => parseFloat(v.price) || 0).filter(p => p > 0)
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0
        const allImages = []
        variants.forEach(v => {
            if (v.images && Array.isArray(v.images)) {
                v.images.forEach(img => {
                    if (img && !allImages.includes(img)) allImages.push(img)
                })
            }
        })

        // Prepare product payload
        const dbPayload = {
            name: productData.name || '',
            category: productData.category || '',
            description: productData.description || '',
            material: productData.material || '',
            product_code: productData.product_code || productData.id,
            updated_at: new Date().toISOString()
        }

        if (productData.uuid) dbPayload.uuid = productData.uuid
        if (!dbPayload.product_code) throw new Error('Product code is required')

        // Upsert main product
        const { data, error } = await supabase
            .from('products')
            .upsert(dbPayload, { onConflict: 'product_code' })
            .select()

        if (error) throw error
        const savedProduct = data?.[0]
        if (!savedProduct) throw new Error('Failed to retrieve saved product record')

        // Sync variants
        try {
            if (variants.length > 0) {
                const variantsToUpsert = variants.map(v => {
                    // SKU Generation
                    let sizeStr = ''
                    if (v.dimensions) {
                        const { length: l, width: w, height: h } = v.dimensions
                        if (l || w || h) sizeStr = `D${l || 0}x${w || 0}x${h || 0}`
                    }
                    const cCode = parseCode(v.color)
                    const cryCode = parseCode(v.crystalColor, null)
                    let skuParts = [savedProduct.product_code]
                    if (sizeStr) skuParts.push(sizeStr)
                    skuParts.push(cCode)
                    if (cryCode) skuParts.push(cryCode)
                    const generatedSku = skuParts.join('-')

                    return {
                        product_id: savedProduct.uuid,
                        color: v.color,
                        size: sizeStr.replace(/^D/, ''),
                        sku: generatedSku,
                        price: parseFloat(v.price) || 0,
                        crystal_color: v.crystalColor,
                        min_stock_level: parseInt(v.minStock) || 0,
                        image_url: (v.images && v.images.length > 0) ? v.images[0] : null
                    }
                });

                // Upsert variants
                const { error: variantError } = await supabase
                    .from('product_variants')
                    .upsert(variantsToUpsert, { onConflict: 'sku' })

                if (variantError) throw variantError;

                // Delete orphaned variants
                const activeSkus = variantsToUpsert.map(v => v.sku);
                if (activeSkus.length > 0) {
                    await supabase
                        .from('product_variants')
                        .delete()
                        .eq('product_id', savedProduct.uuid)
                        .not('sku', 'in', `(${activeSkus.map(s => `"${s}"`).join(',')})`)
                }
            } else {
                // No variants, delete all
                await supabase.from('product_variants').delete().eq('product_id', savedProduct.uuid)
            }
        } catch (syncErr) {
            console.error('[Sync] product_variants synchronization failed:', syncErr.message)
        }

        // Return saved product
        return {
            uuid: savedProduct.uuid,
            product_code: savedProduct.product_code,
            name: savedProduct.name,
            category: savedProduct.category,
            price: savedProduct.price,
            stock: savedProduct.stock,
            description: savedProduct.description,
            material: savedProduct.material,
            variants: savedProduct.variants || [],
            images: savedProduct.image_url ? [savedProduct.image_url] : []
        }
    } catch (error) {
        console.error('CRITICAL: Error saving product:', error.message)
        return null
    }
}

/**
 * Delete product
 */
export const deleteProduct = async (uuid) => {
    try {
        if (!uuid) throw new Error('Product UUID is required');

        // Check if uuid is actually a UUID or a Product Code (Legacy handling)
        let targetUuid = uuid;
        if (uuid.length < 20) { // Simple heuristic
            const { data: product } = await supabase
                .from('products')
                .select('uuid')
                .eq('product_code', uuid)
                .single()

            if (!product) throw new Error('Product not found for deletion');
            targetUuid = product.uuid;
        }

        // Delete using uuid (Hard Delete)
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('uuid', targetUuid)

        if (error) {
            // Check for Foreign Key Violation (Constraint Error)
            if (error.code === '23503') {
                return {
                    success: false,
                    error: 'ไม่สามารถลบสินค้านี้ได้ เนื่องจากมีการใช้งานอยู่ในใบสั่งซื้อ (Order), ใบเสนอราคา (Quotation), ใบงานจัดส่ง (Shipping) หรือใบสั่งซื้อสินค้า (Purchasing/PO) \n\nกรุณาตรวจสอบและลบรายการที่เกี่ยวข้องออกทั้งหมดก่อน จึงจะสามารถลบสินค้านี้ได้'
                }
            }

            console.error('Error deleting product:', error)
            throw error
        }
        return { success: true }
    } catch (error) {
        // If we already handled the error in the 23503 block above, this catch block might be redundant or for re-throw
        // But since we returned above, this catches only other thrown errors
        console.error('Error deleting product:', error)
        return {
            success: false,
            error: error.message || 'เกิดข้อผิดพลาดในการลบสินค้า'
        }
    }
}

/**
 * Get product options from system
 */
export const getProductOptions = async () => {
    if (!supabase) return null
    try {
        const { data, error } = await _withRetry('getSystemOptions', () =>
            supabase.from('system_options_lists').select('*').eq('is_active', true).order('sort_order')
        )

        if (error) throw error

        const systemOptions = {}
        if (data) {
            data.forEach(item => {
                if (!systemOptions[item.category]) {
                    systemOptions[item.category] = []
                }
                systemOptions[item.category].push(item.value)
            })
        }
        return systemOptions
    } catch (error) {
        console.error('Error fetching product options:', error)
        return null
    }
}
