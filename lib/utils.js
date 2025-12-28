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
    return Math.round(R * c)
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
    // If address is a string, return it directly - BUT only if no granular fields exist
    // Actually, to fix the mismatch where 'address' is a cached truncated string,
    // we should prioritize granular fields IF THEY EXIST.

    const getGranularAddress = (addr) => {
        if (!addr || typeof addr !== 'object') return null
        const parts = []

        // Database standard field names
        const components = [
            { field: addr.number, prefix: 'เลขที่ ' },
            { field: addr.villageno, prefix: 'หมู่ ' },
            { field: addr.village, prefix: '' },
            { field: addr.lane, prefix: 'ซอย ' },
            { field: addr.road, prefix: 'ถนน ' },
            { field: addr.subdistrict, prefix: 'ตำบล ' },
            { field: addr.district, prefix: 'อำเภอ ' },
            { field: addr.province, prefix: 'จังหวัด ' },
            { field: addr.zipcode, prefix: '' }
        ]

        // Legacy/Alternative mapping (only for most common)
        const num = addr.number || addr.house_number || addr.addrNumber
        const moo = addr.villageno || addr.village_no || addr.addrMoo
        const building = addr.building || addr.village || addr.addrVillage
        const soi = addr.lane || addr.soi || addr.addrSoi
        const sub = addr.subdistrict || addr.sub_district || addr.addrTambon
        const dist = addr.district || addr.addrAmphoe
        const zip = addr.zipcode || addr.postal_code || addr.postcode || addr.addrZipcode

        if (num) parts.push(`เลขที่ ${num}`)
        if (moo) parts.push(`หมู่ ${moo}`)
        if (building) parts.push(building)
        if (soi) parts.push(`ซอย ${soi}`)
        if (addr.road || addr.addrRoad) parts.push(`ถนน ${addr.road || addr.addrRoad}`)
        if (sub) parts.push(`ตำบล ${sub}`)
        if (dist) parts.push(`อำเภอ ${dist}`)
        if (addr.province || addr.addrProvince) parts.push(`จังหวัด ${addr.province || addr.addrProvince}`)
        if (zip) parts.push(zip)

        return parts.length > 0 ? parts.join(' ') : null
    }

    // 1. Try granular fields from 'address' object
    const fromAddressObj = getGranularAddress(address)
    if (fromAddressObj) return fromAddressObj

    // 2. Try granular fields from 'fallbackObj' 
    const fromFallback = getGranularAddress(fallbackObj)
    if (fromFallback) return fromFallback

    // 3. Fallback to 'address' string
    if (typeof address === 'string' && address) return address

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

/**
 * Convert Google Maps URL to embed URL
 */
export function convertToEmbedUrl(url) {
    if (!url) return null
    const coords = extractCoordinates(url)
    if (coords) {
        return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${coords.lat},${coords.lon}&zoom=15`
    }
    return url
}
