
import { calculateDistance, extractCoordinates, SHOP_LAT, SHOP_LON } from '../../lib/utils'

export default async function handler(req, res) {
    const { url } = req.query

    if (!url) {
        return res.status(400).json({ error: 'URL is required' })
    }

    try {
        // Fetch to resolve redirect (server-side)
        // NOTE: Do NOT send a Browser User-Agent. Google Maps returns an interstitial page (200 OK)
        // instead of a 302 Redirect if it detects a browser.
        const response = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow', // Follow redirects to get final URL
        })

        const finalUrl = response.url
        const coords = extractCoordinates(finalUrl)

        if (coords) {
            const distance = calculateDistance(SHOP_LAT, SHOP_LON, coords.lat, coords.lon)
            return res.status(200).json({
                distance: distance ? `${distance} km` : null,
                distanceNumeric: distance ? parseFloat(distance) : null,
                coords: coords,
                finalUrl: finalUrl
            })
        }

        return res.status(200).json({ distance: null, coords: null, finalUrl })

    } catch (error) {
        console.error('Error resolving map link:', error)
        return res.status(500).json({ error: 'Failed to resolve URL' })
    }
}
