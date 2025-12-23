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
    CreditCard,
    Bug,
    Monitor
} from 'lucide-react'

import TeamMemberModal from '../components/TeamMemberModal'
import { DataManager } from '../lib/dataManager'
import { useDebug } from '../contexts/DebugContext'
import { SHOP_LAT, SHOP_LON } from '../lib/utils' // Import defaults

export default function SettingsPage() {
    const { data: session } = useSession()
    const { isMouseDebugEnabled, toggleMouseDebug } = useDebug()
    const [activeTab, setActiveTab] = useState('general')
    const [users, setUsers] = useState([])
    const [shopSettings, setShopSettings] = useState({
        name: '168 อินทีเรีย ไลท์ติ้ง',
        address: '168/166 หมู่ 1 หมู่บ้านเซนโทร พหล-วิภาวดี2 ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120',
        shopLat: SHOP_LAT.toString(),
        shopLon: SHOP_LON.toString(),
        phone: '084-282-9465',
        email: 'contact@168lighting.com',
        taxId: '0135566027619',
        vatRegistered: true,
        vatRate: 7,
        promptpayQr: '',
        quotationDefaultTerms: '',
        quotationWarrantyPolicy: ''
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
        const loadSettings = async () => {
            // Load from Supabase
            const settings = await DataManager.getSettings()

            if (!settings) {
                console.error('Failed to load settings from DB. Check console for DataManager error.')
                // Optional: alert('ไม่สามารถโหลดการตั้งค่าจากฐานข้อมูลได้ ระบบจะใช้ค่าเริ่มต้น')
            }

            if (settings) {
                // Use Supabase data
                setShopSettings({
                    name: settings.shopName,
                    address: settings.shopAddress,
                    phone: settings.shopPhone,
                    email: settings.shopEmail,
                    taxId: settings.shopTaxId,
                    vatRegistered: settings.vatRegistered,
                    vatRate: settings.vatRate,
                    vatRegistered: settings.vatRegistered,
                    vatRate: settings.vatRate,
                    promptpayQr: settings.promptpayQr || '',
                    shopLat: settings.systemOptions?.shopLat || SHOP_LAT.toString(),
                    shopLon: settings.systemOptions?.shopLon || SHOP_LON.toString(),
                    quotationDefaultTerms: settings.quotationDefaultTerms || '',
                    quotationWarrantyPolicy: settings.quotationWarrantyPolicy || ''
                })

                setShowModal(false) // Init modal state

                // Merge product options with defaults
                // Also extract shopLat/Lon if they exist in systemOptions
                const loadedOptions = settings.systemOptions || {}

                setProductOptions(prev => ({
                    ...prev,
                    ...loadedOptions,
                    productTypes: (loadedOptions.productTypes && loadedOptions.productTypes.length > 0)
                        ? loadedOptions.productTypes
                        : defaultProductTypes
                }))
            } else {
                // Fallback to localStorage for migration
                const savedSettings = localStorage.getItem('shop_settings')
                if (savedSettings) {
                    const parsed = JSON.parse(savedSettings)
                    setShopSettings(prev => ({ ...prev, ...parsed }))
                }

                const savedOptions = localStorage.getItem('product_options_data')
                if (savedOptions) {
                    try {
                        const parsedOptions = JSON.parse(savedOptions)
                        setProductOptions(prev => ({
                            ...prev,
                            ...parsedOptions,
                            productTypes: (parsedOptions.productTypes && parsedOptions.productTypes.length > 0)
                                ? parsedOptions.productTypes
                                : defaultProductTypes
                        }))

                        // Auto-migrate to Supabase
                        await DataManager.saveSettings({
                            shopName: shopSettings.name,
                            shopAddress: shopSettings.address,
                            shopPhone: shopSettings.phone,
                            shopEmail: shopSettings.email,
                            shopTaxId: shopSettings.taxId,
                            vatRegistered: shopSettings.vatRegistered,
                            vatRate: shopSettings.vatRate,
                            promptpayQr: shopSettings.promptpayQr,
                            systemOptions: parsedOptions
                        })
                        console.log('Migrated localStorage data to Supabase')
                    } catch (e) {
                        console.error('Error parsing product options:', e)
                        setProductOptions(prev => ({ ...prev, productTypes: defaultProductTypes }))
                    }
                } else {
                    setProductOptions(prev => ({ ...prev, productTypes: defaultProductTypes }))
                }
            }
        }

        loadSettings()
    }, [])

    const handleSave = async () => {
        // Merge shopLat/shopLon into systemOptions for storage
        const systemOptionsToSave = {
            ...productOptions,
            shopLat: shopSettings.shopLat,
            shopLon: shopSettings.shopLon
        }

        const success = await DataManager.saveSettings({
            shopName: shopSettings.name,
            shopAddress: shopSettings.address,
            shopPhone: shopSettings.phone,
            shopEmail: shopSettings.email,
            shopTaxId: shopSettings.taxId,
            vatRegistered: shopSettings.vatRegistered,
            vatRate: shopSettings.vatRate,
            promptpayQr: shopSettings.promptpayQr,
            systemOptions: systemOptionsToSave,
            quotationDefaultTerms: shopSettings.quotationDefaultTerms,
            quotationWarrantyPolicy: shopSettings.quotationWarrantyPolicy
        })

        console.log('Save Settings Result:', success)

        if (success) {
            setIsSaved(true)
            setTimeout(() => setIsSaved(false), 3000)
            alert('บันทึกข้อมูลเรียบร้อย')
        } else {
            alert('เกิดข้อผิดพลาดในการบันทึก')
        }
    }

    const handleAddOption = async (type) => {
        if (!newOption.trim()) return
        const updatedOptions = {
            ...productOptions,
            [type]: [...productOptions[type], newOption.trim()]
        }
        setProductOptions(updatedOptions)
        await DataManager.saveProductOptions(updatedOptions)
        setNewOption('')
        setActiveOptionType(null)
    }

    const handleDeleteOption = async (type, index) => {
        if (confirm('ต้องการลบตัวเลือกนี้ใช่หรือไม่?')) {
            const updatedList = productOptions[type].filter((_, i) => i !== index)
            const updatedOptions = { ...productOptions, [type]: updatedList }
            setProductOptions(updatedOptions)
            await DataManager.saveProductOptions(updatedOptions)
        }
    }

    const handleUploadQR = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            const result = await DataManager.uploadShopAsset(file)
            if (result.success) {
                setShopSettings(prev => ({ ...prev, promptpayQr: result.url }))
            } else {
                alert(`อัพโหลดไม่สำเร็จ: ${result.error}`)
            }
        } catch (err) {
            console.error(err)
            alert('เกิดข้อผิดพลาดในการอัพโหลด')
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
                                    { id: 'general', label: 'ข้อมูลร้านค้า (Shop Info)', icon: Store },
                                    { id: 'system', label: 'การตั้งค่าระบบ (App)', icon: Globe },
                                    { id: 'options', label: 'ประเภทข้อมูล', icon: List },
                                    { id: 'notifications', label: 'การแจ้งเตือน', icon: Bell },
                                    { id: 'debug', label: 'Debug Mode', icon: Bug }
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
                                        <div className="grid grid-cols-2 gap-4 md:col-span-2">
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-1">พิกัดละติจูด (Latitude)</label>
                                                <input
                                                    type="text"
                                                    value={shopSettings.shopLat}
                                                    onChange={e => setShopSettings({ ...shopSettings, shopLat: e.target.value })}
                                                    placeholder="เช่น 13.9647757"
                                                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-1">พิกัดลองจิจูด (Longitude)</label>
                                                <input
                                                    type="text"
                                                    value={shopSettings.shopLon}
                                                    onChange={e => setShopSettings({ ...shopSettings, shopLon: e.target.value })}
                                                    placeholder="เช่น 100.6203268"
                                                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                />
                                                <a
                                                    href="https://www.google.com/maps"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary-600 hover:underline mt-1 inline-block"
                                                >
                                                    เปิด Google Maps เพื่อหาพิกัด
                                                </a>
                                            </div>
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

                                        {/* Financial & Tax Settings - Moved from System */}
                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-secondary-700 mb-1">เลขประจำตัวผู้เสียภาษี</label>
                                            <input
                                                type="text"
                                                value={shopSettings.taxId}
                                                onChange={e => setShopSettings({ ...shopSettings, taxId: e.target.value })}
                                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-sm font-medium text-secondary-700 mb-1">อัตราภาษีมูลค่าเพิ่ม (%)</label>
                                            <input
                                                type="number"
                                                value={shopSettings.vatRate}
                                                onChange={e => setShopSettings({ ...shopSettings, vatRate: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <div className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg bg-secondary-50">
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

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-secondary-700 mb-1">QR Code รับเงิน (PromptPay)</label>
                                            <div className="flex items-center gap-6 p-4 border border-secondary-200 rounded-lg bg-secondary-50">
                                                {shopSettings.promptpayQr ? (
                                                    <div className="relative group">
                                                        <img
                                                            src={shopSettings.promptpayQr}
                                                            alt="PromptPay QR"
                                                            className="w-32 h-32 object-contain border border-white shadow-sm rounded-lg bg-white"
                                                        />
                                                        <button
                                                            onClick={() => setShopSettings({ ...shopSettings, promptpayQr: '' })}
                                                            className="absolute -top-2 -right-2 bg-danger-500 text-white rounded-full p-1 shadow-md hover:bg-danger-600 transition-transform hover:scale-110"
                                                            title="ลบรูปภาพ"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="w-32 h-32 border-2 border-dashed border-secondary-300 rounded-lg flex items-center justify-center bg-white text-secondary-400">
                                                        <div className="text-center">
                                                            <CreditCard className="mx-auto mb-1 opacity-50" size={24} />
                                                            <span className="text-xs">ไม่มีรูปภาพ</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleUploadQR}
                                                        className="block w-full text-sm text-secondary-500
                                                            file:mr-4 file:py-2.5 file:px-4
                                                            file:rounded-lg file:border-0
                                                            file:text-sm file:font-semibold
                                                            file:bg-primary-600 file:text-white
                                                            hover:file:bg-primary-700
                                                            cursor-pointer file:cursor-pointer"
                                                    />
                                                    <p className="text-xs text-secondary-500 mt-2">
                                                        อัพโหลดรูปภาพ QR Code สำหรับรับชำระเงิน (.jpg, .png)
                                                        <br />รูปภาพนี้จะถูกแสดงในหน้าแจ้งชำระเงินของลูกค้า
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-secondary-200 pt-6 mt-6">
                                        <h3 className="text-lg font-bold text-secondary-900 mb-4">เอกสารและใบเสนอราคา</h3>

                                        <div className="grid grid-cols-1 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-1">เงื่อนไขการเสนอราคา (Default Terms)</label>
                                                <textarea
                                                    rows="4"
                                                    value={shopSettings.quotationDefaultTerms}
                                                    onChange={e => setShopSettings({ ...shopSettings, quotationDefaultTerms: e.target.value })}
                                                    placeholder="ระบุเงื่อนไขการมัดจำ การส่งสินค้า ฯลฯ"
                                                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-secondary-700 mb-1">การรับประกัน (Warranty Policy)</label>
                                                <textarea
                                                    rows="4"
                                                    value={shopSettings.quotationWarrantyPolicy}
                                                    onChange={e => setShopSettings({ ...shopSettings, quotationWarrantyPolicy: e.target.value })}
                                                    placeholder="ระบุรายละเอียดการรับประกันสินค้า"
                                                    className="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'system' && (
                                <div className="space-y-6">
                                    <div className="border-b border-secondary-200 pb-4">
                                        <h2 className="text-xl font-bold text-secondary-900">การตั้งค่าระบบ</h2>
                                        <p className="text-secondary-500 text-sm mt-1">ตั้งค่าการแสดงผลและธีมของระบบ (ในอนาคต)</p>
                                    </div>

                                    <div className="flex flex-col items-center justify-center py-12 text-secondary-400">
                                        <Monitor size={48} className="mb-4 opacity-20" />
                                        <h3 className="text-lg font-medium mb-1">ส่วนนี้สำหรับการตั้งค่า App</h3>
                                        <p className="text-sm">เช่น ธีม, ขนาดตัวอักษร ฯลฯ (Coming Soon)</p>
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

                            {activeTab === 'debug' && (
                                <div className="space-y-6">
                                    <div className="border-b border-secondary-200 pb-4">
                                        <h2 className="text-xl font-bold text-secondary-900">Debug Mode (สำหรับนักพัฒนา)</h2>
                                        <p className="text-secondary-500 text-sm mt-1">เครื่องมือตรวจสอบข้อมูลและสถานะของระบบ</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg">
                                            <div>
                                                <h3 className="font-medium text-secondary-900 flex items-center gap-2">
                                                    <Bug size={18} className="text-warning-500" />
                                                    Mouse Debug Mode
                                                </h3>
                                                <p className="text-sm text-secondary-500">แสดงแหล่งที่มาของข้อมูล (Snapshot / Realtime) เมื่อเอาเมาส์ไปวาง</p>
                                            </div>
                                            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                                <input
                                                    type="checkbox"
                                                    name="mouseDebug"
                                                    id="mouseDebug"
                                                    checked={isMouseDebugEnabled}
                                                    onChange={e => toggleMouseDebug(e.target.checked)}
                                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                                                    style={{ right: isMouseDebugEnabled ? '0' : 'auto', left: isMouseDebugEnabled ? 'auto' : '0' }}
                                                />
                                                <label
                                                    htmlFor="mouseDebug"
                                                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${isMouseDebugEnabled ? 'bg-warning-500' : 'bg-secondary-300'}`}
                                                ></label>
                                            </div>
                                        </div>
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
