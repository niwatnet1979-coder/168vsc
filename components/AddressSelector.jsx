import React, { useState, useEffect } from 'react'
import { Search, Plus } from 'lucide-react'
import AddressCard from './AddressCard'
import DataSourceTooltip from './DataSourceTooltip'
import { calculateDistance, extractCoordinates, SHOP_LAT, SHOP_LON } from '../lib/utils'


export default function AddressSelector({
    label,
    addresses = [],
    value, // { label, address, googleMapLink, distance }
    onChange, // (newValue) => void
    placeholder = "ค้นหาสถานที่...",
    readOnly = false,
    className = "",
    addressClassName = "",
    onAddNew // New prop for adding address
}) {
    const [searchTerm, setSearchTerm] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)

    // Handle initial search term if value is partial? No, value is object.

    const handleSelect = async (addr) => {
        if (readOnly) return

        let distanceStr = ''
        let finalMapLink = addr.googleMapsLink || '' // Use googleMapsLink from customer address object
        let finalDistance = addr.distance

        // Calculate distance if missing
        const hasDistance = finalDistance !== null && finalDistance !== undefined && finalDistance !== ''
        if (!hasDistance && typeof finalMapLink === 'string' && finalMapLink) {
            let coords = extractCoordinates(finalMapLink)

            if (!coords) {
                try {
                    const res = await fetch(`/api/resolve-map-link?url=${encodeURIComponent(finalMapLink)}`)
                    if (res.ok) {
                        const data = await res.json()
                        if (data.url) {
                            finalMapLink = data.url
                            coords = extractCoordinates(data.url)
                        }
                    }
                } catch (error) {
                    console.error('Error resolving map link:', error)
                }
            }

            if (coords) {
                const dist = calculateDistance(SHOP_LAT, SHOP_LON, coords.lat, coords.lon)
                distanceStr = `${dist} km`
                finalDistance = dist
            }
        }

        // If address object already has distance (numeric or string), use it
        if (finalDistance !== null && finalDistance !== undefined && finalDistance !== '') {
            distanceStr = typeof finalDistance === 'number' ? `${finalDistance.toFixed(2)} km` : finalDistance
        }

        // Helper to build full address string
        let fullAddress = ''

        // Priority: Construct from components if available (to ensure full detail)
        if (typeof addr === 'object' && (addr.addrNumber || addr.addrRoad || addr.addrTambon || addr.addrAmphoe || addr.province)) {
            const p = []
            if (addr.addrNumber) p.push(`เลขที่ ${addr.addrNumber}`)
            if (addr.addrMoo) p.push(`หมู่ ${addr.addrMoo}`)
            if (addr.addrVillage) p.push(addr.addrVillage)
            if (addr.addrSoi) p.push(`ซอย ${addr.addrSoi}`)
            if (addr.addrRoad) p.push(`ถนน ${addr.addrRoad}`)
            if (addr.addrTambon) p.push(`ตำบล ${addr.addrTambon}`)
            if (addr.addrAmphoe) p.push(`อำเภอ ${addr.addrAmphoe}`)
            if (addr.province) p.push(`จังหวัด ${addr.province}`)
            if (addr.zipcode) p.push(addr.zipcode)
            fullAddress = p.join(' ')
        }

        // Fallback: Use existing address string if construction failed or no components
        if (!fullAddress) {
            fullAddress = typeof addr.address === 'string'
                ? addr.address
                : (addr.address || '')
        }

        onChange({
            id: addr.id, // Phase 5: Pass through ID for relational storage
            label: addr.label || '',
            address: fullAddress,
            googleMapLink: finalMapLink,
            distance: distanceStr || ''
        })

        setSearchTerm('')
        setShowDropdown(false)
    }

    const hasValue = value && (value.label || value.address)

    return (
        <div className={`bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md ${className}`}>
            {label && <label className="block text-xs font-medium text-secondary-500 mb-1">{label}</label>}

            {/* Search Input */}
            {!hasValue && (
                <div className="relative">
                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value)
                            setShowDropdown(true)
                        }}
                        onFocus={() => !readOnly && setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                        disabled={readOnly}
                        className="w-full pl-6 pr-0 py-0 bg-transparent border-none text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400 placeholder:font-normal"
                        placeholder={placeholder}
                    />
                    {showDropdown && (
                        <div className="absolute z-10 w-full mt-2 left-0 bg-white border border-secondary-200 rounded-lg shadow-lg overflow-hidden flex flex-col">
                            <div className="overflow-y-auto max-h-48">
                                {addresses && addresses.length > 0 ? (
                                    addresses
                                        .filter(addr => {
                                            if (!addr) return false
                                            const addressText = typeof addr.address === 'string' ? addr.address : ''
                                            // Include 'label' in search if present
                                            return (addr.label && addr.label.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                                (addressText && addressText.includes(searchTerm))
                                        })
                                        .map((addr, index) => {
                                            if (!addr) return null

                                            // Display formatted address logic for Dropdown Item
                                            const addressText = typeof addr.address === 'string'
                                                ? addr.address
                                                : (addr.address || '')
                                            let fullAddress = addressText
                                            if (!fullAddress && typeof addr === 'object') {
                                                const p = []
                                                if (addr.addrNumber) p.push(`เลขที่ ${addr.addrNumber}`)
                                                if (addr.addrMoo) p.push(`หมู่ ${addr.addrMoo}`)
                                                if (addr.addrVillage) p.push(addr.addrVillage)
                                                if (addr.addrSoi) p.push(`ซอย ${addr.addrSoi}`)
                                                if (addr.addrRoad) p.push(`ถนน ${addr.addrRoad}`)
                                                if (addr.addrTambon) p.push(`ตำบล ${addr.addrTambon}`)
                                                if (addr.addrAmphoe) p.push(`อำเภอ ${addr.addrAmphoe}`)
                                                if (addr.province) p.push(`จังหวัด ${addr.province}`)
                                                if (addr.zipcode) p.push(addr.zipcode)
                                                fullAddress = p.join(' ')
                                            }

                                            return (
                                                <div
                                                    key={index}
                                                    onClick={() => handleSelect(addr)}
                                                    className="px-3 py-2 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0"
                                                >
                                                    <div className="font-medium text-secondary-900 text-sm">{addr.label || 'ที่อยู่'}</div>
                                                    <div className="text-xs text-secondary-500 truncate">{fullAddress || '-'}</div>
                                                </div>
                                            )
                                        })
                                ) : (
                                    <div className="px-3 py-2 text-xs text-secondary-500 text-center">ไม่พบข้อมูลที่อยู่</div>
                                )}
                            </div>
                            {onAddNew && (
                                <div
                                    onClick={(e) => {
                                        e.preventDefault()
                                        onAddNew()
                                        setShowDropdown(false)
                                    }}
                                    onMouseDown={(e) => e.preventDefault()}
                                    className="px-3 py-2 bg-primary-50 text-primary-700 cursor-pointer font-medium flex items-center gap-2 hover:bg-primary-100 border-t border-primary-100"
                                >
                                    <Plus size={16} /> เพิ่มที่อยู่ใหม่
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Selected Display */}
            {hasValue && (
                <DataSourceTooltip isRealtime={false} source="input/google_maps" showHighlight={false}>
                    <div
                        onClick={() => {
                            if (!readOnly) {
                                // Clear value to show search input again
                                onChange(null) // Parent should handle resetting value to empty/null
                                setSearchTerm('') // Reset search
                                // Optionally auto-focus?
                                // setTimeout(() => setShowDropdown(true), 0)
                            }
                        }}
                        className="mt-1 cursor-pointer rounded-lg transition-all border border-transparent hover:border-transparent"
                    >
                        <AddressCard
                            title={value.label || 'สถานที่'}
                            address={value.address}
                            distance={value.distance}
                            mapLink={value.googleMapLink}
                            variant="transparent"
                            // badge passed via prop if needed? AddressCard handles badges.
                            // But here we might want to pass children or badge prop? 
                            // AddressSelector could accept badge prop or children? 
                            // For simplicity, let's add `badge` prop to AddressSelector
                            badge={value.badge}
                            addressClassName={addressClassName}
                        />
                    </div>
                </DataSourceTooltip>
            )}
        </div>
    )
}
