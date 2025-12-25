import React from 'react';
import { Search, FileText, Plus } from 'lucide-react';
import Card from '../Card';
import AddressSelector from '../AddressSelector';
import ContactSelector from '../ContactSelector';
import ContactDisplayCard from '../ContactDisplayCard';

export default function OrderTaxInvoiceSection({
    // Tax Invoice Data
    taxInvoice,
    setTaxInvoice,
    customer,

    // Tax Invoice Search State
    taxInvoiceSearchTerm,
    setTaxInvoiceSearchTerm,
    showTaxInvoiceDropdown,
    setShowTaxInvoiceDropdown,

    // Delivery Address
    taxInvoiceDeliveryAddress,
    setTaxInvoiceDeliveryAddress,
    currentJobInfo,

    // Receiver Contact
    receiverContact,
    setReceiverContact,

    // Handlers
    onAddNewTaxInvoice,
    onAddNewAddress,
    onAddNewContact,

    // Utilities
    formatAddress
}) {
    return (
        <div className="order-4 md:order-2 flex flex-col h-full">
            {/* Tax Invoice & Delivery Contact Card */}
            <Card className="p-6 flex flex-col h-full">
                <h2 className="text-lg font-bold text-secondary-900 mb-4 flex items-center gap-2">
                    <FileText className="text-primary-600" />
                    ข้อมูลใบกำกับภาษี
                </h2>

                <div className="flex-1 space-y-3">
                    {/* Tax Invoice Section - Always Visible Search if not selected */}
                    {!taxInvoice.companyName ? (
                        <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                            <div className="relative">
                                <div className="mb-2">
                                    <label className="block text-xs font-medium text-secondary-500 mb-1">ค้นหาใบกำกับภาษี</label>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                                    <input
                                        type="text"
                                        value={taxInvoiceSearchTerm}
                                        onChange={(e) => {
                                            setTaxInvoiceSearchTerm(e.target.value)
                                            setShowTaxInvoiceDropdown(true)
                                        }}
                                        onFocus={() => setShowTaxInvoiceDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowTaxInvoiceDropdown(false), 200)}
                                        className="w-full pl-6 pr-0 py-0 bg-transparent border-none text-sm font-medium text-secondary-900 focus:ring-0 placeholder-secondary-400 placeholder:font-normal"
                                        placeholder="ค้นหาใบกำกับภาษี (ชื่อบริษัท / เลขผู้เสียภาษี)..."
                                    />
                                </div>
                                {showTaxInvoiceDropdown && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {customer.taxInvoices && customer.taxInvoices.length > 0 ? (
                                            customer.taxInvoices
                                                .filter(inv =>
                                                    (inv.companyName || '').toLowerCase().includes(taxInvoiceSearchTerm.toLowerCase()) ||
                                                    (inv.taxId || '').includes(taxInvoiceSearchTerm)
                                                )
                                                .map((inv, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => {
                                                            setTaxInvoice({
                                                                ...inv,
                                                                branch: inv.branch || 'สำนักงานใหญ่',
                                                                phone: customer.phone || '',
                                                                email: customer.email || ''
                                                            });
                                                            setTaxInvoiceSearchTerm('');
                                                            setShowTaxInvoiceDropdown(false);
                                                        }}
                                                        className="px-3 py-2 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0"
                                                    >
                                                        <div className="font-medium text-secondary-900 text-sm">{inv.companyName}</div>
                                                        <div className="text-xs text-secondary-500">
                                                            {inv.taxId} {inv.branch ? `| ${inv.branch}` : ''}
                                                        </div>
                                                    </div>
                                                ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-secondary-500 text-center">ไม่มีข้อมูลใบกำกับภาษี</div>
                                        )}
                                        <div
                                            onClick={(e) => {
                                                e.preventDefault()
                                                onAddNewTaxInvoice()
                                                setShowTaxInvoiceDropdown(false)
                                            }}
                                            onMouseDown={(e) => e.preventDefault()}
                                            className="px-3 py-2 bg-primary-50 text-primary-700 cursor-pointer font-medium flex items-center gap-2 hover:bg-primary-100 border-t border-primary-100 sticky bottom-0"
                                        >
                                            <Plus size={16} /> เพิ่มใบกำกับภาษีใหม่
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}

                    {/* Selected Details Card - Click to re-select */}
                    {taxInvoice.companyName && (
                        <div
                            onClick={() => setTaxInvoice({ companyName: '', branch: '', taxId: '', address: '', phone: '', email: '', deliveryAddress: '' })}
                            className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md cursor-pointer group"
                            title="คลิกเพื่อเปลี่ยนใบกำกับภาษี"
                        >
                            {/* Header: Company Name & Branch */}
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="font-bold text-secondary-900 text-sm leading-tight group-hover:text-primary-600 transition-colors">
                                            {taxInvoice.companyName}
                                        </h4>
                                        <span className="px-1.5 py-0.5 bg-secondary-100 text-secondary-700 text-[10px] font-medium rounded border border-secondary-200">
                                            {taxInvoice.branch || 'สำนักงานใหญ่'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-secondary-500 mt-1 flex items-center gap-2">
                                        <span className="font-medium">เลขผู้เสียภาษี:</span>
                                        <span className="px-1.5 py-0.5 bg-white text-secondary-700 text-[10px] font-mono font-medium rounded border border-secondary-200">{taxInvoice.taxId}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Addresses */}
                            <div>
                                <label className="block text-xs font-semibold text-secondary-500 mb-1">ที่อยู่บริษัท</label>
                                <div className="text-xs text-secondary-800 leading-relaxed">
                                    {formatAddress(taxInvoice.address, taxInvoice)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tax Invoice Delivery Address Selection - Always Visible */}
                    <div className="space-y-3">
                        {/* Address Selector Component */}
                        <AddressSelector
                            label="ที่อยู่จัดส่งใบกำกับภาษี"
                            addresses={[
                                // Include "Same as Install" option if available
                                ...(currentJobInfo?.installAddress ? [{
                                    label: 'ใช้ที่อยู่เดียวกับสถานที่ติดตั้ง/ขนส่ง',
                                    address: currentJobInfo?.installAddress,
                                    googleMapLink: currentJobInfo.googleMapLink || '',
                                    distance: currentJobInfo.distance || '',
                                    isSpecial: true
                                }] : []),
                                ...(customer.addresses || [])
                            ]}
                            value={(() => {
                                const isSame = taxInvoiceDeliveryAddress.type === 'same' || (currentJobInfo?.installAddress && taxInvoiceDeliveryAddress.address === currentJobInfo?.installAddress);
                                return {
                                    label: isSame ? (currentJobInfo.installLocationName || 'สถานที่ติดตั้ง/ขนส่ง') : taxInvoiceDeliveryAddress.label,
                                    address: isSame ? (currentJobInfo?.installAddress || '') : taxInvoiceDeliveryAddress.address,
                                    googleMapLink: isSame ? (currentJobInfo.googleMapLink || '') : taxInvoiceDeliveryAddress.googleMapLink,
                                    distance: isSame ? (currentJobInfo.distance || '') : taxInvoiceDeliveryAddress.distance,
                                    badge: isSame ? (
                                        <span className="px-1.5 py-0.5 bg-success-50 text-success-700 text-[10px] font-medium rounded border border-success-200">
                                            ที่อยู่เดียวกัน
                                        </span>
                                    ) : null
                                };
                            })()}
                            onChange={(newValue) => {
                                if (newValue) {
                                    const isSame = currentJobInfo?.installAddress && newValue.address === currentJobInfo?.installAddress;

                                    setTaxInvoiceDeliveryAddress({
                                        type: isSame ? 'same' : 'custom',
                                        label: newValue.label,
                                        address: newValue.address,
                                        googleMapLink: newValue.googleMapLink,
                                        distance: newValue.distance
                                    });
                                } else {
                                    setTaxInvoiceDeliveryAddress({
                                        type: '',
                                        label: '',
                                        address: '',
                                        googleMapLink: '',
                                        distance: ''
                                    });
                                }
                            }}
                            addressClassName="text-xs"
                            placeholder="ค้นหาที่อยู่..."
                            onAddNew={onAddNewAddress}
                        />
                    </div>

                    {/* Contact Selector - Delivery - Always Visible */}
                    <div className="bg-secondary-50 p-3 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md">
                        <label className="block text-xs font-medium text-secondary-500 mb-1">ผู้ติดต่อรับเอกสาร</label>
                        {!receiverContact ? (
                            <ContactSelector
                                label={null}
                                contacts={customer.contacts || []}
                                value={receiverContact}
                                onChange={setReceiverContact}
                                variant="seamless"
                                placeholder="ค้นหาผู้ติดต่อ..."
                                onAddNew={() => onAddNewContact('receiverContact')}
                            />
                        ) : (
                            <ContactDisplayCard
                                contact={receiverContact}
                                onClick={() => setReceiverContact(null)}
                            />
                        )}
                    </div>

                </div>

            </Card>
        </div>
    );
}
