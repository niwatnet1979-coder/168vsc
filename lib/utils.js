export function currency(n) {
    if (n === undefined || n === null || isNaN(n)) return '฿0.00'
    return Number(n).toLocaleString('th-TH', { style: 'currency', currency: 'THB' })
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return (R * c).toFixed(2)
}

export function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

export function extractCoordinates(url) {
    if (!url) return null
    const match = url.match(/@([-0-9.]+),([-0-9.]+)/)
    if (match) return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) }
    const matchQ = url.match(/[?&]q=([-0-9.]+),([-0-9.]+)/)
    if (matchQ) return { lat: parseFloat(matchQ[1]), lon: parseFloat(matchQ[2]) }
    const matchSearch = url.match(/\/search\/([-0-9.]+),([-0-9.]+)/)
    if (matchSearch) return { lat: parseFloat(matchSearch[1]), lon: parseFloat(matchSearch[2]) }
    const matchDir = url.match(/\/dir\/.*\/([-0-9.]+),([-0-9.]+)/)
    if (matchDir) return { lat: parseFloat(matchDir[1]), lon: parseFloat(matchDir[2]) }
    const matchEmbed = url.match(/!3d([-0-9.]+)!4d([-0-9.]+)/)
    if (matchEmbed) return { lat: parseFloat(matchEmbed[1]), lon: parseFloat(matchEmbed[2]) }
    return null
}

// Shop coordinates (previously in mockData.js)
export const SHOP_LAT = 13.9647757
export const SHOP_LON = 100.6203268

/**
 * Format address from tax invoice or address object
 * Handles both string and object formats with granular fields
 */
export function formatAddress(address, fallbackObj = null) {
    // If address is a string, return it directly
    if (typeof address === 'string' && address) {
        return address
    }

    // If address is an object, build from granular fields
    if (address && typeof address === 'object') {
        const parts = []

        // Try to get fields from address object first
        const addrNumber = address.addrNumber || address.house_number
        const addrMoo = address.addrMoo || address.village_no
        const addrVillage = address.addrVillage || address.building
        const addrSoi = address.addrSoi || address.soi
        const addrRoad = address.addrRoad || address.road
        const addrTambon = address.addrTambon || address.sub_district || address.subdistrict
        const addrAmphoe = address.addrAmphoe || address.district
        const province = address.province || address.addrProvince
        const zipcode = address.zipcode || address.addrZipcode || address.postal_code || address.postcode

        if (addrNumber) parts.push(`เลขที่ ${addrNumber}`)
        if (addrMoo) parts.push(`หมู่ ${addrMoo}`)
        if (addrVillage) parts.push(addrVillage)
        if (addrSoi) parts.push(`ซอย ${addrSoi}`)
        if (addrRoad) parts.push(`ถนน ${addrRoad}`)
        if (addrTambon) parts.push(`ตำบล ${addrTambon}`)
        if (addrAmphoe) parts.push(`อำเภอ ${addrAmphoe}`)
        if (province) parts.push(`จังหวัด ${province}`)
        if (zipcode) parts.push(zipcode)

        const result = parts.join(' ')
        if (result) return result
    }

    // Fallback: try to read from fallbackObj (e.g., taxInvoice root level)
    if (fallbackObj && typeof fallbackObj === 'object') {
        const parts = []

        if (fallbackObj.addrNumber || fallbackObj.house_number) parts.push(`เลขที่ ${fallbackObj.addrNumber || fallbackObj.house_number}`)
        if (fallbackObj.addrMoo || fallbackObj.village_no) parts.push(`หมู่ ${fallbackObj.addrMoo || fallbackObj.village_no}`)
        if (fallbackObj.addrVillage || fallbackObj.building) parts.push(fallbackObj.addrVillage || fallbackObj.building)
        if (fallbackObj.addrSoi || fallbackObj.soi) parts.push(`ซอย ${fallbackObj.addrSoi || fallbackObj.soi}`)
        if (fallbackObj.addrRoad || fallbackObj.road) parts.push(`ถนน ${fallbackObj.addrRoad || fallbackObj.road}`)
        if (fallbackObj.addrTambon || fallbackObj.sub_district || fallbackObj.subdistrict) parts.push(`ตำบล ${fallbackObj.addrTambon || fallbackObj.sub_district || fallbackObj.subdistrict}`)
        if (fallbackObj.addrAmphoe || fallbackObj.district) parts.push(`อำเภอ ${fallbackObj.addrAmphoe || fallbackObj.district}`)
        if (fallbackObj.province || fallbackObj.addrProvince) parts.push(`จังหวัด ${fallbackObj.province || fallbackObj.addrProvince}`)
        if (fallbackObj.zipcode || fallbackObj.addrZipcode || fallbackObj.postal_code || fallbackObj.postcode) {
            parts.push(fallbackObj.zipcode || fallbackObj.addrZipcode || fallbackObj.postal_code || fallbackObj.postcode)
        }

        const result = parts.join(' ')
        if (result) return result
    }

    return '-'
}

// --- DATE HELPER FUNCTIONS ---

/**
 * Format Date for Display (User Facing)
 * Standard: DD/MM/YYYY HH:mm (AD Year)
 * Example: 22/12/2025 11:38
 */
export function formatDateForDisplay(isoString) {
    if (!isoString) return '-'
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return '-'

    const pad = (n) => n < 10 ? '0' + n : n
    const day = pad(date.getDate())
    const month = pad(date.getMonth() + 1)
    const year = date.getFullYear() // AD Year
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())

    return `${day}/${month}/${year} ${hours}:${minutes}`
}

/**
 * Format Date for Input (HTML5 datetime-local)
 * Standard: YYYY-MM-DDTHH:mm
 * Example: 2025-12-22T11:38
 */
export function formatDateForInput(isoString) {
    if (!isoString) return ''
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ''

    const pad = (n) => n < 10 ? '0' + n : n
    const year = date.getFullYear()
    const month = pad(date.getMonth() + 1)
    const day = pad(date.getDate())
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())

    return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Format Date for Save (Database)
 * Standard: ISO 8601 UTC
 * Example: 2025-12-22T04:38:00.000Z
 */
export function formatDateForSave(localDateString) {
    if (!localDateString) return null
    const date = new Date(localDateString)
    if (isNaN(date.getTime())) return null
    return date.toISOString()
}
