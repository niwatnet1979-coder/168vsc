import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useSession } from 'next-auth/react'
import AppLayout from '../components/AppLayout'
import {
    Settings,
    Store,
    Users,
    Database,
    Save,
    RefreshCw,
    Trash2,
    Shield,
    Bell,
    Globe,
    List,
    Plus,
    X,
    LayoutGrid,
    Palette,
    ToggleLeft,
    Lightbulb,
    Package,
    Briefcase,
    CreditCard

} from 'lucide-react'

import TeamMemberModal from '../components/TeamMemberModal'

export default function SettingsPage() {
    const { data: session } = useSession()
    const [activeTab, setActiveTab] = useState('general')
    const [users, setUsers] = useState([])
    const [shopSettings, setShopSettings] = useState({
        name: '168 อินทีเรีย ไลท์ติ้ง',
        address: '168/166 หมู่ 1 หมู่บ้านเซนโทร พหล-วิภาวดี2 ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120',
        phone: '084-282-9465',
        email: 'contact@168lighting.com',
        taxId: '0135566027619',
        vatRegistered: true,
        vatRate: 7
    })
    const [isSaved, setIsSaved] = useState(false)

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [editingMember, setEditingMember] = useState(null)
    const [formData, setFormData] = useState(null)

    // Product Options State
    const [productOptions, setProductOptions] = useState({
        lightColors: ['warm', 'cool', 'white', '3แสง'],
        remotes: ['ไม่มีรีโมท', 'หรี่แสงปรับสี', 'หรี่แสง', 'เปิดปิด'],
        bulbTypes: ['E14', 'E27', 'G9', 'GU9', 'ไฟเส้น', 'LED Module'],
        productTypes: [],
        materials: ['สแตนเลส', 'เหล็ก', 'อะคริลิก', 'พลาสติก', 'ไม้'],
        materialColors: ['ทอง', 'โรสโกลด์', 'พิ้งค์โกลด์', 'เงิน', 'ดำ'],
        crystalColors: ['ทอง', 'โรสโกลด์', 'พิ้งค์โกลด์', 'เงิน', 'ดำ'],
        // Employee Options
        teamNames: ['ทีมช่างกี', 'ทีมQC', 'ทีมSALE', 'ทีมบริหาร'],
        teamTypes: ['QC', 'SALE', 'บริหาร'],
        jobPositions: ['พนักงาน', 'บริหาร'],
        jobLevels: ['Executive', 'Director', 'Manager', 'Leader', 'Senior', 'Staff'],
        employmentTypes: ['พนักงานประจำ', 'พนักงานชั่วคราว'],
        paymentTypes: ['รายวัน', 'รายเดือน', 'เหมาจ่าย'],
        wageRates: ['500', '10000'],
        commissionRates: ['0%', '0.3%']
    })
    const [newOption, setNewOption] = useState('')
    const [activeOptionType, setActiveOptionType] = useState(null) // 'lightColors', 'remotes', 'bulbTypes'

    const defaultProductTypes = [
        'XX ไม่ระบุ',
        'AA โคมไฟระย้า',
        'AC โคมไฟโถงสูง',
        'AB โคมไฟแขวนโต้ะทานข้าว',
        'LP โคมไฟเดี่ยว',
        'MM โคมไฟโมเดิ้ล',
        'WL โคมไฟกริ่ง',
        'IN โคมไฟเพดาล',
        'RM รีโมท',
        'GI ของขวัญ',
        'DV Driver',
        'LM หลอดไฟ',
        'K9 คริสตัล'
    ]

    const optionTypes = [
        { id: 'lightColors', label: 'สีแสงไฟ (Light Colors)' },
        { id: 'remotes', label: 'รีโมท (Remotes)' },
        { id: 'bulbTypes', label: 'ขั้วหลอดไฟ (Bulb Types)' },
        { id: 'productTypes', label: 'ประเภทสินค้า (Product Types)' },
        { id: 'materials', label: 'วัสดุ (Materials)' },
        { id: 'materialColors', label: 'สีวัสดุ (Material Colors)' },
        { id: 'crystalColors', label: 'สีคริสตัล (Crystal Colors)' },
        // Employee Options
        { id: 'teamNames', label: 'ชื่อทีม (Team Names)' },
        { id: 'teamTypes', label: 'ประเภททีม (Team Types)' },
        { id: 'jobPositions', label: 'ตำแหน่งงาน (Job Positions)' },
        { id: 'jobLevels', label: 'ระดับงาน (Job Levels)' },
        { id: 'employmentTypes', label: 'ประเภทการจ้างงาน (Employment Types)' },
        { id: 'paymentTypes', label: 'รูปแบบการจ่ายเงิน (Payment Types)' },
        { id: 'wageRates', label: 'อัตราค่าจ้าง (Wage Rates)' },
        { id: 'commissionRates', label: 'อัตราค่าคอมมิชชั่น (Commission Rates)' }
    ]

    // Load settings and users
    useEffect(() => {
        const savedSettings = localStorage.getItem('shop_settings')
        if (savedSettings) {
            setShopSettings(JSON.parse(savedSettings))
        }

        // Load product options
        const savedOptions = localStorage.getItem('product_options_data')
        if (savedOptions) {
            try {
                const parsedOptions = JSON.parse(savedOptions)
                // Ensure all keys exist (merge with defaults if missing)
                setProductOptions(prev => ({
                    ...prev,
                    ...parsedOptions,
                    // If productTypes is missing in saved data, use default
                    productTypes: (parsedOptions.productTypes && parsedOptions.productTypes.length > 0)
                        ? parsedOptions.productTypes
                        : defaultProductTypes,
                    // Ensure new fields exist if loading from old data
                    materials: parsedOptions.materials || prev.materials,
                    materialColors: parsedOptions.materialColors || prev.materialColors,
                    crystalColors: parsedOptions.crystalColors || prev.crystalColors,
                    // Employee Options Fallback
                    teamNames: parsedOptions.teamNames || prev.teamNames,
                    teamTypes: parsedOptions.teamTypes || prev.teamTypes,
                    jobPositions: parsedOptions.jobPositions || prev.jobPositions,
                    jobLevels: parsedOptions.jobLevels || prev.jobLevels,
                    employmentTypes: parsedOptions.employmentTypes || prev.employmentTypes,
                    paymentTypes: parsedOptions.paymentTypes || prev.paymentTypes,
                    wageRates: parsedOptions.wageRates || prev.wageRates,
                    commissionRates: parsedOptions.commissionRates || prev.commissionRates
                }))
            } catch (e) {
                console.error('Error parsing product options:', e)
                // Fallback to defaults including productTypes
                setProductOptions(prev => ({ ...prev, productTypes: defaultProductTypes }))
            }
        } else {
            // First time load, set productTypes to defaults
            setProductOptions(prev => ({ ...prev, productTypes: defaultProductTypes }))
        }
    }, [])

    const handleSave = () => {
        localStorage.setItem('shop_settings', JSON.stringify(shopSettings))
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 3000)
    }

    const handleAddOption = (type) => {
        if (!newOption.trim()) return
        const updatedOptions = {
            ...productOptions,
            [type]: [...productOptions[type], newOption.trim()]
        }
        setProductOptions(updatedOptions)
        localStorage.setItem('product_options_data', JSON.stringify(updatedOptions))
        setNewOption('')
        setActiveOptionType(null)
    }

    const handleDeleteOption = (type, index) => {
        if (confirm('ต้องการลบตัวเลือกนี้ใช่หรือไม่?')) {
            const updatedList = productOptions[type].filter((_, i) => i !== index)
            const updatedOptions = { ...productOptions, [type]: updatedList }
            setProductOptions(updatedOptions)
            localStorage.setItem('product_options_data', JSON.stringify(updatedOptions))
        }
    }

    return (
        <AppLayout>
            <Head>
                <title>ตั้งค่าระบบ (Settings) - 168VSC System</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-secondary-900 flex items-center gap-3">
                            <Settings className="text-primary-600" size={32} />
                            ตั้งค่าระบบ (Settings)
                        </h1>
                        <p className="text-secondary-500 mt-1">จัดการข้อมูลร้านค้าและการตั้งค่าทั่วไป</p>
                    </div>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium shadow-lg shadow-primary-500/30"
                    >
                        <Save size={18} />
                        {isSaved ? 'บันทึกแล้ว!' : 'บันทึกการตั้งค่า'}
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar Tabs */}
                    <div className="w-full lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                            <nav className="flex flex-col p-2 gap-1">
                                {[
                                    { id: 'general', label: 'ข้อมูลร้านค้า', icon: Store },
                                    { id: 'system', label: 'การตั้งค่าระบบ', icon: Globe },
                                    { id: 'options', label: 'ประเภทข้อมูล', icon: List },
                                    { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                            ? tab.danger
                                                ? 'bg-danger-50 text-danger-700'
                                                : 'bg-primary-50 text-primary-700'
                                            : 'text-secondary-600 hover:bg-secondary-50'
                                            }`}
                                    >
                                        <tab.icon size={18} />
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1">
                        <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6 min-h-[500px]">
                            {activeTab === 'general' && (
                                <div className="space-y-6">
                                    <div className="border-b border-secondary-200 pb-4">
                                        <h2 className="text-xl font-bold text-secondary-900">ข้อมูลร้านค้า</h2>
                                        <p className="text-secondary-500 text-sm mt-1">ข้อมูลนี้จะถูกนำไปแสดงในใบเสนอราคาและใบเสร็จรับเงิน</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-secondary-700 mb-1">ชื่อร้าน / บริษัท</label>
                                            <input
                                                type="text"
                                                value={shopSettings.name}
                                                onChange={e => setShopSettings({ ...shopSettings, name: e.target.value })}
                                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-secondary-700 mb-1">ที่อยู่</label>
                                            <textarea
                                                rows="3"
                                                value={shopSettings.address}
                                                onChange={e => setShopSettings({ ...shopSettings, address: e.target.value })}
                                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1">เบอร์โทรศัพท์</label>
                                            <input
                                                type="text"
                                                value={shopSettings.phone}
                                                onChange={e => setShopSettings({ ...shopSettings, phone: e.target.value })}
                                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1">อีเมล</label>
                                            <input
                                                type="email"
                                                value={shopSettings.email}
                                                onChange={e => setShopSettings({ ...shopSettings, email: e.target.value })}
                                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1">เลขประจำตัวผู้เสียภาษี</label>
                                            <input
                                                type="text"
                                                value={shopSettings.taxId}
                                                onChange={e => setShopSettings({ ...shopSettings, taxId: e.target.value })}
                                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}



                            {activeTab === 'system' && (
                                <div className="space-y-6">
                                    <div className="border-b border-secondary-200 pb-4">
                                        <h2 className="text-xl font-bold text-secondary-900">การตั้งค่าระบบ</h2>
                                        <p className="text-secondary-500 text-sm mt-1">ตั้งค่าภาษี สกุลเงิน และอื่นๆ</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <div className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg">
                                                <div>
                                                    <h3 className="font-medium text-secondary-900">จดทะเบียนภาษีมูลค่าเพิ่ม (VAT)</h3>
                                                    <p className="text-sm text-secondary-500">เปิดใช้งานหากร้านค้าของคุณจดทะเบียน VAT</p>
                                                </div>
                                                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                                    <input
                                                        type="checkbox"
                                                        name="vatRegistered"
                                                        id="vatRegistered"
                                                        checked={shopSettings.vatRegistered}
                                                        onChange={e => setShopSettings({ ...shopSettings, vatRegistered: e.target.checked })}
                                                        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                        style={{ right: shopSettings.vatRegistered ? '0' : 'auto', left: shopSettings.vatRegistered ? 'auto' : '0' }}
                                                    />
                                                    <label
                                                        htmlFor="vatRegistered"
                                                        className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${shopSettings.vatRegistered ? 'bg-primary-500' : 'bg-secondary-300'}`}
                                                    ></label>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-secondary-700 mb-1">อัตราภาษีมูลค่าเพิ่ม (%)</label>
                                            <input
                                                type="number"
                                                value={shopSettings.vatRate}
                                                onChange={e => setShopSettings({ ...shopSettings, vatRate: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}


                            {activeTab === 'options' && (
                                <div className="space-y-6">
                                    <div className="border-b border-secondary-200 pb-4">
                                        <h2 className="text-xl font-bold text-secondary-900">ประเภทข้อมูลสินค้า</h2>
                                        <p className="text-secondary-500 text-sm mt-1">จัดการตัวเลือกต่างๆ ของสินค้า (สีแสงไฟ, รีโมท, หลอดไฟ)</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {optionTypes.map((type) => (
                                            <div key={type.id} className="bg-white border border-secondary-200 rounded-xl overflow-hidden shadow-sm">
                                                <div className="p-4 bg-secondary-50 border-b border-secondary-200 flex justify-between items-center">
                                                    <h3 className="font-bold text-secondary-900">{type.label}</h3>
                                                    <button
                                                        onClick={() => setActiveOptionType(activeOptionType === type.id ? null : type.id)}
                                                        className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                    >
                                                        <Plus size={18} />
                                                    </button>
                                                </div>
                                                {activeOptionType === type.id && (
                                                    <div className="p-2 bg-primary-50 border-b border-primary-100 flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={newOption}
                                                            onChange={(e) => setNewOption(e.target.value)}
                                                            placeholder="เพิ่มตัวเลือก..."
                                                            className="flex-1 px-3 py-1.5 text-sm border border-secondary-300 rounded focus:ring-1 focus:ring-primary-500"
                                                            autoFocus
                                                            onKeyDown={(e) => e.key === 'Enter' && handleAddOption(type.id)}
                                                        />
                                                        <button
                                                            onClick={() => handleAddOption(type.id)}
                                                            className="px-3 py-1.5 bg-primary-600 text-white text-xs rounded hover:bg-primary-700"
                                                        >
                                                            เพิ่ม
                                                        </button>
                                                    </div>
                                                )}
                                                <ul className="divide-y divide-secondary-100 max-h-[300px] overflow-y-auto">
                                                    {productOptions[type.id]?.map((opt, idx) => (
                                                        <li key={idx} className="p-3 flex justify-between items-center hover:bg-secondary-50 group">
                                                            <span className="text-sm text-secondary-700">{opt}</span>
                                                            <button
                                                                onClick={() => handleDeleteOption(type.id, idx)}
                                                                className="text-secondary-400 hover:text-danger-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </AppLayout >
    )
}
