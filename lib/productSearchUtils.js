/**
 * Product Search Utilities for Order Component
 * Handles product searching and selection logic
 */

/**
 * Searches products based on search term
 * @param {string} term - Search term
 * @param {Array} productsData - Array of all products
 * @returns {Array} Filtered products matching the search term
 */
export function searchProducts(term, productsData) {
    if (!term.trim()) {
        return []
    }

    const lowerTerm = term.toLowerCase()
    const results = productsData.filter(p => {
        // Deep search: Convert entire object to string to search everywhere (including nested props)
        return JSON.stringify(p).toLowerCase().includes(lowerTerm)
    })

    // Debug logging
    console.log(`Searching for: "${lowerTerm}", Found: ${results.length} items from ${productsData.length} total products`)
    console.log('First 3 results:', results.slice(0, 3))

    return results
}

/**
 * Creates a handler for product search
 * @param {Array} items - Current items array
 * @param {Function} setItems - Function to update items
 * @param {Function} setActiveSearchIndex - Function to set active search index
 * @param {Function} setSearchResults - Function to set search results
 * @param {Array} productsData - Array of all products
 * @returns {Function} Handler function for product search
 */
export function createProductSearchHandler(items, setItems, setActiveSearchIndex, setSearchResults, productsData) {
    return (index, term) => {
        const newItems = [...items]
        newItems[index]._searchTerm = term
        newItems[index].showPopup = true  // Auto-show popup when typing
        setItems(newItems)
        setActiveSearchIndex(index)

        // Debug logging
        console.log('=== SEARCH DEBUG ===')
        console.log('Search term:', term)
        console.log('Products data length:', productsData.length)
        console.log('Popup should show:', newItems[index].showPopup)

        const results = searchProducts(term, productsData)
        setSearchResults(results)
    }
}

/**
 * Creates a handler for product selection with job synchronization
 * @param {Array} items - Current items array
 * @param {Function} setItems - Function to update items
 * @param {Function} setSearchResults - Function to set search results
 * @param {Object} currentJobInfo - Current job information for sync
 * @returns {Function} Handler function for product selection
 */
export function createProductSelectHandler(items, setItems, setSearchResults, currentJobInfo = null) {
    return (index, product) => {
        const newItems = [...items]
        // Use first variant's price as default
        const defaultPrice = product.variants?.[0]?.price || 0

        newItems[index] = {
            ...newItems[index],
            code: product.product_code,
            name: product.name,
            description: product.description || product.name,
            unitPrice: defaultPrice,
            image: product.variants?.[0]?.images?.[0] || null,
            category: product.category,
            subcategory: product.subcategory,
            length: product.length,
            width: product.width,
            height: product.height,
            material: product.material,
            stock: product.variants?.[0]?.stock || 0,
            _searchTerm: undefined,
            showPopup: false,
            // Sync main job info to jobs array if not separate
            jobs: currentJobInfo && currentJobInfo.jobType !== 'separate' ? (() => {
                const existingJobs = newItems[index].jobs || []
                if (existingJobs.length > 0) {
                    // Update first job with current job info
                    return existingJobs.map((job, idx) =>
                        idx === 0 ? {
                            ...job,
                            jobType: currentJobInfo.jobType,
                            appointmentDate: currentJobInfo.appointmentDate,
                            completionDate: currentJobInfo.completionDate,
                            installLocationName: currentJobInfo.installLocationName,
                            installAddress: currentJobInfo.installAddress,
                            googleMapLink: currentJobInfo.googleMapLink,
                            distance: currentJobInfo.distance,
                            team: currentJobInfo.team,
                            description: currentJobInfo.note || job.description
                        } : job
                    )
                } else {
                    // Create new job with current job info
                    return [{
                        jobType: currentJobInfo.jobType,
                        appointmentDate: currentJobInfo.appointmentDate,
                        completionDate: currentJobInfo.completionDate,
                        installLocationName: currentJobInfo.installLocationName,
                        installAddress: currentJobInfo.installAddress,
                        googleMapLink: currentJobInfo.googleMapLink,
                        distance: currentJobInfo.distance,
                        team: currentJobInfo.team,
                        description: currentJobInfo.note || ''
                    }]
                }
            })() : (newItems[index].jobs || [])
        }

        setItems(newItems)
        setSearchResults([])

        // Debug
        console.log('=== PRODUCT SELECTED ===')
        console.log('Selected product:', product)
        console.log('Updated item:', newItems[index])
    }
}

