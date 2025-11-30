import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'

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

// Mock Customers Data (Should be shared or fetched)
const MOCK_CUSTOMERS_DATA = [
    {
        id: 1,
        name: 'บริษัท เทคโนโลยี จำกัด',
        phone: '02-123-4567',
        email: 'info@techno.com',
        line: '@techno',
        facebook: 'TechnoCo',
        instagram: 'techno_official',
        contact1: { name: 'สมชาย ใจดี', phone: '081-234-5678' },
        taxInvoice: {
            companyName: 'บริษัท เทคโนโลยี จำกัด',
            taxId: '0123456789012',
            branch: 'สำนักงานใหญ่',
            address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110'
        }
    },
    {
        id: 2,
        name: 'ร้านค้าปลีก ABC',
        phone: '089-999-8888',
        email: 'contact@abcstore.com',
        line: 'abcstore',
        facebook: 'ABC Store',
        instagram: 'abc_store',
        contact1: { name: 'คุณเอ', phone: '089-999-8888' },
        taxInvoice: {
            companyName: 'ร้านค้าปลีก ABC',
            taxId: '1234567890123',
            branch: 'สาขาย่อย',
            address: '456 ถนนเพชรบุรี กรุงเทพฯ 10400'
        }
    },
    {
        id: 3,
        name: 'คุณวิชัย มั่งคั่ง',
        phone: '081-555-6666',
        email: 'wichai@email.com',
        line: 'wichai.m',
        facebook: 'Wichai M',
        instagram: 'wichai_m',
        contact1: { name: '-', phone: '-' },
        taxInvoice: {
            companyName: 'นายวิชัย มั่งคั่ง',
            taxId: '3210987654321',
            branch: '-',
            address: '789 ถนนลาดพร้าว กรุงเทพฯ 10900'
        }
    }
]

// Mock Products Data
const MOCK_PRODUCTS_DATA = [
    {
        id: 'CAM-001',
        name: 'กล้องวงจรปิด HD',
        type: 'กล้องวงจรปิด',
        length: '10', width: '10', height: '15',
        material: 'พลาสติก', color: 'ขาว', crystalColor: '-',
        bulbType: '-', light: 'Infrared', remote: 'App',
        price: 3500,
        description: 'ความละเอียด 1080p, กันน้ำ'
    },
    {
        id: 'LED-BULB-09',
        name: 'หลอดไฟ LED 9W',
        type: 'หลอดไฟ',
        length: '6', width: '6', height: '12',
        material: 'แก้ว/พลาสติก', color: 'ขาว', crystalColor: '-',
        bulbType: 'E27', light: 'Daylight', remote: '-',
        price: 150,
        description: 'แสง Daylight, ขั้ว E27'
    },
    {
        id: 'CHAN-001',
        name: 'โคมไฟระย้าคริสตัล',
        type: 'โคมไฟตกแต่ง',
        length: '80', width: '80', height: '120',
        material: 'คริสตัล/โลหะ', color: 'ทอง', crystalColor: 'ใส',
        bulbType: 'E14', light: 'Warm White', remote: 'มี',
        price: 15000,
        description: 'ขนาด 80cm, สีทอง'
    },
    {
        id: 'TRACK-BK',
        name: 'รางไฟ Track Light 1m',
        type: 'อุปกรณ์ติดตั้ง',
        length: '100', width: '4', height: '2',
        material: 'อลูมิเนียม', color: 'ดำ', crystalColor: '-',
        bulbType: '-', light: '-', remote: '-',
        price: 450,
        description: 'สีดำ, อลูมิเนียม'
    },
    {
        id: 'STRIP-RGB',
        name: 'ไฟเส้น LED Strip RGB',
        type: 'ไฟเส้น',
        length: '500', width: '1', height: '0.2',
        material: 'PCB', color: 'ขาว', crystalColor: '-',
        bulbType: 'LED', light: 'RGB', remote: 'มี',
        price: 850,
        description: 'ม้วนละ 5 เมตร, พร้อมรีโมท'
    }
]

export default function OrderForm() {
    const router = useRouter()

    // Load Customers from LocalStorage
    const [customersData, setCustomersData] = useState([])

    // Load Products from LocalStorage
    const [productsData, setProductsData] = useState([])

    useEffect(() => {
        const savedData = localStorage.getItem('customers_data')
        if (savedData) {
            setCustomersData(JSON.parse(savedData))
        } else {
            // Fallback to mock data if no saved data
            setCustomersData(MOCK_CUSTOMERS_DATA)
        }

        // Load products
        const savedProducts = localStorage.getItem('products_data')
        if (savedProducts) {
            setProductsData(JSON.parse(savedProducts))
        } else {
            // Fallback to mock data
            setProductsData(MOCK_PRODUCTS_DATA)
        }
    }, [])

    // Load existing order for editing
    useEffect(() => {
        if (router.query.id) {
            const savedOrders = localStorage.getItem('orders_data')
            if (savedOrders) {
                const orders = JSON.parse(savedOrders)
                const orderToEdit = orders.find(o => o.id === router.query.id)

                if (orderToEdit) {
                    // Populate form with existing data
                    if (orderToEdit.customerDetails) setCustomer(orderToEdit.customerDetails)
                    if (orderToEdit.taxInvoice) setTaxInvoice(orderToEdit.taxInvoice)
                    if (orderToEdit.jobInfo) setJobInfo(orderToEdit.jobInfo)

                    // Load items correctly
                    if (orderToEdit.storedItems && Array.isArray(orderToEdit.storedItems)) {
                        setItems(orderToEdit.storedItems)
                    } else if (orderToEdit.items && Array.isArray(orderToEdit.items)) {
                        setItems(orderToEdit.items)
                    }

                    // Set other states
                    if (orderToEdit.discount) setDiscount(orderToEdit.discount)
                    if (orderToEdit.vat) setVat(orderToEdit.vat)
                    if (orderToEdit.deposit) setDeposit(orderToEdit.deposit)
                    if (orderToEdit.shippingFee) setShippingFee(orderToEdit.shippingFee)
                }
            }
        }
    }, [router.query.id])

    // Save Order Function
    const handleSaveOrder = () => {
        // Validation
        if (!customer.name) {
            alert('กรุณากรอกชื่อลูกค้า')
            return
        }
        if (items.length === 0 || !items[0].code) {
            alert('กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ')
            return
        }

        // Load existing orders
        const savedOrders = localStorage.getItem('orders_data')
        let orders = savedOrders ? JSON.parse(savedOrders) : []

        let newOrderId = ''

        if (router.query.id) {
            // Update existing order
            newOrderId = router.query.id
        } else {
            // Generate new Order ID
            newOrderId = orders.length > 0
                ? `ORD-${String(Math.max(...orders.map(o => parseInt(o.id.split('-')[1]))) + 1).padStart(3, '0')}`
                : 'ORD-001'
        }

        // Create new order object
        const newOrder = {
            id: newOrderId,
            date: jobInfo.orderDate,
            customer: customer.name,
            items: items.length,
            total: total,
            deposit: depositAmount,
            status: 'Pending',
            jobType: jobInfo.jobType === 'installation' ? 'ติดตั้ง' :
                jobInfo.jobType === 'delivery' ? 'ส่งของ' :
                    jobInfo.jobType === 'maintenance' ? 'ซ่อมบำรุง' : 'อื่นๆ',
            // Full details
            storedItems: items, // Save actual items array
            customerDetails: customer,
            taxInvoice: taxInvoice,
            jobInfo: jobInfo,
            items: items,
            discount: discount,
            shippingFee: shippingFee,
            note: note,
            createdAt: new Date().toISOString()
        }

        // Add to orders array
        if (router.query.id) {
            const index = orders.findIndex(o => o.id === router.query.id)
            if (index !== -1) {
                orders[index] = newOrder
            } else {
                orders.push(newOrder)
            }
        } else {
            orders.push(newOrder)
        }

        // Save to LocalStorage
        localStorage.setItem('orders_data', JSON.stringify(orders))

        alert(`บันทึกข้อมูลเรียบร้อย\nเลขที่ออเดอร์: ${newOrderId}`)

        // Redirect to orders list
        router.push('/orders')
    }

    // Initial State
    const [customer, setCustomer] = useState({
        name: '',
        phone: '',
        email: '',
        line: '',
        facebook: '',
        instagram: '',
        contact1: { name: '', phone: '' },
        contact2: { name: '', phone: '' },
        mediaSource: '',
        mediaSourceOther: ''
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

    // Saved tax invoice profiles (will be populated when customer is selected)
    const [savedTaxProfiles, setSavedTaxProfiles] = useState([])
    const [showTaxDropdown, setShowTaxDropdown] = useState(false)
    const taxDropdownRef = useRef(null)

    const [jobInfo, setJobInfo] = useState({
        jobType: 'installation',
        orderDate: new Date().toISOString().split('T')[0],
        appointmentDate: '',
        installAddress: '',
        googleMapLink: '',
        team: '',
        inspector1: { name: '', phone: '' },
        inspector2: { name: '', phone: '' }
    })

    // Saved addresses (will be populated when customer is selected)
    const [savedAddresses, setSavedAddresses] = useState([])
    const [showAddressDropdown, setShowAddressDropdown] = useState(false)
    const addressDropdownRef = useRef(null)

    // Teams Data
    const [teams, setTeams] = useState(['ช่าง A', 'ช่าง B', 'ทีมติดตั้ง 1'])
    const [showTeamDropdown, setShowTeamDropdown] = useState(false)
    const teamDropdownRef = useRef(null)

    // Inspectors Data - stored by customer name
    const [savedInspectors, setSavedInspectors] = useState({})
    const [showInspector1Dropdown, setShowInspector1Dropdown] = useState(false)
    const [showInspector2Dropdown, setShowInspector2Dropdown] = useState(false)
    const inspector1DropdownRef = useRef(null)
    const inspector2DropdownRef = useRef(null)

    // Modal Inspector Dropdowns
    const [modalShowInspector1Dropdown, setModalShowInspector1Dropdown] = useState(false)
    const [modalShowInspector2Dropdown, setModalShowInspector2Dropdown] = useState(false)
    const modalInspector1DropdownRef = useRef(null)
    const modalInspector2DropdownRef = useRef(null)

    // Customer Dropdown Logic
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
    const customerDropdownRef = useRef(null)

    // Product Dropdown Logic
    const [activeProductDropdownIndex, setActiveProductDropdownIndex] = useState(null)
    const [activeProductNameDropdownIndex, setActiveProductNameDropdownIndex] = useState(null)
    const productDropdownRef = useRef(null)
    const productNameDropdownRef = useRef(null)

    // Filter customers based on input (using LocalStorage data)
    const filteredCustomers = customersData.filter(c =>
        c.name.toLowerCase().includes(customer.name.toLowerCase()) ||
        (c.phone && c.phone.includes(customer.name))
    )

    // Filter products based on input (dynamic based on active row)
    const getFilteredProducts = (searchTerm) => {
        if (!searchTerm) return productsData
        return productsData.filter(p =>
            p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }

    const handleSelectCustomer = (selectedCustomer) => {
        setCustomer({
            ...customer,
            name: selectedCustomer.name,
            phone: selectedCustomer.phone,
            email: selectedCustomer.email || '',
            line: selectedCustomer.line || '',
            facebook: selectedCustomer.facebook || '',
            instagram: selectedCustomer.instagram || '',
            contact1: selectedCustomer.contact1 || { name: '', phone: '' },
            contact2: selectedCustomer.contact2 || { name: '', phone: '' }
        })

        // Auto-fill Tax Invoice if available (use first one from array)
        if (selectedCustomer.taxInvoices && selectedCustomer.taxInvoices.length > 0) {
            const firstTaxInvoice = selectedCustomer.taxInvoices[0]
            setTaxInvoice({
                companyName: firstTaxInvoice.companyName || '',
                taxId: firstTaxInvoice.taxId || '',
                branch: firstTaxInvoice.branch || '',
                address: firstTaxInvoice.address || '',
                phone: firstTaxInvoice.phone || '',
                email: firstTaxInvoice.email || '',
                deliveryAddress: firstTaxInvoice.deliveryAddress || ''
            })

            // Update saved tax profiles dropdown with all customer's tax invoices
            setSavedTaxProfiles(selectedCustomer.taxInvoices)
        } else if (selectedCustomer.taxInvoice) {
            // Fallback for old mock data structure
            setTaxInvoice({
                ...taxInvoice,
                companyName: selectedCustomer.taxInvoice.companyName,
                taxId: selectedCustomer.taxInvoice.taxId,
                branch: selectedCustomer.taxInvoice.branch,
                address: selectedCustomer.taxInvoice.address
            })
        }

        // Update saved addresses dropdown with customer's saved addresses
        if (selectedCustomer.savedAddresses && selectedCustomer.savedAddresses.length > 0) {
            const formattedAddresses = selectedCustomer.savedAddresses.map(addr => ({
                address: `${addr.name} - ${addr.address}`,
                googleMapLink: addr.mapLink || ''
            }))
            setSavedAddresses(formattedAddresses)

            // Auto-fill first address if available
            if (selectedCustomer.savedAddresses[0]) {
                setJobInfo(prev => ({
                    ...prev,
                    installAddress: selectedCustomer.savedAddresses[0].address,
                    googleMapLink: selectedCustomer.savedAddresses[0].mapLink || '',
                    inspector1: {
                        name: selectedCustomer.savedAddresses[0].inspector1 || '',
                        phone: selectedCustomer.savedAddresses[0].inspector1Phone || ''
                    },
                    inspector2: {
                        name: selectedCustomer.savedAddresses[0].inspector2 || '',
                        phone: selectedCustomer.savedAddresses[0].inspector2Phone || ''
                    }
                }))
            }
        }

        setShowCustomerDropdown(false)
    }

    // Modal State
    const [activeItemIndex, setActiveItemIndex] = useState(null)
    const [showJobModal, setShowJobModal] = useState(false)
    const [modalJobDetails, setModalJobDetails] = useState({
        type: 'installation',
        team: '',
        dateTime: '',
        address: '',
        googleMapLink: '',
        inspector1: { name: '', phone: '' },
        inspector2: { name: '', phone: '' }
    })
    const [modalShowAddressDropdown, setModalShowAddressDropdown] = useState(false)
    const [modalShowTeamDropdown, setModalShowTeamDropdown] = useState(false)
    const modalAddressDropdownRef = useRef(null)
    const modalTeamDropdownRef = useRef(null)

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
            // Modal dropdowns
            if (modalAddressDropdownRef.current && !modalAddressDropdownRef.current.contains(event.target)) {
                setModalShowAddressDropdown(false)
            }
            if (modalTeamDropdownRef.current && !modalTeamDropdownRef.current.contains(event.target)) {
                setModalShowTeamDropdown(false)
            }
            // Inspector dropdowns
            if (inspector1DropdownRef.current && !inspector1DropdownRef.current.contains(event.target)) {
                setShowInspector1Dropdown(false)
            }
            if (inspector2DropdownRef.current && !inspector2DropdownRef.current.contains(event.target)) {
                setShowInspector2Dropdown(false)
            }
            // Modal Inspector dropdowns
            if (modalInspector1DropdownRef.current && !modalInspector1DropdownRef.current.contains(event.target)) {
                setModalShowInspector1Dropdown(false)
            }
            if (modalInspector2DropdownRef.current && !modalInspector2DropdownRef.current.contains(event.target)) {
                setModalShowInspector2Dropdown(false)
            }
            // Customer dropdown
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setShowCustomerDropdown(false)
            }
            // Product dropdown
            if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
                setActiveProductDropdownIndex(null)
            }
            if (productNameDropdownRef.current && !productNameDropdownRef.current.contains(event.target)) {
                setActiveProductNameDropdownIndex(null)
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
            name: '', // New field
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
            unitPrice: '',
            specificJob: null
        }
    ])

    const [discount, setDiscount] = useState({ mode: 'percent', value: '' })
    const [vatRate, setVatRate] = useState(0.07)
    const [deposit, setDeposit] = useState({ mode: 'percent', value: 50 })
    const [shippingFee, setShippingFee] = useState('')
    const [note, setNote] = useState('')


    // Product Search Logic
    const [allProducts, setAllProducts] = useState([]);
    const [activeSearchIndex, setActiveSearchIndex] = useState(null);
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        // Load products for search
        const savedProducts = localStorage.getItem('products_data_v2');
        if (savedProducts) {
            setAllProducts(JSON.parse(savedProducts));
        } else {
            // Fallback to mock if needed, or empty
            import('../products_data_v2.json').then(mod => {
                setAllProducts(mod.default || []);
            }).catch(err => console.error("Failed to load products", err));
        }
    }, []);

    const handleSearchProduct = (index, term) => {
        const newItems = [...items];
        newItems[index]._searchTerm = term;
        setItems(newItems);

        setActiveSearchIndex(index);

        if (term.trim().length > 0) {
            const lowerTerm = term.toLowerCase();
            const results = allProducts.filter(p =>
                p.id.toLowerCase().includes(lowerTerm) ||
                (p.category && p.category.toLowerCase().includes(lowerTerm))
            ).slice(0, 10); // Limit to 10 results
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };

    const selectProduct = (index, product) => {
        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            code: product.id,
            description: product.description || '',
            image: product.images && product.images[0] ? product.images[0] : null,
            price: product.price || 0,

            // Extra fields for display
            category: product.category,
            length: product.length,
            width: product.width,
            height: product.height,
            color: product.color,
            light: product.light,

            _searchTerm: '' // Clear search term
        };
        setItems(newItems);
        setActiveSearchIndex(null);
        setSearchResults([]);
    };

    const clearRowProduct = (index) => {
        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            code: '',
            description: '',
            image: null,
            price: 0,
            category: '',
            length: '',
            width: '',
            height: '',
            color: '',
            light: '',
            _searchTerm: ''
        };
        setItems(newItems);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.search-dropdown') && !e.target.closest('input[placeholder*="ค้นหา"]')) {
                setActiveSearchIndex(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unitPrice || 0)), 0)

    let discountAmount = 0
    if (discount.mode === 'percent') {
        discountAmount = subtotal * (Number(discount.value || 0) / 100)
    } else {
        discountAmount = Number(discount.value || 0)
    }

    const afterDiscount = Math.max(0, subtotal - discountAmount)
    const subtotalWithShipping = afterDiscount + Number(shippingFee || 0)
    const vatAmount = subtotalWithShipping * vatRate
    const total = subtotalWithShipping + vatAmount

    let depositAmount = 0
    if (deposit.mode === 'percent') {
        depositAmount = total * (Number(deposit.value || 0) / 100)
    } else {
        depositAmount = Number(deposit.value || 0)
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

    // Sync Master Job to Items
    useEffect(() => {
        if (jobInfo.jobType !== 'separate_job') {
            setItems(prevItems => {
                if (!Array.isArray(prevItems)) return [] // Safety check
                return prevItems.map(item => ({
                    ...item,
                    specificJob: {
                        type: jobInfo.jobType,
                        team: jobInfo.team,
                        dateTime: jobInfo.appointmentDate && jobInfo.appointmentTime ? `${jobInfo.appointmentDate} ${jobInfo.appointmentTime}` : '',
                        address: jobInfo.installAddress,
                        googleMapLink: jobInfo.googleMapLink,
                        inspector1: jobInfo.inspector1,
                        inspector2: jobInfo.inspector2
                    }
                }))
            })
        }
    }, [jobInfo])

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

    const handleSelectProduct = (index, product) => {
        const newItems = [...items]
        newItems[index] = {
            ...newItems[index],
            code: product.id,
            category: product.category || '',
            subcategory: product.subcategory || '',
            length: product.length || '',
            width: product.width || '',
            height: product.height || '',
            material: product.material || '',
            color: product.color || '',
            crystalColor: product.crystalColor || '',
            bulbType: product.bulbType || '',
            light: product.light || '',
            remote: product.remote || '',
            unitPrice: product.price,
            remark: product.description,
            image: product.image || ''
        }
        setItems(newItems)
        setActiveProductDropdownIndex(null)
        setActiveProductNameDropdownIndex(null)
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
            category: '',
            subcategory: '',
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
            note: '',
            qty: 1,
            unitPrice: 0,
            specificJob: null
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

    // Modal Handlers
    const openJobModal = (index) => {
        setActiveItemIndex(index)
        const currentJob = items[index].specificJob || {
            type: 'installation',
            team: '',
            dateTime: '',
            address: '',
            googleMapLink: ''
        }
        setModalJobDetails(currentJob)
        setShowJobModal(true)
    }

    const closeJobModal = () => {
        setShowJobModal(false)
        setActiveItemIndex(null)
    }

    const saveJobModal = () => {
        if (activeItemIndex !== null) {
            handleItemChange(activeItemIndex, 'specificJob', modalJobDetails)
        }
        closeJobModal()
    }

    const handleModalAddTeam = () => {
        if (modalJobDetails.team && !teams.includes(modalJobDetails.team)) {
            setTeams([...teams, modalJobDetails.team])
            setModalShowTeamDropdown(false)
        }
    }

    const handleModalSaveAddress = () => {
        const isDuplicate = savedAddresses.some(item => item.address === modalJobDetails.address)
        if (modalJobDetails.address && !isDuplicate) {
            setSavedAddresses([...savedAddresses, { address: modalJobDetails.address, googleMapLink: modalJobDetails.googleMapLink }])
            setModalShowAddressDropdown(false)
        }
    }

    return (
        <div className="order-page">
            <header className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <h1 style={{ margin: 0 }}>บันทึกข้อมูลสั่งซื้อ (Purchase Order Entry)</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={{ fontSize: 14, color: '#4a5568', whiteSpace: 'nowrap' }}>วันที่สั่งซื้อ:</label>
                        <input
                            type="date"
                            value={jobInfo.orderDate}
                            onChange={e => setJobInfo({ ...jobInfo, orderDate: e.target.value })}
                            style={{ padding: '4px 8px' }}
                        />
                    </div>
                </div>
                <div className="actions">
                    <button className="btn-icon" onClick={() => router.push('/')} title="กลับหน้าหลัก">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                    </button>
                    <button className="btn-back" onClick={() => router.back()}>← ย้อนกลับ</button>
                    <button className="btn-primary" onClick={handleSaveOrder}>บันทึกข้อมูล</button>
                </div>
            </header>

            <div className="top-layout">
                {/* 1. Customer Section */}
                <div className="section-card customer-section">
                    <h2>ข้อมูลลูกค้า (Customer)</h2>
                    <div className="form-grid two-col">
                        <div className="form-group full-width" style={{ position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <label>ชื่อลูกค้า / บริษัท</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <a href="/customers" target="_blank" style={{ fontSize: 12, color: '#0070f3', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span>👥</span> จัดการลูกค้า
                                    </a>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <div style={{ position: 'relative', flex: 1 }} ref={showCustomerDropdown ? customerDropdownRef : null}>
                                    <input
                                        type="text"
                                        value={customer.name}
                                        onChange={e => {
                                            handleCustomerChange('name', e.target.value)
                                            setShowCustomerDropdown(true)
                                        }}
                                        onFocus={() => setShowCustomerDropdown(true)}
                                        placeholder="ระบุชื่อลูกค้า หรือ บริษัท"
                                        style={{ width: '100%' }}
                                    />
                                    {showCustomerDropdown && (
                                        <div className="dropdown-menu-absolute">
                                            {filteredCustomers.length > 0 ? (
                                                filteredCustomers.map(c => (
                                                    <div
                                                        key={c.id}
                                                        className="dropdown-item"
                                                        onClick={() => handleSelectCustomer(c)}
                                                    >
                                                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                                                        <div style={{ fontSize: 12, color: '#718096' }}>{c.phone} | {c.email}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="dropdown-item" style={{ color: '#718096', fontStyle: 'italic' }}>
                                                    ไม่พบข้อมูลลูกค้า
                                                </div>
                                            )}
                                            <div className="divider" style={{ margin: '4px 0' }}></div>
                                            <a
                                                href="/customers"
                                                target="_blank"
                                                className="dropdown-item"
                                                style={{ color: '#0070f3', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
                                            >
                                                <span>+</span> เพิ่มลูกค้าใหม่
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
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
                            <label>อีเมล</label>
                            <input
                                type="email"
                                value={customer.email}
                                onChange={e => handleCustomerChange('email', e.target.value)}
                                placeholder="example@email.com"
                            />
                        </div>
                        <div className="form-group">
                            <label>LINE ID</label>
                            <input
                                type="text"
                                value={customer.line}
                                onChange={e => handleCustomerChange('line', e.target.value)}
                                placeholder="@lineid"
                            />
                        </div>
                        <div className="form-group">
                            <label>Facebook</label>
                            <input
                                type="text"
                                value={customer.facebook}
                                onChange={e => handleCustomerChange('facebook', e.target.value)}
                                placeholder="facebook.com/..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Instagram</label>
                            <input
                                type="text"
                                value={customer.instagram}
                                onChange={e => handleCustomerChange('instagram', e.target.value)}
                                placeholder="@instagram"
                            />
                        </div>
                        <div className="form-group">
                            <label>สื่อที่ลูกค้าเห็น</label>
                            <select
                                value={customer.mediaSource}
                                onChange={e => handleCustomerChange('mediaSource', e.target.value)}
                            >
                                <option value="">-- เลือกสื่อ --</option>
                                <option value="Facebook">Facebook</option>
                                <option value="Line@">Line@</option>
                                <option value="Google">Google</option>
                                <option value="เพื่อนแนะนำ">เพื่อนแนะนำ</option>
                                <option value="อื่นๆระบุ">อื่นๆระบุ</option>
                            </select>
                        </div>
                        {customer.mediaSource === 'อื่นๆระบุ' && (
                            <div className="form-group">
                                <label>ระบุสื่ออื่นๆ</label>
                                <input
                                    type="text"
                                    value={customer.mediaSourceOther}
                                    onChange={e => handleCustomerChange('mediaSourceOther', e.target.value)}
                                    placeholder="โปรดระบุ..."
                                />
                            </div>
                        )}
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
                            {savedTaxProfiles.length > 0 ? (
                                <>
                                    {savedTaxProfiles.map((profile, i) => (
                                        <div
                                            key={i}
                                            className="dropdown-item"
                                            onClick={() => handleSelectTaxProfile(profile)}
                                        >
                                            <strong>{profile.companyName}</strong><br />
                                            <small>เลขที่: {profile.taxId || '-'}</small>
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
                                </>
                            ) : (
                                <div className="dropdown-item" style={{ color: '#94a3b8', cursor: 'default' }}>
                                    ไม่มีข้อมูลใบกำกับภาษีที่บันทึกไว้
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
                                <option value="delivery">งานจัดส่ง (Delivery)</option>
                                <option value="separate_job">Jobงานแยก (Separate Job)</option>
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
                            <label>วัน-เวลาที่นัดหมาย</label>
                            <input
                                type="datetime-local"
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
                                        {savedAddresses.length > 0 ? (
                                            <>
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
                                            </>
                                        ) : (
                                            <div className="dropdown-item" style={{ color: '#94a3b8', cursor: 'default' }}>
                                                ไม่มีที่อยู่ที่บันทึกไว้
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

                            {/* Inspector 1 */}
                            <div style={{ marginTop: 12 }}>
                                <label>ผู้ตรวจงาน 1</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                                    <input
                                        type="text"
                                        value={jobInfo.inspector1.name}
                                        onChange={e => setJobInfo({ ...jobInfo, inspector1: { ...jobInfo.inspector1, name: e.target.value } })}
                                        placeholder="ชื่อผู้ตรวจงาน"
                                    />
                                    <input
                                        type="text"
                                        value={jobInfo.inspector1.phone}
                                        onChange={e => setJobInfo({ ...jobInfo, inspector1: { ...jobInfo.inspector1, phone: e.target.value } })}
                                        placeholder="เบอร์โทร"
                                    />
                                </div>
                            </div>

                            {/* Inspector 2 */}
                            <div style={{ marginTop: 12 }}>
                                <label>ผู้ตรวจงาน 2</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                                    <input
                                        type="text"
                                        value={jobInfo.inspector2.name}
                                        onChange={e => setJobInfo({ ...jobInfo, inspector2: { ...jobInfo.inspector2, name: e.target.value } })}
                                        placeholder="ชื่อผู้ตรวจงาน"
                                    />
                                    <input
                                        type="text"
                                        value={jobInfo.inspector2.phone}
                                        onChange={e => setJobInfo({ ...jobInfo, inspector2: { ...jobInfo.inspector2, phone: e.target.value } })}
                                        placeholder="เบอร์โทร"
                                    />
                                </div>
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
                                <th style={{ minWidth: 400 }}>ข้อมูลสินค้า</th>
                                <th style={{ width: '15%' }}>หมายเหตุ</th>
                                <th style={{ width: 60 }}>Job</th>
                                <th style={{ width: 60 }}>จำนวน</th>
                                <th style={{ width: 90 }}>ราคา/หน่วย</th>
                                <th style={{ width: 90 }}>รวม</th>
                                <th style={{ width: 40 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => {
                                // Smart product info display (same as Product Management)
                                const productInfo = [
                                    item.code,
                                    item.category,
                                    item.subcategory,
                                    item.material,
                                    // Dimensions
                                    (item.length || item.width || item.height)
                                        ? `${item.length || '-'}×${item.width || '-'}×${item.height || '-'} cm`
                                        : null,
                                    // Color
                                    item.color ? `สี${item.color}` : null,
                                    item.crystalColor ? `คริสตัล${item.crystalColor}` : null,
                                    // Lighting
                                    item.bulbType,
                                    item.light ? `แสง${item.light}` : null,
                                    item.remote ? `รีโมท${item.remote}` : null
                                ].filter(Boolean).join(' • ');

                                return (
                                    <tr key={idx}>
                                        <td className="text-center">{idx + 1}</td>
                                        <td className="text-center">
                                            <div className="image-cell">
                                                {(item.images && item.images[0]) ? (
                                                    <div className="image-preview">
                                                        <img src={item.images[0]} alt="Product" />
                                                        <button className="btn-remove-image" onClick={() => removeImage(idx)}>×</button>
                                                    </div>
                                                ) : item.image ? (
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
                                        <td>
                                            <div style={{ position: 'relative' }}>
                                                {!item.code ? (
                                                    <>
                                                        <input
                                                            type="text"
                                                            placeholder="🔍 ค้นหารหัสสินค้า..."
                                                            className="form-control"
                                                            style={{ fontSize: 13, borderColor: '#e2e8f0' }}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                // Update temporary search state for this row (we need a way to track search term per row, 
                                                                // but for simplicity let's use a local state or just filter on the fly if we had a component.
                                                                // Since this is inside a map, it's tricky without extracting a component.
                                                                // Let's try a simpler approach: use a datalist or a custom dropdown controlled by a new state array.

                                                                // BETTER APPROACH: Extract Row Component or use a specific state for active search
                                                                handleSearchProduct(idx, val);
                                                            }}
                                                            value={item._searchTerm || ''} // We'll add _searchTerm to item structure temporarily
                                                        />
                                                        {/* Dropdown Results */}
                                                        {activeSearchIndex === idx && searchResults.length > 0 && (
                                                            <div className="search-dropdown" style={{
                                                                position: 'absolute', top: '100%', left: 0, right: 0,
                                                                background: 'white', border: '1px solid #e2e8f0',
                                                                borderRadius: 6, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                                                zIndex: 10, maxHeight: 200, overflowY: 'auto'
                                                            }}>
                                                                {searchResults.map(p => (
                                                                    <div
                                                                        key={p.id}
                                                                        onClick={() => selectProduct(idx, p)}
                                                                        style={{
                                                                            padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #edf2f7',
                                                                            display: 'flex', alignItems: 'center', gap: 10
                                                                        }}
                                                                        className="dropdown-item"
                                                                    >
                                                                        {p.images && p.images[0] && (
                                                                            <img src={p.images[0]} style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 4 }} />
                                                                        )}
                                                                        <div>
                                                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{p.id}</div>
                                                                            <div style={{ fontSize: 11, color: '#718096' }}>฿{p.price?.toLocaleString()}</div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                <div
                                                                    onClick={() => window.open('/products', '_blank')}
                                                                    style={{ padding: 10, textAlign: 'center', fontSize: 12, color: '#3182ce', cursor: 'pointer', background: '#ebf8ff' }}
                                                                >
                                                                    + เพิ่มสินค้าใหม่ (ไปหน้าจัดการสินค้า)
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div style={{ position: 'relative' }}>
                                                        <div style={{ fontSize: 13, lineHeight: 1.6, color: '#4a5568', fontWeight: 600 }}>
                                                            {item.code}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: '#718096' }}>
                                                            {[
                                                                item.category,
                                                                (item.length || item.width || item.height) ? `${item.length || '-'}x${item.width || '-'}x${item.height || '-'}` : null,
                                                                item.color,
                                                                item.light
                                                            ].filter(Boolean).join(' • ')}
                                                        </div>
                                                        <button
                                                            onClick={() => clearRowProduct(idx)}
                                                            style={{
                                                                position: 'absolute', top: -4, right: -4,
                                                                background: '#fed7d7', color: '#c53030',
                                                                border: 'none', borderRadius: '50%',
                                                                width: 18, height: 18, fontSize: 10, cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                            }}
                                                            title="เปลี่ยนสินค้า"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                )}
                                                {item.remark && (
                                                    <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 2 }}>
                                                        {item.remark}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td><textarea className="input-grid" value={item.note} onChange={e => handleItemChange(idx, 'note', e.target.value)} rows={1} title="หมายเหตุเพิ่มเติม" /></td>
                                        <td className="text-center">
                                            <button
                                                className={`btn-sm ${item.specificJob ? 'btn-primary' : 'btn-secondary'}`}
                                                style={{ fontSize: 12, padding: '2px 8px' }}
                                                onClick={() => openJobModal(idx)}
                                            >
                                                {item.specificJob ? (
                                                    item.specificJob.type === 'installation' ? 'ติดตั้ง' :
                                                        item.specificJob.type === 'delivery' ? 'จัดส่ง' : 'งานแยก'
                                                ) : 'ระบุ'}
                                            </button>
                                        </td>
                                        <td><input type="number" className="input-grid text-right" min={1} value={item.qty} onChange={e => handleItemChange(idx, 'qty', Number(e.target.value))} /></td>
                                        <td><input type="number" className="input-grid text-right" min={0} value={item.unitPrice} onChange={e => handleItemChange(idx, 'unitPrice', Number(e.target.value))} /></td>
                                        <td className="text-right">{currency(item.qty * item.unitPrice)}</td>
                                        <td className="text-center">
                                            <button className="btn-icon-delete" onClick={() => removeItem(idx)} tabIndex={-1} title="ลบรายการ">×</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <button className="btn-add-item" onClick={addItem}>+ เพิ่มรายการ</button>
                </div>
            </div>

            {/* Job Detail Modal */}
            {showJobModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>รายละเอียดงาน (Job Details) - รายการที่ {activeItemIndex + 1}</h3>
                            <button className="btn-close-modal" onClick={closeJobModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>ประเภทงาน</label>
                                <select
                                    value={modalJobDetails.type}
                                    onChange={e => setModalJobDetails({ ...modalJobDetails, type: e.target.value })}
                                >
                                    <option value="installation">งานติดตั้ง (Installation)</option>
                                    <option value="delivery">งานจัดส่ง (Delivery)</option>
                                </select>
                            </div>

                            <div className="form-group" ref={modalTeamDropdownRef} style={{ position: 'relative' }}>
                                <label>ทีม (Team)</label>
                                <div className="address-combobox">
                                    <input
                                        type="text"
                                        value={modalJobDetails.team}
                                        onChange={e => setModalJobDetails({ ...modalJobDetails, team: e.target.value })}
                                        placeholder="ระบุหรือเลือกทีม..."
                                        className="address-input"
                                        onFocus={() => setModalShowTeamDropdown(true)}
                                    />
                                    <button
                                        type="button"
                                        className="btn-dropdown-toggle"
                                        onClick={() => setModalShowTeamDropdown(!modalShowTeamDropdown)}
                                    >
                                        ▼
                                    </button>

                                    {modalShowTeamDropdown && (
                                        <div className="dropdown-menu">
                                            {teams.map((team, i) => (
                                                <div
                                                    key={i}
                                                    className="dropdown-item"
                                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                    onClick={() => {
                                                        setModalJobDetails({ ...modalJobDetails, team: team })
                                                        setModalShowTeamDropdown(false)
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
                                            {modalJobDetails.team && !teams.includes(modalJobDetails.team) && (
                                                <div
                                                    className="dropdown-item add-new"
                                                    onClick={handleModalAddTeam}
                                                >
                                                    + เพิ่ม "{modalJobDetails.team}"
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>วัน-เวลาที่ติดตั้ง/จัดส่ง</label>
                                <input
                                    type="datetime-local"
                                    value={modalJobDetails.dateTime}
                                    onChange={e => setModalJobDetails({ ...modalJobDetails, dateTime: e.target.value })}
                                />
                            </div>

                            <div className="form-group" ref={modalAddressDropdownRef} style={{ position: 'relative' }}>
                                <label>สถานที่ติดตั้ง / จัดส่ง</label>
                                <div className="address-combobox">
                                    <textarea
                                        rows={3}
                                        value={modalJobDetails.address}
                                        onChange={e => setModalJobDetails({ ...modalJobDetails, address: e.target.value })}
                                        placeholder="ระบุสถานที่..."
                                        className="address-input"
                                    />
                                    <button
                                        type="button"
                                        className="btn-dropdown-toggle"
                                        onClick={() => setModalShowAddressDropdown(!modalShowAddressDropdown)}
                                    >
                                        ▼
                                    </button>

                                    {modalShowAddressDropdown && (
                                        <div className="dropdown-menu">
                                            {savedAddresses.map((item, i) => (
                                                <div
                                                    key={i}
                                                    className="dropdown-item"
                                                    onClick={() => {
                                                        setModalJobDetails({ ...modalJobDetails, address: item.address, googleMapLink: item.googleMapLink })
                                                        setModalShowAddressDropdown(false)
                                                    }}
                                                >
                                                    <strong>{item.address}</strong>
                                                    {item.googleMapLink && <><br /><small style={{ color: '#0070f3' }}>📍 มีลิงก์แผนที่</small></>}
                                                </div>
                                            ))}
                                            {modalJobDetails.address && !savedAddresses.some(item => item.address === modalJobDetails.address) && (
                                                <div
                                                    className="dropdown-item add-new"
                                                    onClick={handleModalSaveAddress}
                                                >
                                                    + เพิ่ม &quot;{modalJobDetails.address}&quot; ลงในรายการ
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Google Maps Link</label>
                                <input
                                    type="text"
                                    value={modalJobDetails.googleMapLink}
                                    onChange={e => setModalJobDetails({ ...modalJobDetails, googleMapLink: e.target.value })}
                                    placeholder="https://maps.google.com/..."
                                />
                                {modalJobDetails.googleMapLink && (() => {
                                    const coords = extractCoordinates(modalJobDetails.googleMapLink)
                                    const dist = coords ? calculateDistance(SHOP_LAT, SHOP_LON, coords.lat, coords.lon) : null
                                    return (
                                        <div style={{ marginTop: 4, display: 'flex', gap: 12, alignItems: 'center' }}>
                                            <a
                                                href={modalJobDetails.googleMapLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ fontSize: 12, color: '#0070f3' }}
                                            >
                                                🗺️ เปิดแผนที่
                                            </a>
                                            {dist && (
                                                <span style={{ fontSize: 12, color: '#4a5568' }}>
                                                    ({dist} km)
                                                </span>
                                            )}
                                        </div>
                                    )
                                })()}
                            </div>

                            {/* Inspector 1 */}
                            <div className="form-group">
                                <label>ผู้ตรวจงาน 1</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    <input
                                        type="text"
                                        value={modalJobDetails.inspector1.name}
                                        onChange={e => setModalJobDetails({ ...modalJobDetails, inspector1: { ...modalJobDetails.inspector1, name: e.target.value } })}
                                        placeholder="ชื่อผู้ตรวจงาน"
                                    />
                                    <input
                                        type="text"
                                        value={modalJobDetails.inspector1.phone}
                                        onChange={e => setModalJobDetails({ ...modalJobDetails, inspector1: { ...modalJobDetails.inspector1, phone: e.target.value } })}
                                        placeholder="เบอร์โทร"
                                    />
                                </div>
                            </div>

                            {/* Inspector 2 */}
                            <div className="form-group">
                                <label>ผู้ตรวจงาน 2</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    <input
                                        type="text"
                                        value={modalJobDetails.inspector2.name}
                                        onChange={e => setModalJobDetails({ ...modalJobDetails, inspector2: { ...modalJobDetails.inspector2, name: e.target.value } })}
                                        placeholder="ชื่อผู้ตรวจงาน"
                                    />
                                    <input
                                        type="text"
                                        value={modalJobDetails.inspector2.phone}
                                        onChange={e => setModalJobDetails({ ...modalJobDetails, inspector2: { ...modalJobDetails.inspector2, phone: e.target.value } })}
                                        placeholder="เบอร์โทร"
                                    />
                                </div>
                            </div>

                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={closeJobModal}>ยกเลิก</button>
                            <button className="btn-primary" onClick={saveJobModal}>บันทึก</button>
                        </div>
                    </div>
                </div>
            )}


            {/* Datalists for Auto-complete */}
            <datalist id="list-code">
                {[...new Set(productsData.map(p => p.id).filter(Boolean))].map((v, i) => <option key={i} value={v} />)}
            </datalist>
            <datalist id="list-name">
                {[...new Set(productsData.map(p => p.name).filter(Boolean))].map((v, i) => <option key={i} value={v} />)}
            </datalist>
            <datalist id="list-type">
                {[...new Set(productsData.map(p => p.type).filter(Boolean))].map((v, i) => <option key={i} value={v} />)}
            </datalist>
            <datalist id="list-material">
                {[...new Set(productsData.map(p => p.material).filter(Boolean))].map((v, i) => <option key={i} value={v} />)}
            </datalist>
            <datalist id="list-color">
                {[...new Set(productsData.map(p => p.color).filter(Boolean))].map((v, i) => <option key={i} value={v} />)}
            </datalist>
            <datalist id="list-crystalColor">
                {[...new Set(productsData.map(p => p.crystalColor).filter(Boolean))].map((v, i) => <option key={i} value={v} />)}
            </datalist>
            <datalist id="list-bulbType">
                {[...new Set(productsData.map(p => p.bulbType).filter(Boolean))].map((v, i) => <option key={i} value={v} />)}
            </datalist>
            <datalist id="list-light">
                {[...new Set(productsData.map(p => p.light).filter(Boolean))].map((v, i) => <option key={i} value={v} />)}
            </datalist>
            <datalist id="list-remote">
                {[...new Set(productsData.map(p => p.remote).filter(Boolean))].map((v, i) => <option key={i} value={v} />)}
            </datalist>

            <style jsx>{`
        .order-page {
          min-height: 100vh;
          background: #f8f9fa;
          padding: 20px;
          font-family: 'Sarabun', sans-serif;
          box-sizing: border-box;
        }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          background: #fff;
          padding: 20px 24px;
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .page-header h1 { 
          margin: 0; 
          font-size: 22px; 
          color: #1a202c;
          font-weight: 600;
        }
        .actions { display: flex; gap: 12px; }
        .btn-primary { 
          background: #2563eb; 
          color: white; 
          border: none; 
          padding: 10px 24px; 
          border-radius: 8px; 
          font-weight: 500; 
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
        }
        .btn-primary:hover { 
          background: #1d4ed8;
          box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
        }
        .btn-back { 
          background: white; 
          color: #64748b; 
          border: 1px solid #e2e8f0; 
          padding: 10px 24px; 
          border-radius: 8px; 
          font-weight: 500; 
          cursor: pointer; 
          transition: all 0.2s;
          font-size: 14px;
        .btn-back {
          background: white;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }
        .btn-back:hover {
          background: #f8fafc;
          border-color: #cbd5e0;
        }
        .btn-icon {
          background: white;
          color: #64748b;
          border: 1px solid #e2e8f0;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-icon:hover {
          background: #f8fafc;
          border-color: #cbd5e0;
          color: #1e293b;
        }
          color: #64748b; 
          border: 1px solid #e2e8f0; 
          padding: 8px 16px; 
          border-radius: 8px; 
          font-weight: 500; 
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          background: #f8fafc;
        }

        /* Top Layout Grid - Updated to 4 columns */
        .top-layout {
          display: grid;
          grid-template-columns: 1.3fr 1.5fr 1fr 1.2fr; /* Customer : Tax : Job : Summary */
          gap: 12px;
          margin-bottom: 16px;
          align-items: start;
        }

        .section-card {
          background: #fff;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
          height: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: box-shadow 0.2s;
        }
        .section-card:hover {
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        h2 { 
          margin: 0 0 16px 0; 
          font-size: 15px; 
          color: #1e293b; 
          border-bottom: 2px solid #f1f5f9; 
          padding-bottom: 10px;
          font-weight: 600;
        }
        .sub-header { 
          margin: 12px 0 10px 0; 
          font-size: 13px; 
          color: #475569; 
          font-weight: 600; 
        }

        .form-grid { display: grid; gap: 12px; }
        .form-grid.two-col { grid-template-columns: 1fr 1fr; }
        .form-grid.one-col { grid-template-columns: 1fr; }
        .full-width { grid-column: 1 / -1; }

        .form-group { display: flex; flex-direction: column; gap: 5px; }
        label { 
          font-size: 12px; 
          font-weight: 500; 
          color: #64748b; 
        }
        input, select, textarea { 
          padding: 8px 10px; 
          border: 1px solid #e2e8f0; 
          border-radius: 6px; 
          font-size: 13px; 
          font-family: inherit;
          transition: all 0.2s;
          background: white;
          box-sizing: border-box;
          width: 100%;
        }
        input:focus, select:focus, textarea:focus { 
          outline: none; 
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

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
          top: 100%;
          left: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          z-index: 1000;
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
            overflow-x: visible;
            padding-bottom: 150px; /* Add space for dropdown */
        }
        .items-table { width: 100%; border-collapse: collapse; min-width: 1400px; }
        .items-table th { background: #f7fafc; padding: 8px; font-size: 12px; font-weight: 600; color: #4a5568; text-align: left; border-bottom: 2px solid #edf2f7; }
        .items-table th.th-equal { width: 6%; }
        .items-table td { padding: 6px; border-bottom: 1px solid #edf2f7; vertical-align: middle; }
        .input-grid { width: 100%; padding: 4px; border: 1px solid transparent; background: transparent; font-size: 13px; text-align: center; }
        .input-grid.text-left { text-align: left; }
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

        /* Job Button */
        .btn-job {
            background: #edf2f7;
            border: 1px solid #cbd5e0;
            color: #4a5568;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            width: 100%;
        }
        .btn-job:hover { background: #e2e8f0; }
        .btn-job.active {
            background: #0070f3;
            color: white;
            border-color: #0070f3;
        }

        /* Modal Styles */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .modal-content {
            background: white;
            border-radius: 8px;
            width: 500px;
            max-width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
        }
        .modal-header {
            padding: 16px;
            border-bottom: 1px solid #edf2f7;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .modal-header h3 { margin: 0; font-size: 16px; color: #2d3748; }
        .btn-close-modal {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #a0aec0;
        }
        .modal-body {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .modal-footer {
            padding: 16px;
            border-top: 1px solid #edf2f7;
            display: flex;
            justify-content: flex-end;
            gap: 8px;
        }

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
