import React, { useState } from 'react'
import { Wrench, ChevronDown, Search } from 'lucide-react'
import AddressCard from './AddressCard'
import Card from './Card'
import ContactSelector from './ContactSelector'
import { calculateDistance, extractCoordinates } from '../lib/utils'
import { SHOP_LAT, SHOP_LON } from '../lib/mockData'

export default function JobInfoCard({
    data,
    onChange,
    customer = {},
    availableTeams,
    note,
    onNoteChange,
    showCompletionDate = true,
    showHeader = true,
    excludeJobTypes = []
}) {
    const [installLocationSearchTerm, setInstallLocationSearchTerm] = useState('')
    const [showInstallLocationDropdown, setShowInstallLocationDropdown] = useState(false)

    const handleUpdate = (updates) => {
        onChange({ ...data, ...updates })
    }

    return (
        <Card
            className={`flex flex-col h-full ${!showHeader ? 'border-0 shadow-none p-0' : 'md:p-6'}`}
            title={showHeader ? (
                <h2 className="text-lg font-bold text-secondary-900 flex items-center gap-2">
                    <Wrench className="text-primary-600" />
                    ข้อมูลงานหลัก
                </h2>
            ) : null}
            contentClassName="flex-1"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-1">ประเภทงาน</label>
                        <select
                            value={data.jobType}
                            onChange={e => handleUpdate({ jobType: e.target.value })}
                            className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            {!excludeJobTypes.includes('installation') && <option value="installation">งานติดตั้ง (Installation)</option>}
                            {!excludeJobTypes.includes('delivery') && <option value="delivery">ส่งของ (Delivery)</option>}
                            {!excludeJobTypes.includes('separate') && <option value="separate">งานแยก (Separate)</option>}
                        </select>
                    </div>

                    {data.jobType !== 'separate' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-secondary-700 mb-1">ทีม</label>
                                <div className="relative">
                                    <select
                                        value={data.team}
                                        onChange={(e) => handleUpdate({ team: e.target.value })}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 appearance-none bg-white font-medium text-secondary-900"
                                    >
                                        <option value="">-- เลือกทีม --</option>
                                        {availableTeams.map((team, idx) => (
                                            <option key={idx} value={team}>{team}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none" size={18} />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <label className="block text-sm font-medium text-secondary-700 mb-1">วันที่นัดหมาย</label>
                                <input
                                    type="datetime-local"
                                    value={data.appointmentDate || ''}
                                    onChange={e => handleUpdate({ appointmentDate: e.target.value })}
                                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white font-medium text-secondary-900 appearance-none text-sm min-w-0 max-w-full h-[42px]"
                                />
                            </div>
                            {showCompletionDate && (
                                <div className="min-w-0">
                                    <label className="block text-sm font-medium text-secondary-700 mb-1">วันที่สำเร็จ</label>
                                    <input
                                        type="datetime-local"
                                        value={data.completionDate || ''}
                                        onChange={e => handleUpdate({ completionDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white font-medium text-secondary-900 appearance-none text-sm min-w-0 max-w-full h-[42px]"
                                    />
                                </div>
                            )}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-secondary-700 mb-1">สถานที่ติดตั้ง / จัดส่ง</label>

                                {/* Address Dropdown */}
                                {!data.installLocationName ? (
                                    <div className="relative mb-3">
                                        <Search className="absolute left-3 top-3 text-secondary-400" size={16} />
                                        <input
                                            type="text"
                                            value={installLocationSearchTerm}
                                            onChange={(e) => {
                                                setInstallLocationSearchTerm(e.target.value)
                                                setShowInstallLocationDropdown(true)
                                            }}
                                            onFocus={() => setShowInstallLocationDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowInstallLocationDropdown(false), 200)}
                                            className="w-full pl-9 pr-4 py-2.5 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm bg-white"
                                            placeholder="ค้นหาสถานที่ติดตั้ง..."
                                        />
                                        {showInstallLocationDropdown && (
                                            <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                {customer.addresses
                                                    ?.filter(addr => {
                                                        const addressText = typeof addr.address === 'string' ? addr.address : '';
                                                        return addr.label.toLowerCase().includes(installLocationSearchTerm.toLowerCase()) || addressText.includes(installLocationSearchTerm);
                                                    })
                                                    .map((addr, index) => {
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
                                                                    // Calculate distance if not present
                                                                    let distanceStr = '';
                                                                    let finalMapLink = addr.googleMapsLink || '';

                                                                    if (addr.distance) {
                                                                        distanceStr = `${addr.distance.toFixed(2)} km`;
                                                                    } else if (addr.googleMapsLink) {
                                                                        let coords = extractCoordinates(addr.googleMapsLink);

                                                                        // If coords not found, try to resolve short link via API
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
                                                                        distance: distanceStr,
                                                                        inspector1: addr.inspector1 ? {
                                                                            name: String(addr.inspector1.name || ''),
                                                                            phone: String(addr.inspector1.phone || ''),
                                                                            address: typeof addr.inspector1.address === 'string' ? addr.inspector1.address : (addr.inspector1.address ? JSON.stringify(addr.inspector1.address) : '')
                                                                        } : { name: '', phone: '', address: '' },
                                                                        inspector2: addr.inspector2 ? {
                                                                            name: String(addr.inspector2.name || ''),
                                                                            phone: String(addr.inspector2.phone || ''),
                                                                            address: typeof addr.inspector2.address === 'string' ? addr.inspector2.address : (addr.inspector2.address ? JSON.stringify(addr.inspector2.address) : '')
                                                                        } : { name: '', phone: '', address: '' }
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
                                                    })}
                                            </div>
                                        )}
                                    </div>
                                ) : null}

                                {/* Selected Address Details Card */}
                                {(data.installAddress || data.installLocationName) && (
                                    <AddressCard
                                        title={data.installLocationName || 'สถานที่ติดตั้ง'}
                                        address={data.installAddress}
                                        distance={data.distance}
                                        mapLink={data.googleMapLink}
                                        onClear={() => handleUpdate({
                                            installLocationName: '',
                                            installAddress: '',
                                            googleMapLink: '',
                                            distance: '',
                                            inspector1: { name: '', phone: '', address: '' },
                                            inspector2: { name: '', phone: '', address: '' }
                                        })}
                                        variant="primary"
                                    />
                                )}
                                {/* Inspector Selection (From Customer Contacts) */}
                                <ContactSelector
                                    variant="blue"
                                    label="ผู้ตรวจงาน / รับสินค้า"
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

                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Notes Section */}
            {data.jobType !== 'separate' && (
                <div className="mt-4">
                    <label className="block text-sm font-medium text-secondary-700 mb-2">รายละเอียด</label>
                    <textarea
                        rows={2}
                        value={note}
                        onChange={e => onNoteChange && onNoteChange(e.target.value)}
                        className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm resize-none"
                        placeholder="รายละเอียดเพิ่มเติม..."
                    />
                </div>
            )}
        </div>
    </Card>
    )
}
