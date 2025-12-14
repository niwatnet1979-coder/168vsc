import React, { useState } from 'react'
import { Wrench, ChevronDown, Search } from 'lucide-react'
import AddressCard from './AddressCard'
import Card from './Card'
import ContactSelector from './ContactSelector'
import { calculateDistance, extractCoordinates } from '../lib/utils'
import { SHOP_LAT, SHOP_LON } from '../lib/mockData'
import DataSourceTooltip from './DataSourceTooltip'

export default function JobInfoCard({
    data,
    onChange,
    customer = {},
    availableTeams,
    note,
    onNoteChange,
    showCompletionDate = true,
    showHeader = true,
    excludeJobTypes = [],
    readOnly = false,
    className = ''
}) {
    const [installLocationSearchTerm, setInstallLocationSearchTerm] = useState('')
    const [showInstallLocationDropdown, setShowInstallLocationDropdown] = useState(false)

    const handleUpdate = (updates) => {
        if (!readOnly) {
            onChange({ ...data, ...updates })
        }
    }



    // Read-Only View (Display Mode - Matches ProductDetailView style)
    if (readOnly) {
        const val = (v) => v || '-'
        const getJobTypeLabel = (t) => {
            if (t === 'installation') return 'งานติดตั้ง (Installation)'
            if (t === 'delivery') return 'ขนส่ง (Delivery)'
            if (t === 'separate') return 'งานแยก (Separate)'
            return t || '-'
        }

        return (
            <div className={`bg-white rounded-xl shadow-sm border border-secondary-200 p-4 h-full flex flex-col ${className}`}>
                {showHeader && (
                    <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2 mb-4">
                        <Wrench className="text-primary-600" />
                        ข้อมูลงานหลัก
                    </h2>
                )}
                <div className="space-y-3">
                    {/* Job Type */}
                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                        <label className="block text-xs font-medium text-secondary-500 mb-1">ประเภทงาน</label>
                        <div className="text-sm font-medium text-secondary-900">{getJobTypeLabel(data.jobType)}</div>
                    </div>

                    {data.jobType !== 'separate' && (
                        <>
                            {/* Team */}
                            <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                                <label className="block text-xs font-medium text-secondary-500 mb-1">ทีม</label>
                                <div className="text-sm font-medium text-secondary-900">{val(data.team)}</div>
                            </div>

                            {/* Dates Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                                    <label className="block text-xs font-medium text-secondary-500 mb-1">วันที่นัดหมาย</label>
                                    <div className="text-sm font-medium text-secondary-900">{val(data.appointmentDate?.replace('T', ' '))}</div>
                                </div>
                                {showCompletionDate && (
                                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                                        <label className="block text-xs font-medium text-secondary-500 mb-1">วันที่สำเร็จ</label>
                                        <div className="text-sm font-medium text-secondary-900">{val(data.completionDate?.replace('T', ' '))}</div>
                                    </div>
                                )}
                            </div>

                            {/* Location */}
                            {(data.installAddress || data.installLocationName) && (
                                <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                                    <label className="block text-xs font-medium text-secondary-500 mb-1">สถานที่ติดตั้ง / ขนส่ง</label>
                                    <DataSourceTooltip isRealtime={false} source="input/google_maps">
                                        <div className="space-y-1">
                                            {data.installLocationName && (
                                                <div className="text-sm font-medium text-secondary-900">{data.installLocationName}</div>
                                            )}
                                            {data.installAddress && (
                                                <div className="text-sm text-secondary-600 leading-relaxed">{data.installAddress}</div>
                                            )}
                                            {(data.distance || data.googleMapLink) && (
                                                <div className="pt-1 flex flex-wrap gap-2 items-center">
                                                    {data.distance && (
                                                        <span className="text-xs bg-white border border-secondary-200 text-secondary-600 px-2 py-0.5 rounded-full">
                                                            {data.distance}
                                                        </span>
                                                    )}
                                                    {data.googleMapLink && (
                                                        <a href={data.googleMapLink} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                                            เปิดแผนที่
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </DataSourceTooltip>
                                </div>
                            )}

                            {/* Inspector */}
                            <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                                <label className="block text-xs font-medium text-secondary-500 mb-1">ผู้ตรวจงาน / รับสินค้า</label>
                                <div className="flex items-center gap-2 text-sm font-medium text-secondary-900">
                                    <span>{data.inspector1?.name || '-'}</span>
                                    {data.inspector1?.phone && <span className="text-secondary-500 text-xs">({data.inspector1.phone})</span>}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Note */}
                    {note && (
                        <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100">
                            <label className="block text-xs font-medium text-secondary-500 mb-1">รายละเอียด</label>
                            <div className="text-sm font-medium text-secondary-900 opacity-80">{note}</div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <Card
            className={`flex flex-col h-full ${!showHeader ? 'border-0 shadow-none p-0' : 'md:p-6'} ${className}`}
            title={showHeader ? (
                <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                    <Wrench className="text-primary-600" />
                    ข้อมูลงานหลัก
                </h2>
            ) : null}
            contentClassName="flex-1"
        >
            <div className="space-y-3">
                {/* Job Type */}
                <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                    <label className="block text-xs font-medium text-secondary-500 mb-1">ประเภทงาน</label>
                    <select
                        value={data.jobType}
                        onChange={e => handleUpdate({ jobType: e.target.value })}
                        disabled={readOnly}
                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 cursor-pointer"
                    >
                        <option value="">-- เลือกประเภทงาน --</option>
                        {!excludeJobTypes.includes('installation') && <option value="installation">งานติดตั้ง (Installation)</option>}
                        {!excludeJobTypes.includes('delivery') && <option value="delivery">ขนส่ง (Delivery)</option>}
                        {!excludeJobTypes.includes('separate') && <option value="separate">งานแยก (Separate)</option>}
                    </select>
                </div>

                {data.jobType !== 'separate' && (
                    <>
                        {/* Team */}
                        <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                            <label className="block text-xs font-medium text-secondary-500 mb-1">ทีม</label>
                            <div className="relative">
                                <DataSourceTooltip isRealtime={false} source="input" showHighlight={false}>
                                    <select
                                        value={data.team}
                                        onChange={(e) => handleUpdate({ team: e.target.value })}
                                        disabled={readOnly}
                                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 appearance-none cursor-pointer pr-6"
                                    >
                                        <option value="">-- เลือกทีม --</option>
                                        {availableTeams.map((team, idx) => (
                                            <option key={idx} value={team}>{team}</option>
                                        ))}
                                    </select>
                                </DataSourceTooltip>
                                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Dates Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                                <label className="block text-xs font-medium text-secondary-500 mb-1">วันที่นัดหมาย</label>
                                <DataSourceTooltip isRealtime={false} source="input" showHighlight={false} className="w-full block">
                                    <input
                                        type="datetime-local"
                                        value={data.appointmentDate || ''}
                                        onChange={e => handleUpdate({ appointmentDate: e.target.value })}
                                        disabled={readOnly}
                                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400"
                                    />
                                </DataSourceTooltip>
                            </div>
                            {showCompletionDate && (
                                <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                                    <label className="block text-xs font-medium text-secondary-500 mb-1">วันที่สำเร็จ</label>
                                    <input
                                        type="datetime-local"
                                        value={data.completionDate || ''}
                                        onChange={e => handleUpdate({ completionDate: e.target.value })}
                                        disabled={readOnly}
                                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Location */}
                        <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                            <label className="block text-xs font-medium text-secondary-500 mb-1">สถานที่ติดตั้ง / ขนส่ง</label>

                            {/* Address Dropdown */}
                            {!data.installLocationName ? (
                                <div className="relative">
                                    <Search className="absolute left-0 top-0.5 text-secondary-400" size={16} />
                                    <input
                                        type="text"
                                        value={installLocationSearchTerm}
                                        onChange={(e) => {
                                            setInstallLocationSearchTerm(e.target.value)
                                            setShowInstallLocationDropdown(true)
                                        }}
                                        onFocus={() => !readOnly && setShowInstallLocationDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowInstallLocationDropdown(false), 200)}
                                        disabled={readOnly}
                                        className="w-full pl-6 pr-0 py-0 bg-transparent border-none text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400 placeholder:font-normal"
                                        placeholder="ค้นหาสถานที่ติดตั้ง..."
                                    />
                                    {showInstallLocationDropdown && (
                                        <div className="absolute z-10 w-full mt-2 left-0 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {customer && customer.addresses && Array.isArray(customer.addresses)
                                                ? customer.addresses
                                                    .filter(addr => {
                                                        if (!addr) return false;
                                                        const addressText = typeof addr.address === 'string' ? addr.address : '';
                                                        return (addr.label && addr.label.toLowerCase().includes(installLocationSearchTerm.toLowerCase())) ||
                                                            (addressText && addressText.includes(installLocationSearchTerm));
                                                    })
                                                    .map((addr, index) => {
                                                        if (!addr) return null;

                                                        const addressText = typeof addr.address === 'string'
                                                            ? addr.address
                                                            : (addr.address || '');

                                                        // Helper to build address string if object
                                                        let fullAddress = addressText;
                                                        if (!fullAddress && typeof addr === 'object') {
                                                            const p = [];
                                                            if (addr.addrNumber) p.push(`เลขที่ ${addr.addrNumber}`);
                                                            if (addr.addrMoo) p.push(`หมู่ ${addr.addrMoo}`);
                                                            if (addr.addrVillage) p.push(addr.addrVillage);
                                                            if (addr.addrSoi) p.push(`ซอย ${addr.addrSoi}`);
                                                            if (addr.addrRoad) p.push(`ถนน ${addr.addrRoad}`);
                                                            if (addr.addrTambon) p.push(`ตำบล ${addr.addrTambon}`);
                                                            if (addr.addrAmphoe) p.push(`อำเภอ ${addr.addrAmphoe}`);
                                                            if (addr.province) p.push(`จังหวัด ${addr.province}`);
                                                            if (addr.zipcode) p.push(addr.zipcode);
                                                            fullAddress = p.join(' ');
                                                        }

                                                        return (
                                                            <div
                                                                key={index}
                                                                onClick={async () => {
                                                                    if (readOnly) return;
                                                                    let distanceStr = '';
                                                                    let finalMapLink = addr.googleMapsLink || '';

                                                                    if (addr.distance) {
                                                                        distanceStr = `${addr.distance.toFixed(2)} km`;
                                                                    } else if (typeof addr.googleMapsLink === 'string' && addr.googleMapsLink) {
                                                                        let coords = extractCoordinates(addr.googleMapsLink);

                                                                        if (!coords) {
                                                                            try {
                                                                                const res = await fetch(`/api/resolve-map-link?url=${encodeURIComponent(addr.googleMapsLink)}`);
                                                                                if (res.ok) {
                                                                                    const data = await res.json();
                                                                                    if (data.url) {
                                                                                        finalMapLink = data.url;
                                                                                        coords = extractCoordinates(data.url);
                                                                                    }
                                                                                }
                                                                            } catch (error) {
                                                                                console.error('Error resolving map link:', error);
                                                                            }
                                                                        }

                                                                        if (coords) {
                                                                            const dist = calculateDistance(SHOP_LAT, SHOP_LON, coords.lat, coords.lon);
                                                                            distanceStr = `${dist} km`;
                                                                        }
                                                                    }

                                                                    handleUpdate({
                                                                        installLocationName: addr.label || '',
                                                                        installAddress: fullAddress,
                                                                        googleMapLink: finalMapLink,
                                                                        distance: distanceStr
                                                                    });
                                                                    setInstallLocationSearchTerm('');
                                                                    setShowInstallLocationDropdown(false);
                                                                }}
                                                                className="px-3 py-2 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0"
                                                            >
                                                                <div className="font-medium text-secondary-900 text-sm">{addr.label}</div>
                                                                <div className="text-xs text-secondary-500 truncate">{fullAddress}</div>
                                                            </div>
                                                        );
                                                    })
                                                : null}
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            {/* Selected Address Details Card */}
                            {(data.installAddress || data.installLocationName) && (
                                <DataSourceTooltip isRealtime={false} source="input/google_maps" showHighlight={false}>
                                    <div
                                        onClick={() => {
                                            if (!readOnly) {
                                                setInstallLocationSearchTerm('');
                                                setShowInstallLocationDropdown(true);
                                                // We don't clear the data immediately to avoid "flashing"
                                                // The dropdown will cover the input, but the user clicks here to "change"
                                                // Actually if we want to "Change", we should probably reset?
                                                // Or just show the search box again?
                                                // If we just set ShowDropdown, it might look like nothing happened if input is hidden?
                                                // The input IS hidden because data.installLocationName is true.
                                                // Strategy: Clear the 'installLocationName' momentarily OR better:
                                                // Clear only the 'installLocationName' so the input reappears?
                                                // But then we lose the value if they cancel.
                                                // Ah, JobInfoCard logic (Line 219) hides input if installLocationName exists.
                                                // So we MUST clear installLocationName to see input.
                                                // Let's clear it, but maybe keep a backup if needed? 
                                                // For now, simpler is "Reset" behavior as requested.
                                                handleUpdate({
                                                    installLocationName: '',
                                                    installAddress: '',
                                                    googleMapLink: '',
                                                    distance: ''
                                                });
                                            }
                                        }}
                                        className="mt-1 cursor-pointer rounded-lg transition-all border border-transparent hover:border-transparent"
                                    >
                                        <AddressCard
                                            title={data.installLocationName || 'สถานที่ติดตั้ง / ขนส่ง'}
                                            address={data.installAddress}
                                            distance={data.distance}
                                            mapLink={data.googleMapLink}
                                            // No onClear prop passed -> No X button
                                            variant="transparent"
                                        />
                                    </div>
                                </DataSourceTooltip>
                            )}
                        </div>

                        {/* Inspector Selection */}
                        <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                            {/* Note: ContactSelector has its own label usage, but we wrap it for consistency */}
                            <label className="block text-xs font-medium text-secondary-500 mb-1">ผู้ตรวจงาน / รับสินค้า</label>
                            <ContactSelector
                                variant="seamless"
                                label={null} // Hide internal label
                                contacts={customer.contacts || []}
                                value={data.inspector1}
                                onChange={(contact) => {
                                    handleUpdate({
                                        inspector1: contact ? {
                                            name: contact.name,
                                            phone: contact.phone || ''
                                        } : { name: '', phone: '' }
                                    })
                                }}
                                isReadOnly={readOnly}
                            />
                        </div>
                    </>
                )}

                {/* Notes Section */}
                {data.jobType !== 'separate' && (
                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                        <label className="block text-xs font-medium text-secondary-500 mb-1">รายละเอียด</label>
                        <textarea
                            rows={1}
                            value={note}
                            onChange={e => onNoteChange && onNoteChange(e.target.value)}
                            disabled={readOnly}
                            className="w-full bg-transparent border-none p-0 text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400 placeholder:font-normal resize-none"
                            placeholder="รายละเอียดเพิ่มเติม..."
                        />
                    </div>
                )}
            </div>
        </Card >
    )
}
