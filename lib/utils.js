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

