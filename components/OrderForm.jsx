import React, { useState, useEffect, useRef } from 'react'

function currency(n) {
    return n.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })
}

// Shop Coordinates
const SHOP_LAT = 13.9647757
const SHOP_LON = 100.6203268

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c // Distance in km
    return d.toFixed(2)
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

function extractCoordinates(url) {
    if (!url) return null
    // Try to match @lat,lon
    const match = url.match(/@([-0-9.]+),([-0-9.]+)/)
    if (match) {
        return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) }
    }
    // Try to match q=lat,lon
    const matchQ = url.match(/q=([-0-9.]+),([-0-9.]+)/)
    if (matchQ) {
        return { lat: parseFloat(matchQ[1]), lon: parseFloat(matchQ[2]) }
    }
    return null
}

export default function OrderForm() {
    // Initial State
    const [customer, setCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        contact1: { name: '', phone: '' },
        contact2: { name: '', phone: '' }
    })

    // Tax Invoice Data (separate from customer)
    const [taxInvoice, setTaxInvoice] = useState({
        companyName: '',
        branch: '',
        taxId: '',
        address: '',
        phone: '',
        email: '',
        deliveryAddress: ''
    })

    // Mock saved tax invoice profiles
    const [savedTaxProfiles, setSavedTaxProfiles] = useState([
        {
            companyName: 'บริษัท ตัวอย่าง จำกัด',
            branch: 'สำนักงานใหญ่',
            taxId: '0123456789012',
            address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
            phone: '02-123-4567',
            email: 'tax@example.com',
            deliveryAddress: 'ส่งตามที่อยู่บริษัท'
        }
    ])
    const [showTaxDropdown, setShowTaxDropdown] = useState(false)
    const taxDropdownRef = useRef(null)

    const [jobInfo, setJobInfo] = useState({
        jobType: 'installation',
        orderDate: new Date().toISOString().split('T')[0],
        appointmentDate: '',
        installAddress: '',
        googleMapLink: '',
        team: ''
    })

    const [savedAddresses, setSavedAddresses] = useState([
        { address: 'สำนักงานใหญ่ (Head Office)', googleMapLink: 'https://maps.google.com/?q=13.7563,100.5018' },
        { address: 'สาขา 1 (Branch 1)', googleMapLink: '' },
        { address: 'คลังสินค้า (Warehouse)', googleMapLink: '' }
    ])
    const [showAddressDropdown, setShowAddressDropdown] = useState(false)
    const addressDropdownRef = useRef(null)

    // Teams Data
    const [teams, setTeams] = useState(['ช่าง A', 'ช่าง B', 'ทีมติดตั้ง 1'])
    const [showTeamDropdown, setShowTeamDropdown] = useState(false)
    const teamDropdownRef = useRef(null)

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (addressDropdownRef.current && !addressDropdownRef.current.contains(event.target)) {
                setShowAddressDropdown(false)
            }
            if (taxDropdownRef.current && !taxDropdownRef.current.contains(event.target)) {
                setShowTaxDropdown(false)
            }
            if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target)) {
                setShowTeamDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const [items, setItems] = useState([
        {
            image: null,
            code: '',
            type: '',
            length: '',
            width: '',
            height: '',
            material: '',
            color: '',
            crystalColor: '',
            bulbType: '',
            light: '',
            remote: '',
            remark: '',
            qty: 1,
            unitPrice: 0
        }
    ])

    const [discount, setDiscount] = useState({ mode: 'percent', value: 0 })
    const [vatRate, setVatRate] = useState(0.07)
    const [deposit, setDeposit] = useState({ mode: 'percent', value: 50 })
    const [shippingFee, setShippingFee] = useState(0)
    const [note, setNote] = useState('')

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0)

    let discountAmount = 0
    if (discount.mode === 'percent') {
        discountAmount = subtotal * (discount.value / 100)
    } else {
        discountAmount = discount.value
    }

    const afterDiscount = Math.max(0, subtotal - discountAmount)
    const subtotalWithShipping = afterDiscount + shippingFee
    const vatAmount = subtotalWithShipping * vatRate
    const total = subtotalWithShipping + vatAmount

    let depositAmount = 0
    if (deposit.mode === 'percent') {
        depositAmount = total * (deposit.value / 100)
    } else {
        depositAmount = deposit.value
    }

    const outstanding = Math.max(0, total - depositAmount)

    // Distance Calculation
    const [distance, setDistance] = useState(null)

    useEffect(() => {
        const coords = extractCoordinates(jobInfo.googleMapLink)
        if (coords) {
            const dist = calculateDistance(SHOP_LAT, SHOP_LON, coords.lat, coords.lon)
            setDistance(dist)
        } else {
            setDistance(null)
        }
    }, [jobInfo.googleMapLink])

    // Handlers
    const handleCustomerChange = (field, value, parent = null) => {
        if (parent) {
            setCustomer(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [field]: value }
            }))
        } else {
            setCustomer(prev => ({ ...prev, [field]: value }))
        }
    }

    const handleTaxInvoiceChange = (field, value) => {
        setTaxInvoice(prev => ({ ...prev, [field]: value }))
    }

    const handleItemChange = (index, field, value) => {
        const newItems = [...items]
        newItems[index][field] = value
        setItems(newItems)
    }

    const handleImageChange = (index, e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                handleItemChange(index, 'image', reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeImage = (index) => {
        handleItemChange(index, 'image', null)
    }

    const addItem = () => {
        setItems([...items, {
            image: null,
            code: '',
            type: '',
            length: '',
            width: '',
            height: '',
            material: '',
            color: '',
            crystalColor: '',
            bulbType: '',
            light: '',
            remote: '',
            remark: '',
            qty: 1,
            unitPrice: 0
        }])
    }

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index))
        }
    }

    const handleSaveAddress = () => {
        const isDuplicate = savedAddresses.some(item => item.address === jobInfo.installAddress)
        if (jobInfo.installAddress && !isDuplicate) {
            setSavedAddresses([...savedAddresses, { address: jobInfo.installAddress, googleMapLink: jobInfo.googleMapLink }])
            setShowAddressDropdown(false)
        }
    }

    const handleSelectTaxProfile = (profile) => {
        setTaxInvoice(profile)
        setShowTaxDropdown(false)
    }

    const handleSaveTaxProfile = () => {
        const isDuplicate = savedTaxProfiles.some(
            p => p.companyName === taxInvoice.companyName && p.taxId === taxInvoice.taxId
        )
        if (!isDuplicate && taxInvoice.companyName && taxInvoice.taxId) {
            setSavedTaxProfiles([...savedTaxProfiles, { ...taxInvoice }])
            setShowTaxDropdown(false)
        }
    }

    const handleAddTeam = () => {
        if (jobInfo.team && !teams.includes(jobInfo.team)) {
            setTeams([...teams, jobInfo.team])
            setShowTeamDropdown(false)
        }
    }

    const handleDeleteTeam = (teamToDelete, e) => {
        e.stopPropagation()
        setTeams(teams.filter(t => t !== teamToDelete))
        if (jobInfo.team === teamToDelete) {
            setJobInfo({ ...jobInfo, team: '' })
        }
    }

    return (
        <div className="order-page">
            <header className="page-header">
                <div>
                    <h1>บันทึกข้อมูลสั่งซื้อ (Purchase Order Entry)</h1>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={{ fontSize: 14, color: '#4a5568' }}>วันที่สั่งซื้อ:</label>
                        <input
                            type="date"
                            value={jobInfo.orderDate}
                            onChange={e => setJobInfo({ ...jobInfo, orderDate: e.target.value })}
                            style={{ padding: '4px 8px' }}
                        />
                    </div>
                </div>
                <div className="actions">
                    <button className="btn-secondary" onClick={() => window.history.back()}>ย้อนกลับ</button>
                    <button className="btn-primary" onClick={() => alert('บันทึกข้อมูลเรียบร้อย (Mockup)')}>บันทึกข้อมูล</button>
                </div>
            </header>

            <div className="top-layout">
                {/* 1. Customer Section */}
                <div className="section-card customer-section">
                    <h2>ข้อมูลลูกค้า (Customer)</h2>
                    <div className="form-grid two-col">
                        <div className="form-group full-width">
                            <label>ชื่อลูกค้า / บริษัท</label>
                            <input
                                type="text"
                                value={customer.name}
                                onChange={e => handleCustomerChange('name', e.target.value)}
                                placeholder="ระบุชื่อลูกค้า หรือ บริษัท"
                            />
                        </div>
                        <div className="form-group">
                            <label>เบอร์โทรศัพท์</label>
                            <input
                                type="text"
                                value={customer.phone}
                                onChange={e => handleCustomerChange('phone', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>อีเมล / LINE</label>
                            <input
                                type="text"
                                value={customer.email}
                                onChange={e => handleCustomerChange('email', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="sub-section">
                        <h3 className="sub-header">ผู้ติดต่อ (Contacts)</h3>
                        <div className="form-grid two-col">
                            <div className="form-group">
                                <label>ผู้ติดต่อ 1</label>
                                <input
                                    type="text"
                                    value={customer.contact1.name}
                                    onChange={e => handleCustomerChange('name', e.target.value, 'contact1')}
                                    placeholder="ชื่อ"
                                />
                            </div>
                            <div className="form-group">
                                <label>เบอร์โทร</label>
                                <input
                                    type="text"
                                    value={customer.contact1.phone}
                                    onChange={e => handleCustomerChange('phone', e.target.value, 'contact1')}
                                />
                            </div>
                            <div className="form-group">
                                <label>ผู้ติดต่อ 2</label>
                                <input
                                    type="text"
                                    value={customer.contact2.name}
                                    onChange={e => handleCustomerChange('name', e.target.value, 'contact2')}
                                    placeholder="ชื่อ"
                                />
                            </div>
                            <div className="form-group">
                                <label>เบอร์โทร</label>
                                <input
                                    type="text"
                                    value={customer.contact2.phone}
                                    onChange={e => handleCustomerChange('phone', e.target.value, 'contact2')}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Tax Invoice Section */}
                <div className="section-card tax-section" ref={taxDropdownRef}>
                    <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        ข้อมูลใบกำกับภาษี (Tax Invoice)
                        <button
                            type="button"
                            className="btn-dropdown-toggle-header"
                            onClick={() => setShowTaxDropdown(!showTaxDropdown)}
                        >
                            เลือกชุดข้อมูล ▼
                        </button>
                    </h2>

                    {showTaxDropdown && (
                        <div className="dropdown-menu-absolute">
                            {savedTaxProfiles.map((profile, i) => (
                                <div
                                    key={i}
                                    className="dropdown-item"
                                    onClick={() => handleSelectTaxProfile(profile)}
                                >
                                    <strong>{profile.companyName}</strong><br />
                                    <small>เลขที่: {profile.taxId}</small>
                                </div>
                            ))}
                            {taxInvoice.companyName && taxInvoice.taxId && !savedTaxProfiles.some(
                                p => p.companyName === taxInvoice.companyName && p.taxId === taxInvoice.taxId
                            ) && (
                                    <div
                                        className="dropdown-item add-new"
                                        onClick={handleSaveTaxProfile}
                                    >
                                        + บันทึกชุดข้อมูลปัจจุบัน
                                    </div>
                                )}
                        </div>
                    )}

                    <div className="form-grid two-col">
                        <div className="form-group full-width">
                            <label>ชื่อบริษัท</label>
                            <input
                                type="text"
                                value={taxInvoice.companyName}
                                onChange={e => handleTaxInvoiceChange('companyName', e.target.value)}
                                placeholder="ชื่อบริษัทสำหรับออกใบกำกับภาษี"
                            />
                        </div>
                        <div className="form-group">
                            <label>สาขา</label>
                            <input
                                type="text"
                                value={taxInvoice.branch}
                                onChange={e => handleTaxInvoiceChange('branch', e.target.value)}
                                placeholder="สำนักงานใหญ่ / สาขา"
                            />
                        </div>
                        <div className="form-group">
                            <label>เลขที่ผู้เสียภาษี</label>
                            <input
                                type="text"
                                value={taxInvoice.taxId}
                                onChange={e => handleTaxInvoiceChange('taxId', e.target.value)}
                                placeholder="13 หลัก"
                            />
                        </div>
                        <div className="form-group full-width">
                            <label>ที่อยู่</label>
                            <textarea
                                rows={2}
                                value={taxInvoice.address}
                                onChange={e => handleTaxInvoiceChange('address', e.target.value)}
                                placeholder="ที่อยู่สำหรับออกใบกำกับภาษี"
                            />
                        </div>
                        <div className="form-group">
                            <label>เบอร์โทรศัพท์</label>
                            <input
                                type="text"
                                value={taxInvoice.phone}
                                onChange={e => handleTaxInvoiceChange('phone', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>อีเมล</label>
                            <input
                                type="text"
                                value={taxInvoice.email}
                                onChange={e => handleTaxInvoiceChange('email', e.target.value)}
                            />
                        </div>
                        <div className="form-group full-width">
                            <label>ที่อยู่จัดส่งใบกำกับภาษี</label>
                            <input
                                type="text"
                                value={taxInvoice.deliveryAddress}
                                onChange={e => handleTaxInvoiceChange('deliveryAddress', e.target.value)}
                                placeholder="ถ้าต่างจากที่อยู่บริษัท"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Job Section */}
                <div className="section-card job-section">
                    <h2>ข้อมูลงานหลัก(Master Job)</h2>
                    <div className="form-grid one-col">
                        <div className="form-group">
                            <label>ประเภทงาน</label>
                            <select
                                value={jobInfo.jobType}
                                onChange={e => setJobInfo({ ...jobInfo, jobType: e.target.value })}
                            >
                                <option value="installation">งานติดตั้ง (Installation)</option>
                                <option value="delivery">จัดส่งสินค้า (Delivery)</option>
                            </select>
                        </div>

                        {/* Team Dropdown */}
                        <div className="form-group" ref={teamDropdownRef} style={{ position: 'relative' }}>
                            <label>ทีม (Team)</label>
                            <div className="address-combobox">
                                <input
                                    type="text"
                                    value={jobInfo.team}
                                    onChange={e => setJobInfo({ ...jobInfo, team: e.target.value })}
                                    placeholder="ระบุหรือเลือกทีม..."
                                    className="address-input"
                                    onFocus={() => setShowTeamDropdown(true)}
                                />
                                <button
                                    type="button"
                                    className="btn-dropdown-toggle"
                                    onClick={() => setShowTeamDropdown(!showTeamDropdown)}
                                >
                                    ▼
                                </button>

                                {showTeamDropdown && (
                                    <div className="dropdown-menu">
                                        {teams.map((team, i) => (
                                            <div
                                                key={i}
                                                className="dropdown-item"
                                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                onClick={() => {
                                                    setJobInfo({ ...jobInfo, team: team })
                                                    setShowTeamDropdown(false)
                                                }}
                                            >
                                                <span>{team}</span>
                                                <button
                                                    className="btn-icon-delete"
                                                    style={{ fontSize: 12, padding: '0 4px', color: '#e53e3e', border: 'none', background: 'none', cursor: 'pointer' }}
                                                    onClick={(e) => handleDeleteTeam(team, e)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                        {jobInfo.team && !teams.includes(jobInfo.team) && (
                                            <div
                                                className="dropdown-item add-new"
                                                onClick={handleAddTeam}
                                            >
                                                + เพิ่ม "{jobInfo.team}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>วันที่นัดหมาย</label>
                            <input
                                type="date"
                                value={jobInfo.appointmentDate}
                                onChange={e => setJobInfo({ ...jobInfo, appointmentDate: e.target.value })}
                            />
                        </div>

                        {/* Address Combobox */}
                        <div className="form-group" style={{ marginTop: 8 }} ref={addressDropdownRef}>
                            <label>สถานที่ติดตั้ง / จัดส่ง</label>
                            <div className="address-combobox">
                                <textarea
                                    rows={2}
                                    value={jobInfo.installAddress}
                                    onChange={e => setJobInfo({ ...jobInfo, installAddress: e.target.value })}
                                    placeholder="ระบุสถานที่..."
                                    className="address-input"
                                />
                                <button
                                    type="button"
                                    className="btn-dropdown-toggle"
                                    onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                                >
                                    ▼
                                </button>

                                {showAddressDropdown && (
                                    <div className="dropdown-menu">
                                        {savedAddresses.map((item, i) => (
                                            <div
                                                key={i}
                                                className="dropdown-item"
                                                onClick={() => {
                                                    setJobInfo({ ...jobInfo, installAddress: item.address, googleMapLink: item.googleMapLink })
                                                    setShowAddressDropdown(false)
                                                }}
                                            >
                                                <strong>{item.address}</strong>
                                                {item.googleMapLink && <><br /><small style={{ color: '#0070f3' }}>📍 มีลิงก์แผนที่</small></>}
                                            </div>
                                        ))}
                                        {jobInfo.installAddress && !savedAddresses.some(item => item.address === jobInfo.installAddress) && (
                                            <div
                                                className="dropdown-item add-new"
                                                onClick={handleSaveAddress}
                                            >
                                                + เพิ่ม &quot;{jobInfo.installAddress}&quot; ลงในรายการ
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Google Maps Link */}
                            <div style={{ marginTop: 8 }}>
                                <label>
                                    Google Maps Link
                                    {distance && <span style={{ marginLeft: 8, color: '#0070f3', fontSize: 12 }}>({distance} km)</span>}
                                </label>
                                <input
                                    type="text"
                                    value={jobInfo.googleMapLink}
                                    onChange={e => setJobInfo({ ...jobInfo, googleMapLink: e.target.value })}
                                    placeholder="https://maps.google.com/..."
                                />
                                {jobInfo.googleMapLink && (
                                    <a
                                        href={jobInfo.googleMapLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ fontSize: 12, color: '#0070f3', marginTop: 4, display: 'inline-block' }}
                                    >
                                        🗺️ เปิดแผนที่
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Summary & Note Section */}
                <div className="section-card summary-section">
                    <h2>สรุปยอด (Summary)</h2>
                    <div className="totals-wrapper">
                        <div className="total-row">
                            <span>รวมเป็นเงิน</span>
                            <span>{currency(subtotal)}</span>
                        </div>
                        <div className="total-row">
                            <span>ค่าเดินทาง/จัดส่ง</span>
                            <input
                                type="number"
                                min={0}
                                value={shippingFee}
                                onChange={e => setShippingFee(Number(e.target.value))}
                                style={{ width: 100, textAlign: 'right', padding: '2px 4px', border: '1px solid #e2e8f0', borderRadius: 4 }}
                            />
                        </div>
                        <div className="total-row">
                            <div className="discount-control">
                                <span>ส่วนลด</span>
                                <select
                                    value={discount.mode}
                                    onChange={e => setDiscount({ ...discount, mode: e.target.value })}
                                >
                                    <option value="percent">%</option>
                                    <option value="amount">฿</option>
                                </select>
                                <input
                                    type="number"
                                    value={discount.value}
                                    onChange={e => setDiscount({ ...discount, value: Number(e.target.value) })}
                                />
                            </div>
                            <span className="text-red">-{currency(discountAmount)}</span>
                        </div>
                        <div className="total-row">
                            <span>หลังหักส่วนลด</span>
                            <span>{currency(afterDiscount)}</span>
                        </div>
                        <div className="total-row">
                            <span>VAT 7%</span>
                            <span>{currency(vatAmount)}</span>
                        </div>
                        <div className="total-row grand-total">
                            <span>ยอดรวมทั้งสิ้น</span>
                            <span>{currency(total)}</span>
                        </div>

                        <div className="divider"></div>

                        <div className="total-row">
                            <div className="discount-control">
                                <span>มัดจำ</span>
                                <select
                                    value={deposit.mode}
                                    onChange={e => setDeposit({ ...deposit, mode: e.target.value })}
                                >
                                    <option value="percent">%</option>
                                    <option value="amount">฿</option>
                                </select>
                                <input
                                    type="number"
                                    value={deposit.value}
                                    onChange={e => setDeposit({ ...deposit, value: Number(e.target.value) })}
                                />
                            </div>
                            <span>{currency(depositAmount)}</span>
                        </div>
                        <div className="total-row outstanding">
                            <span>ยอดคงค้าง</span>
                            <span>{currency(outstanding)}</span>
                        </div>
                    </div>

                    <div className="note-wrapper" style={{ marginTop: 16 }}>
                        <label style={{ fontWeight: 600, display: 'block', marginBottom: 4 }}>หมายเหตุ (Note)</label>
                        <textarea
                            rows={3}
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="ระบุหมายเหตุ..."
                            style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>
            </div>

            {/* 5. Items Section (Full Width Bottom) */}
            <div className="section-card items-section-full">
                <h2>รายการสินค้า (Order Items)</h2>
                <div className="items-table-container">
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th style={{ width: 40 }}>#</th>
                                <th style={{ width: 80 }}>รูปภาพ</th>
                                <th style={{ minWidth: 100 }}>รหัสสินค้า</th>
                                <th className="th-equal">ประเภทโคมไฟ</th>
                                <th className="th-equal">ยาว</th>
                                <th className="th-equal">กว้าง</th>
                                <th className="th-equal">สูง</th>
                                <th className="th-equal">วัสดุ</th>
                                <th className="th-equal">สีโครงสร้าง</th>
                                <th className="th-equal">สีคริสตัล</th>
                                <th className="th-equal">หลอดไฟแบบ</th>
                                <th className="th-equal">แสงไฟ</th>
                                <th className="th-equal">รีโมท</th>
                                <th style={{ width: '20%', minWidth: 200 }}>รายละเอียด</th>
                                <th style={{ width: 60 }}>จำนวน</th>
                                <th style={{ width: 90 }}>ราคา/หน่วย</th>
                                <th style={{ width: 90 }}>รวม</th>
                                <th style={{ width: 40 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="text-center">{idx + 1}</td>
                                    <td className="text-center">
                                        <div className="image-cell">
                                            {item.image ? (
                                                <div className="image-preview">
                                                    <img src={item.image} alt="Product" />
                                                    <button className="btn-remove-image" onClick={() => removeImage(idx)}>×</button>
                                                </div>
                                            ) : (
                                                <label className="btn-add-image">
                                                    +
                                                    <input type="file" accept="image/*" onChange={(e) => handleImageChange(idx, e)} style={{ display: 'none' }} />
                                                </label>
                                            )}
                                        </div>
                                    </td>
                                    <td><input type="text" className="input-grid" value={item.code} onChange={e => handleItemChange(idx, 'code', e.target.value)} /></td>
                                    <td><input type="text" className="input-grid" value={item.type} onChange={e => handleItemChange(idx, 'type', e.target.value)} /></td>
                                    <td><input type="text" className="input-grid" value={item.length} onChange={e => handleItemChange(idx, 'length', e.target.value)} /></td>
                                    <td><input type="text" className="input-grid" value={item.width} onChange={e => handleItemChange(idx, 'width', e.target.value)} /></td>
                                    <td><input type="text" className="input-grid" value={item.height} onChange={e => handleItemChange(idx, 'height', e.target.value)} /></td>
                                    <td><input type="text" className="input-grid" value={item.material} onChange={e => handleItemChange(idx, 'material', e.target.value)} /></td>
                                    <td><input type="text" className="input-grid" value={item.color} onChange={e => handleItemChange(idx, 'color', e.target.value)} /></td>
                                    <td><input type="text" className="input-grid" value={item.crystalColor} onChange={e => handleItemChange(idx, 'crystalColor', e.target.value)} /></td>
                                    <td><input type="text" className="input-grid" value={item.bulbType} onChange={e => handleItemChange(idx, 'bulbType', e.target.value)} /></td>
                                    <td><input type="text" className="input-grid" value={item.light} onChange={e => handleItemChange(idx, 'light', e.target.value)} /></td>
                                    <td><input type="text" className="input-grid" value={item.remote} onChange={e => handleItemChange(idx, 'remote', e.target.value)} /></td>
                                    <td><input type="text" className="input-grid" value={item.remark} onChange={e => handleItemChange(idx, 'remark', e.target.value)} placeholder="รายละเอียด" /></td>
                                    <td><input type="number" className="input-grid text-right" min={1} value={item.qty} onChange={e => handleItemChange(idx, 'qty', Number(e.target.value))} /></td>
                                    <td><input type="number" className="input-grid text-right" min={0} value={item.unitPrice} onChange={e => handleItemChange(idx, 'unitPrice', Number(e.target.value))} /></td>
                                    <td className="text-right">{currency(item.qty * item.unitPrice)}</td>
                                    <td className="text-center"><button className="btn-icon-delete" onClick={() => removeItem(idx)} tabIndex={-1}>×</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button className="btn-add-item" onClick={addItem}>+ เพิ่มรายการ</button>
                </div>
            </div>

            <style jsx>{`
        .order-page {
          min-height: 100vh;
          background: #f5f7fa;
          padding: 24px;
          font-family: 'Sarabun', sans-serif;
          box-sizing: border-box;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          background: #fff;
          padding: 12px 24px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .page-header h1 { margin: 0; font-size: 20px; color: #1a202c; }
        .actions { display: flex; gap: 12px; }
        .btn-primary { background: #0070f3; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
        .btn-secondary { background: #fff; color: #666; border: 1px solid #ddd; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }

        /* Top Layout Grid - Updated to 4 columns */
        .top-layout {
          display: grid;
          grid-template-columns: 1.3fr 1.5fr 1fr 1.2fr; /* Customer : Tax : Job : Summary */
          gap: 16px;
          margin-bottom: 16px;
          align-items: start;
        }

        .section-card {
          background: #fff;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          height: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          position: relative;
        }
        
        h2 { margin: 0 0 16px 0; font-size: 16px; color: #2d3748; border-bottom: 2px solid #edf2f7; padding-bottom: 8px; }
        .sub-header { margin: 12px 0 8px 0; font-size: 14px; color: #4a5568; font-weight: 600; }

        .form-grid { display: grid; gap: 12px; }
        .form-grid.two-col { grid-template-columns: 1fr 1fr; }
        .form-grid.one-col { grid-template-columns: 1fr; }
        .full-width { grid-column: 1 / -1; }

        .form-group { display: flex; flex-direction: column; gap: 4px; }
        label { font-size: 12px; font-weight: 500; color: #4a5568; }
        input, select, textarea { padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 13px; font-family: inherit; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #0070f3; }

        /* Tax Invoice Dropdown */
        .btn-dropdown-toggle-header {
          background: #0070f3;
          color: white;
          border: none;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
        }
        .btn-dropdown-toggle-header:hover { background: #0051cc; }
        
        .dropdown-menu-absolute {
          position: absolute;
          top: 50px;
          right: 16px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          z-index: 100;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          max-height: 300px;
          overflow-y: auto;
          min-width: 280px;
        }

        /* Address Combobox */
        .address-combobox {
          position: relative;
          display: flex;
        }
        .address-input {
          flex: 1;
          border-radius: 4px 0 0 4px;
          resize: vertical;
        }
        .btn-dropdown-toggle {
          width: 30px;
          border: 1px solid #e2e8f0;
          border-left: none;
          background: #f7fafc;
          border-radius: 0 4px 4px 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4a5568;
        }
        .btn-dropdown-toggle:hover { background: #edf2f7; }
        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          margin-top: 4px;
          z-index: 10;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          max-height: 200px;
          overflow-y: auto;
        }
        .dropdown-item {
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid #f7fafc;
          font-size: 13px;
          color: #2d3748;
        }
        .dropdown-item:hover { background: #f7fafc; }
        .dropdown-item.add-new {
          color: #0070f3;
          font-weight: 500;
          border-top: 1px solid #e2e8f0;
        }
        .dropdown-item strong { display: block; margin-bottom: 2px; }
        .dropdown-item small { color: #718096; }

        /* Summary Section */
        .totals-wrapper { font-size: 13px; }
        .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .grand-total { font-size: 16px; font-weight: 700; color: #1a202c; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px; }
        .outstanding { font-size: 14px; font-weight: 700; color: #c53030; }
        .divider { height: 1px; background: #e2e8f0; margin: 12px 0; }
        .discount-control { display: flex; align-items: center; gap: 4px; }
        .discount-control select { width: 50px; padding: 2px; }
        .discount-control input { width: 70px; padding: 2px 4px; text-align: right; }
        .text-red { color: #e53e3e; }

        /* Items Section */
        .items-section-full {
            width: 100%;
            overflow-x: auto;
        }
        .items-table { width: 100%; border-collapse: collapse; min-width: 1400px; }
        .items-table th { background: #f7fafc; padding: 8px; font-size: 12px; font-weight: 600; color: #4a5568; text-align: left; border-bottom: 2px solid #edf2f7; }
        .items-table th.th-equal { width: 6%; }
        .items-table td { padding: 6px; border-bottom: 1px solid #edf2f7; vertical-align: top; }
        .input-grid { width: 100%; padding: 4px; border: 1px solid transparent; background: transparent; font-size: 13px; }
        .input-grid:hover { border-color: #e2e8f0; background: #fff; }
        .input-grid:focus { border-color: #0070f3; background: #fff; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .btn-icon-delete { background: none; border: none; color: #e53e3e; font-size: 16px; cursor: pointer; }
        .btn-add-item { width: 100%; padding: 8px; background: #f7fafc; border: 1px dashed #cbd5e0; color: #4a5568; border-radius: 6px; cursor: pointer; margin-top: 8px; font-size: 13px; }
        .btn-add-item:hover { background: #edf2f7; }

        /* Image Cell Styles */
        .image-cell {
          width: 75px;
          height: 75px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f7fafc;
          border: 1px solid #edf2f7;
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }
        .btn-add-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #cbd5e0;
          font-size: 24px;
        }
        .btn-add-image:hover { color: #a0aec0; background: #edf2f7; }
        .image-preview {
          width: 100%;
          height: 100%;
          position: relative;
        }
        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .btn-remove-image {
          position: absolute;
          top: 0;
          right: 0;
          background: rgba(0,0,0,0.5);
          color: white;
          border: none;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
        }
        .btn-remove-image:hover { background: rgba(229, 62, 62, 0.8); }

        @media (max-width: 1400px) {
            .top-layout { grid-template-columns: 1fr 1fr; }
            .summary-section { grid-column: span 2; }
        }
        @media (max-width: 900px) {
            .top-layout { grid-template-columns: 1fr; }
            .summary-section { grid-column: auto; }
        }
      `}</style>
        </div>
    )
}
