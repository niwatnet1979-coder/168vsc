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

    // 1. Try to match @lat,lon
    const match = url.match(/@([-0-9.]+),([-0-9.]+)/)
    if (match) {
        return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) }
    }

    // 2. Try to match q=lat,lon
    const matchQ = url.match(/[?&]q=([-0-9.]+),([-0-9.]+)/)
    if (matchQ) {
        return { lat: parseFloat(matchQ[1]), lon: parseFloat(matchQ[2]) }
    }

    // 3. Try to match /search/lat,lon
    const matchSearch = url.match(/\/search\/([-0-9.]+),([-0-9.]+)/)
    if (matchSearch) {
        return { lat: parseFloat(matchSearch[1]), lon: parseFloat(matchSearch[2]) }
    }

    // 4. Try to match /place/.../@lat,lon
    // (Usually handled by case 1, but just in case)

    // 5. Try to match /dir/.../lat,lon
    const matchDir = url.match(/\/dir\/.*\/([-0-9.]+),([-0-9.]+)/)
    if (matchDir) {
        return { lat: parseFloat(matchDir[1]), lon: parseFloat(matchDir[2]) }
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
    const [savedCustomers, setSavedCustomers] = useState([]); // New state for customers

    // Load Products from LocalStorage
    const [productsData, setProductsData] = useState([])
    // allProducts state is already declared or not needed here if we use productsData, 
    // but based on previous context, let's remove the duplicate declaration if it exists elsewhere.
    // Checking the file, it seems I added it in line 159 but it might be clashing with another one.
    // Let's just remove this block and rely on the one I added or the existing one.
    // Actually, I will remove the duplicate lines I added in step 2177.

    // Load teams from localStorage, filtered for Master Job
    const [availableTeams, setAvailableTeams] = useState([]); // New state for available teams

    // Load saved data on mount
    useEffect(() => {
        // Load customers
        const savedCustomersData = localStorage.getItem('customers_data');
        if (savedCustomersData) {
            setCustomersData(JSON.parse(savedCustomersData));
            setSavedCustomers(JSON.parse(savedCustomersData)); // Also set the new state
        } else {
            // Fallback to mock data if no saved data
            setCustomersData(MOCK_CUSTOMERS_DATA);
            setSavedCustomers(MOCK_CUSTOMERS_DATA);
        }

        // Load tax profiles
        const savedTax = localStorage.getItem('tax_profiles_data');
        if (savedTax) {
            setSavedTaxProfiles(JSON.parse(savedTax));
        }

        // Load teams and filter for Master Job (QC and Technician only)
        const savedTeams = localStorage.getItem('team_data'); // Correct key: team_data
        if (savedTeams) {
            try {
                const allMembers = JSON.parse(savedTeams);
                // Filter members by teamType 'QC' or 'ช่าง'
                const validMembers = allMembers.filter(m => m.teamType === 'QC' || m.teamType === 'ช่าง');

                // Extract unique team names
                const uniqueTeams = [...new Set(validMembers.map(m => m.team))].filter(Boolean);

                // Create objects for the dropdown
                const teamOptions = uniqueTeams.map(teamName => {
                    // Find the type of this team (assuming all members in a team have the same type, or take the first one found)
                    const member = validMembers.find(m => m.team === teamName);
                    return {
                        name: teamName,
                        type: member ? member.teamType : 'ช่าง'
                    };
                });

                setAvailableTeams(teamOptions);
            } catch (e) {
                console.error("Error parsing team data", e);
                setAvailableTeams([]);
            }
        } else {
            setAvailableTeams([]);
        }

        // Load products for search
        const savedProducts = localStorage.getItem('products_data_v2'); // Using v2 as per instruction
        if (savedProducts) {
            setAllProducts(JSON.parse(savedProducts));
            setProductsData(JSON.parse(savedProducts)); // Keep existing productsData for compatibility if needed
        } else {
            // Fallback to mock data
            setProductsData(MOCK_PRODUCTS_DATA);
            setAllProducts(MOCK_PRODUCTS_DATA);
        }
    }, []);

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
        installLocationName: '', // ชื่อสถานที่ติดตั้ง
        installAddress: '',
        googleMapLink: '',
        team: '',
        inspector1: { name: '', phone: '' },
        inspector2: { name: '', phone: '' },
        distance: '' // ระยะทางจากร้าน (กม.)
    })


    // Saved addresses (will be populated when customer is selected)
    const [savedAddresses, setSavedAddresses] = useState([])
    const [showLocationNameDropdown, setShowLocationNameDropdown] = useState(false)
    const locationNameDropdownRef = useRef(null)
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
        !customer.name ||
        c.name.toLowerCase().includes(customer.name.toLowerCase()) ||
        (c.phone && c.phone.includes(customer.name)) ||
        customersData.some(saved => saved.name === customer.name)
    )

    // Filter products based on input (dynamic based on active row)
    const getFilteredProducts = (searchTerm) => {
        if (!searchTerm) return productsData
        const term = searchTerm.toLowerCase()
        return productsData.filter(p =>
            p.id.toLowerCase().includes(term) ||
            p.name.toLowerCase().includes(term) ||
            (p.category && p.category.toLowerCase().includes(term)) ||
            (p.subcategory && p.subcategory.toLowerCase().includes(term)) ||
            (p.description && p.description.toLowerCase().includes(term)) ||
            (p.material && p.material.toLowerCase().includes(term)) ||
            (p.color && p.color.toLowerCase().includes(term)) ||
            (p.crystalColor && p.crystalColor.toLowerCase().includes(term)) ||
            (p.bulbType && p.bulbType.toLowerCase().includes(term)) ||
            (p.length && p.length.toString().includes(term)) ||
            (p.width && p.width.toString().includes(term)) ||
            (p.height && p.height.toString().includes(term)) ||
            (p.light && p.light.toLowerCase().includes(term)) ||
            (p.remote && p.remote.toLowerCase().includes(term))
        )
    }

    const handleSelectCustomer = (selectedCustomer) => {
        setCustomer({
            ...customer,
            id: selectedCustomer.id, // Important: Save ID
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
                name: addr.name, // Store place name separately
                address: addr.address, // Store physical address separately
                googleMapLink: addr.mapLink || '',
                fullLabel: `${addr.name} - ${addr.address}`, // Keep a combined label for searching if needed
                inspector1: addr.inspector1 || '',
                inspector1Phone: addr.inspector1Phone || '',
                inspector2: addr.inspector2 || '',
                inspector2Phone: addr.inspector2Phone || ''
            }))
            setSavedAddresses(formattedAddresses)

            // Auto-fill first address if available
            if (selectedCustomer.savedAddresses[0]) {
                setJobInfo(prev => ({
                    ...prev,
                    installLocationName: selectedCustomer.savedAddresses[0].name || '',
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
        installLocationName: '', // ชื่อสถานที่ติดตั้ง
        address: '',
        googleMapLink: '',
        inspector1: { name: '', phone: '' },
        inspector2: { name: '', phone: '' },
        distance: ''
    })
    const [modalShowLocationNameDropdown, setModalShowLocationNameDropdown] = useState(false)
    const [modalShowAddressDropdown, setModalShowAddressDropdown] = useState(false)
    const [modalShowTeamDropdown, setModalShowTeamDropdown] = useState(false)
    const modalLocationNameDropdownRef = useRef(null)
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
            if (locationNameDropdownRef.current && !locationNameDropdownRef.current.contains(event.target)) {
                setShowLocationNameDropdown(false)
            }
            // Modal dropdowns
            if (modalLocationNameDropdownRef.current && !modalLocationNameDropdownRef.current.contains(event.target)) {
                setModalShowLocationNameDropdown(false)
            }
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

        // Load temp state if exists (returning from add new page)
        const tempState = localStorage.getItem('order_form_temp');
        if (tempState) {
            try {
                const parsed = JSON.parse(tempState);
                if (parsed.customer) setCustomer(parsed.customer);
                if (parsed.taxInvoice) setTaxInvoice(parsed.taxInvoice);
                if (parsed.jobInfo) setJobInfo(parsed.jobInfo);
                if (parsed.items) setItems(parsed.items);
                if (parsed.shippingFee !== undefined) setShippingFee(parsed.shippingFee);
                if (parsed.discount) setDiscount(parsed.discount);
                if (parsed.deposit) setDeposit(parsed.deposit);

                // Refresh saved profiles from latest customer data
                if (parsed.customer && parsed.customer.id) {
                    // We need to re-read localStorage here to get the absolute latest
                    const currentSavedData = localStorage.getItem('customers_data');
                    if (currentSavedData) {
                        const allCustomers = JSON.parse(currentSavedData);
                        const currentCustomer = allCustomers.find(c => c.id === parsed.customer.id);
                        if (currentCustomer) {
                            if (currentCustomer.taxInvoices) setSavedTaxProfiles(currentCustomer.taxInvoices);

                            if (currentCustomer.savedAddresses) {
                                const formattedAddresses = currentCustomer.savedAddresses.map(addr => ({
                                    name: addr.name,
                                    address: addr.address,
                                    googleMapLink: addr.mapLink || '',
                                    fullLabel: `${addr.name} - ${addr.address}`,
                                    inspector1: addr.inspector1 || '',
                                    inspector1Phone: addr.inspector1Phone || '',
                                    inspector2: addr.inspector2 || '',
                                    inspector2Phone: addr.inspector2Phone || ''
                                }));
                                setSavedAddresses(formattedAddresses);
                            }
                        }
                    }
                }

                // Clear temp state after loading
                localStorage.removeItem('order_form_temp');
            } catch (e) {
                console.error("Failed to load temp state", e);
            }
        }
    }, []);

    // Auto-select new customer if returning from create page
    useEffect(() => {
        if (router.query.newCustomerId && customersData.length > 0) {
            const newId = parseInt(router.query.newCustomerId);
            const newCustomer = customersData.find(c => c.id === newId);
            if (newCustomer) {
                handleSelectCustomer(newCustomer);
                // Clear query param to prevent re-selecting on refresh (optional but good practice)
                router.replace('/order', undefined, { shallow: true });
            }
        }
    }, [router.query.newCustomerId, customersData]);

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
    useEffect(() => {
        const coords = extractCoordinates(jobInfo.googleMapLink)
        if (coords) {
            const dist = calculateDistance(SHOP_LAT, SHOP_LON, coords.lat, coords.lon)
            setJobInfo(prev => {
                if (prev.distance === dist) return prev
                return { ...prev, distance: dist }
            })
        }
    }, [jobInfo.googleMapLink])

    // Modal Distance Calculation
    useEffect(() => {
        const coords = extractCoordinates(modalJobDetails.googleMapLink)
        if (coords) {
            const dist = calculateDistance(SHOP_LAT, SHOP_LON, coords.lat, coords.lon)
            setModalJobDetails(prev => {
                if (prev.distance === dist) return prev
                return { ...prev, distance: dist }
            })
        }
    }, [modalJobDetails.googleMapLink])

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

    const handleSelectLocationName = (location) => {
        setJobInfo({
            ...jobInfo,
            installLocationName: location.name,
            installAddress: location.address,
            googleMapLink: location.googleMapLink,
            inspector1: {
                name: location.inspector1 || '',
                phone: location.inspector1Phone || ''
            },
            inspector2: {
                name: location.inspector2 || '',
                phone: location.inspector2Phone || ''
            }
        })
        setShowLocationNameDropdown(false)
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
            type: jobInfo.jobType || 'installation',
            team: jobInfo.team || '',
            dateTime: jobInfo.appointmentDate || '',
            installLocationName: jobInfo.installLocationName || '',
            address: jobInfo.installAddress || '',
            googleMapLink: jobInfo.googleMapLink || '',
            inspector1: jobInfo.inspector1 || { name: '', phone: '' },
            inspector2: jobInfo.inspector2 || { name: '', phone: '' },
            distance: jobInfo.distance || ''
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

    const handleModalSelectLocationName = (location) => {
        setModalJobDetails({
            ...modalJobDetails,
            installLocationName: location.name,
            address: location.address,
            googleMapLink: location.googleMapLink,
            inspector1: {
                name: location.inspector1 || '',
                phone: location.inspector1Phone || ''
            },
            inspector2: {
                name: location.inspector2 || '',
                phone: location.inspector2Phone || ''
            }
        })
        setModalShowLocationNameDropdown(false)
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
                                            <div
                                                className="dropdown-item"
                                                onClick={() => {
                                                    // Save temp state before navigating
                                                    const state = { customer, taxInvoice, jobInfo, items, shippingFee, discount, deposit };
                                                    localStorage.setItem('order_form_temp', JSON.stringify(state));
                                                    router.push('/customers/new?returnUrl=/order');
                                                }}
                                                style={{ color: '#0070f3', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', cursor: 'pointer' }}
                                            >
                                                <span>+</span> เพิ่มลูกค้าใหม่
                                            </div>
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
                                placeholder="ระบุเบอร์โทรศัพท์..."
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
                                    placeholder="ระบุสื่ออื่นๆ..."
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label>ผู้ติดต่อ 1</label>
                            <input
                                type="text"
                                value={customer.contact1.name}
                                onChange={e => handleCustomerChange('name', e.target.value, 'contact1')}
                                placeholder="ระบุชื่อผู้ติดต่อ..."
                            />
                        </div>
                        <div className="form-group">
                            <label>&nbsp;</label>
                            <input
                                type="text"
                                value={customer.contact1.phone}
                                onChange={e => handleCustomerChange('phone', e.target.value, 'contact1')}
                                placeholder="ระบุเบอร์โทร..."
                            />
                        </div>
                        <div className="form-group">
                            <label>ผู้ติดต่อ 2</label>
                            <input
                                type="text"
                                value={customer.contact2.name}
                                onChange={e => handleCustomerChange('name', e.target.value, 'contact2')}
                                placeholder="ระบุชื่อผู้ติดต่อ..."
                            />
                        </div>
                        <div className="form-group">
                            <label>&nbsp;</label>
                            <input
                                type="text"
                                value={customer.contact2.phone}
                                onChange={e => handleCustomerChange('phone', e.target.value, 'contact2')}
                                placeholder="ระบุเบอร์โทร..."
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Tax Invoice Section */}
                <div className="section-card tax-section" ref={taxDropdownRef}>
                    <h2>ข้อมูลใบกำกับภาษี (Tax Invoice)</h2>

                    <div className="form-grid two-col">
                        <div className="form-group full-width" style={{ position: 'relative' }}>
                            <label>ชื่อบริษัท</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={taxInvoice.companyName}
                                    onChange={e => {
                                        handleTaxInvoiceChange('companyName', e.target.value)
                                        setShowTaxDropdown(true)
                                    }}
                                    onFocus={() => setShowTaxDropdown(true)}
                                    placeholder="ระบุชื่อบริษัท..."
                                    style={{ width: '100%' }}
                                />
                                {showTaxDropdown && (
                                    <div className="dropdown-menu-absolute">
                                        {savedTaxProfiles.length > 0 ? (
                                            <>
                                                {savedTaxProfiles.filter(p =>
                                                    !taxInvoice.companyName ||
                                                    p.companyName.toLowerCase().includes(taxInvoice.companyName.toLowerCase()) ||
                                                    savedTaxProfiles.some(saved => saved.companyName === taxInvoice.companyName)
                                                ).map((profile, i) => (
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
                                                <div className="divider" style={{ margin: '4px 0' }}></div>
                                                <div
                                                    className="dropdown-item"
                                                    onClick={() => {
                                                        // Save temp state
                                                        const state = { customer, taxInvoice, jobInfo, items, shippingFee, discount, deposit };
                                                        localStorage.setItem('order_form_temp', JSON.stringify(state));

                                                        if (customer.id) {
                                                            router.push(`/customers/${customer.id}?tab=tax&returnUrl=/order`)
                                                        } else if (customer.name) {
                                                            // If name exists but no ID, go to create new customer
                                                            router.push(`/customers/new?name=${encodeURIComponent(customer.name)}&returnUrl=/order`)
                                                        } else {
                                                            alert('กรุณาระบุชื่อลูกค้าก่อนเพิ่มข้อมูล')
                                                        }
                                                    }}
                                                    style={{ color: '#0070f3', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', cursor: 'pointer' }}
                                                >
                                                    <span>+</span> เพิ่มข้อมูลใบกำกับภาษี
                                                </div>
                                            </>
                                        ) : (
                                            <div className="dropdown-item" style={{ color: '#94a3b8', cursor: 'default' }}>
                                                ไม่มีข้อมูลใบกำกับภาษีที่บันทึกไว้
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label>สาขา</label>
                            <input
                                type="text"
                                value={taxInvoice.branch}
                                onChange={e => handleTaxInvoiceChange('branch', e.target.value)}
                                placeholder="ระบุสาขา..."
                            />
                        </div>
                        <div className="form-group">
                            <label>เลขที่ผู้เสียภาษี</label>
                            <input
                                type="text"
                                value={taxInvoice.taxId}
                                onChange={e => handleTaxInvoiceChange('taxId', e.target.value)}
                                placeholder="ระบุเลขที่ผู้เสียภาษี..."
                            />
                        </div>
                        <div className="form-group full-width">
                            <label>ที่อยู่</label>
                            <textarea
                                rows={2}
                                value={taxInvoice.address}
                                onChange={e => handleTaxInvoiceChange('address', e.target.value)}
                                placeholder="ระบุที่อยู่..."
                            />
                        </div>
                        <div className="form-group">
                            <label>เบอร์โทรศัพท์</label>
                            <input
                                type="text"
                                value={taxInvoice.phone}
                                onChange={e => handleTaxInvoiceChange('phone', e.target.value)}
                                placeholder="ระบุเบอร์โทรศัพท์..."
                            />
                        </div>
                        <div className="form-group">
                            <label>อีเมล</label>
                            <input
                                type="text"
                                value={taxInvoice.email}
                                onChange={e => handleTaxInvoiceChange('email', e.target.value)}
                                placeholder="ระบุอีเมล..."
                            />
                        </div>
                        <div className="form-group full-width">
                            <label>ที่อยู่จัดส่งใบกำกับภาษี</label>
                            <input
                                type="text"
                                value={taxInvoice.deliveryAddress}
                                onChange={e => handleTaxInvoiceChange('deliveryAddress', e.target.value)}
                                placeholder="ระบุที่อยู่จัดส่ง..."
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

                        {/* Team and Appointment Date - Two Columns */}
                        <div className="form-grid two-col">
                            {/* Team Dropdown */}
                            <div className="form-group" ref={teamDropdownRef}>
                                <label>ทีม (Team)</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        value={jobInfo.team}
                                        onChange={e => {
                                            setJobInfo({ ...jobInfo, team: e.target.value })
                                            setShowTeamDropdown(true)
                                        }}
                                        onFocus={() => setShowTeamDropdown(true)}
                                        placeholder="ระบุหรือเลือกทีม..."
                                        style={{ width: '100%' }}
                                    />
                                    {showTeamDropdown && (
                                        <div className="dropdown-menu-absolute">
                                            {availableTeams.length > 0 ? (
                                                availableTeams.filter(t =>
                                                    !jobInfo.team ||
                                                    t.name.toLowerCase().includes(jobInfo.team.toLowerCase())
                                                ).map((team, i) => (
                                                    <div
                                                        key={i}
                                                        className="dropdown-item"
                                                        onClick={() => {
                                                            setJobInfo({ ...jobInfo, team: team.name })
                                                            setShowTeamDropdown(false)
                                                        }}
                                                    >
                                                        {team.name} <span style={{ fontSize: 11, color: '#718096' }}>({team.type === 'QC' ? 'QC' : 'ช่าง'})</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="dropdown-item" style={{ color: '#94a3b8' }}>ไม่พบข้อมูลทีม (QC/ช่าง)</div>
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
                        </div>

                        {/* Location Name Combobox */}
                        <div className="form-group" ref={locationNameDropdownRef}>
                            <label>ชื่อสถานที่ติดตั้ง / จัดส่ง</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={jobInfo.installLocationName}
                                    onChange={e => {
                                        setJobInfo({ ...jobInfo, installLocationName: e.target.value })
                                        setShowLocationNameDropdown(true)
                                    }}
                                    onFocus={() => setShowLocationNameDropdown(true)}
                                    placeholder="เลือกหรือระบุชื่อสถานที่..."
                                    style={{ width: '100%' }}
                                />
                                {showLocationNameDropdown && (
                                    <div className="dropdown-menu-absolute">
                                        {savedAddresses.length > 0 ? (
                                            <>
                                                {savedAddresses.filter(item =>
                                                    !jobInfo.installLocationName ||
                                                    item.name.toLowerCase().includes(jobInfo.installLocationName.toLowerCase()) ||
                                                    savedAddresses.some(saved => saved.name === jobInfo.installLocationName)
                                                ).map((item, i) => (
                                                    <div
                                                        key={i}
                                                        className="dropdown-item"
                                                        onClick={() => handleSelectLocationName(item)}
                                                    >
                                                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{item.name}</div>
                                                        <div style={{ fontSize: 12, color: '#718096' }}>{item.address}</div>
                                                        {item.googleMapLink && <small style={{ color: '#0070f3' }}>📍 มีลิงก์แผนที่</small>}
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="dropdown-item" style={{ color: '#94a3b8', cursor: 'default' }}>
                                                ไม่มีข้อมูลสถานที่ที่บันทึกไว้
                                            </div>
                                        )}
                                        <div className="divider" style={{ margin: '4px 0' }}></div>
                                        <div
                                            className="dropdown-item"
                                            onClick={() => {
                                                // Save temp state
                                                const state = { customer, taxInvoice, jobInfo, items, shippingFee, discount, deposit };
                                                localStorage.setItem('order_form_temp', JSON.stringify(state));

                                                if (customer.id) {
                                                    router.push(`/customers/${customer.id}?tab=address&returnUrl=/order`)
                                                } else if (customer.name) {
                                                    // If name exists but no ID, go to create new customer
                                                    router.push(`/customers/new?name=${encodeURIComponent(customer.name)}&returnUrl=/order`)
                                                } else {
                                                    alert('กรุณาระบุชื่อลูกค้าก่อนเพิ่มสถานที่ติดตั้ง')
                                                }
                                            }}
                                            style={{ color: '#0070f3', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', cursor: 'pointer' }}
                                        >
                                            <span>+</span> เพิ่มสถานที่ติดตั้ง
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Address Combobox */}
                        <div className="form-group" ref={addressDropdownRef}>
                            <label>สถานที่ติดตั้ง / จัดส่ง</label>
                            <div className="address-combobox">
                                <textarea
                                    rows={2}
                                    value={jobInfo.installAddress}
                                    onChange={e => setJobInfo({ ...jobInfo, installAddress: e.target.value })}
                                    placeholder="ระบุสถานที่..."
                                    className="address-input"
                                />
                            </div>

                            {/* Google Maps Link */}
                            <div style={{ marginTop: 8 }}>
                                <label>
                                    {jobInfo.googleMapLink ? (
                                        <a
                                            href={jobInfo.googleMapLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#0070f3', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                        >
                                            🗺️ Google Maps Link
                                        </a>
                                    ) : (
                                        'Google Maps Link'
                                    )}
                                    {jobInfo.distance && <span style={{ marginLeft: 8, color: '#0070f3', fontSize: 12 }}>({jobInfo.distance} km)</span>}
                                </label>
                                <input
                                    type="text"
                                    value={jobInfo.googleMapLink}
                                    onChange={e => setJobInfo({ ...jobInfo, googleMapLink: e.target.value })}
                                    placeholder="https://maps.google.com/..."
                                />
                            </div>

                            {/* Inspector 1 */}
                            <div style={{ marginTop: 12 }}>
                                <label>ผู้ตรวจงาน 1</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                                    <input
                                        type="text"
                                        value={jobInfo.inspector1.name}
                                        onChange={e => setJobInfo({ ...jobInfo, inspector1: { ...jobInfo.inspector1, name: e.target.value } })}
                                        placeholder="ระบุชื่อผู้ตรวจงาน..."
                                    />
                                    <input
                                        type="text"
                                        value={jobInfo.inspector1.phone}
                                        onChange={e => setJobInfo({ ...jobInfo, inspector1: { ...jobInfo.inspector1, phone: e.target.value } })}
                                        placeholder="ระบุเบอร์โทร..."
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
                                        placeholder="ระบุชื่อผู้ตรวจงาน..."
                                    />
                                    <input
                                        type="text"
                                        value={jobInfo.inspector2.phone}
                                        onChange={e => setJobInfo({ ...jobInfo, inspector2: { ...jobInfo.inspector2, phone: e.target.value } })}
                                        placeholder="ระบุเบอร์โทร..."
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
                                placeholder="0"
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
                    <table className="items-table" style={{ tableLayout: 'fixed' }}>
                        <thead>
                            <tr>
                                <th className="text-center" style={{ width: '50px' }}>#</th>
                                <th className="text-center" style={{ width: '100px' }}>รูปภาพ</th>
                                <th style={{ width: 'auto' }}>ข้อมูลสินค้า</th>
                                <th style={{ width: '200px' }}>หมายเหตุ</th>
                                <th className="text-center" style={{ width: '80px' }}>Job</th>
                                <th className="text-center" style={{ width: '80px' }}>จำนวน</th>
                                <th className="text-right" style={{ width: '120px' }}>ราคา/หน่วย</th>
                                <th className="text-right" style={{ width: '120px' }}>รวม</th>
                                <th style={{ width: '50px' }}></th>
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
                                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>{idx + 1}</td>
                                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                            <div className="image-cell" style={{ margin: '0 auto' }}>
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
                                                    <>
                                                        <label htmlFor={`img-${idx}`} className="upload-placeholder">
                                                            <span>+</span>
                                                        </label>
                                                        <input
                                                            id={`img-${idx}`}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleImageChange(idx, e)}
                                                            style={{ display: 'none' }}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ verticalAlign: 'top', padding: '8px' }}>
                                            {!item.code ? (
                                                <div className="search-container" style={{ position: 'relative', width: '100%' }}>
                                                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#a0aec0', zIndex: 1 }}>🔍</span>
                                                    <input
                                                        type="text"
                                                        className="input-grid"
                                                        style={{
                                                            textAlign: 'left',
                                                            paddingLeft: 35,
                                                            width: '100%',
                                                            boxSizing: 'border-box',
                                                            height: '36px'
                                                        }}
                                                        placeholder="ค้นหารหัสสินค้า..."
                                                        value={item._searchTerm !== undefined ? item._searchTerm : ''}
                                                        onChange={(e) => handleSearchProduct(idx, e.target.value)}
                                                        onFocus={() => setActiveSearchIndex(idx)}
                                                    />
                                                    {/* Dropdown Results */}
                                                    {activeSearchIndex === idx && searchResults.length > 0 && (
                                                        <div className="search-dropdown" style={{
                                                            position: 'absolute', top: '100%', left: 0, right: 0,
                                                            background: 'white', border: '1px solid #e2e8f0',
                                                            borderRadius: 4, zIndex: 100, maxHeight: 200, overflowY: 'auto',
                                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                                        }}>
                                                            {searchResults.map(p => (
                                                                <div
                                                                    key={p.id}
                                                                    className="dropdown-item"
                                                                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderBottom: '1px solid #f7fafc', cursor: 'pointer' }}
                                                                    onClick={() => selectProduct(idx, p)}
                                                                >
                                                                    <div style={{ width: 30, height: 30, background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
                                                                        {p.images && p.images[0] ? <img src={p.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📷'}
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.id}</div>
                                                                        <div style={{ fontSize: 11, color: '#718096' }}>{currency(p.price)}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <div className="dropdown-item add-new" style={{ padding: 8, textAlign: 'center', fontSize: 12 }}>
                                                                <a href="/products" target="_blank" style={{ color: '#0070f3', textDecoration: 'none' }}>+ เพิ่มสินค้าใหม่ (ไปหน้าจัดการสินค้า)</a>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: '#2d3748' }}>{item.code}</div>
                                                        <div style={{ fontSize: 12, lineHeight: 1.4, color: '#4a5568' }}>
                                                            {productInfo || '-'}
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="btn-icon-delete"
                                                        style={{ fontSize: 14, color: '#cbd5e0' }}
                                                        onClick={() => clearRowProduct(idx)}
                                                        title="เปลี่ยนสินค้า"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ verticalAlign: 'top', padding: '8px' }}>
                                            <textarea
                                                className="input-grid"
                                                value={item.note}
                                                onChange={e => handleItemChange(idx, 'note', e.target.value)}
                                                rows={2}
                                                style={{
                                                    textAlign: 'left',
                                                    resize: 'vertical',
                                                    minHeight: '36px',
                                                    width: '100%',
                                                    boxSizing: 'border-box',
                                                    padding: '4px 8px'
                                                }}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                            <button
                                                className={`btn-sm ${item.specificJob ? 'btn-primary' : 'btn-secondary'}`}
                                                style={{ fontSize: 12, padding: '4px 8px', width: '100%' }}
                                                onClick={() => openJobModal(idx)}
                                            >
                                                {item.specificJob ? (
                                                    item.specificJob.type === 'installation' ? 'ติดตั้ง' :
                                                        item.specificJob.type === 'delivery' ? 'จัดส่ง' : 'งานแยก'
                                                ) : 'ระบุ'}
                                            </button>
                                        </td>
                                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                            <input
                                                type="number"
                                                className="input-grid"
                                                min={1}
                                                value={item.qty}
                                                onChange={e => handleItemChange(idx, 'qty', Number(e.target.value))}
                                                style={{ textAlign: 'center', width: '100%', boxSizing: 'border-box' }}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                                            <input
                                                type="number"
                                                className="input-grid"
                                                value={item.unitPrice}
                                                onChange={e => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                                                style={{ textAlign: 'right', width: '100%', boxSizing: 'border-box', paddingRight: '8px' }}
                                            />
                                        </td>
                                        <td style={{ textAlign: 'right', verticalAlign: 'middle', paddingRight: '12px' }}>
                                            {currency(item.qty * item.unitPrice)}
                                        </td>
                                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
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
                            {/* Team and Appointment Date - Two Columns */}
                            <div className="form-grid two-col">
                                {/* Team Dropdown */}
                                <div className="form-group" ref={modalTeamDropdownRef}>
                                    <label>ทีม (Team)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            value={modalJobDetails.team}
                                            onChange={e => {
                                                setModalJobDetails({ ...modalJobDetails, team: e.target.value })
                                                setModalShowTeamDropdown(true)
                                            }}
                                            onFocus={() => setModalShowTeamDropdown(true)}
                                            placeholder="ระบุหรือเลือกทีม..."
                                            style={{ width: '100%' }}
                                        />

                                        {modalShowTeamDropdown && (
                                            <div className="dropdown-menu-absolute">
                                                {availableTeams.length > 0 ? (
                                                    availableTeams.filter(t =>
                                                        !modalJobDetails.team ||
                                                        t.name.toLowerCase().includes(modalJobDetails.team.toLowerCase())
                                                    ).map((team, i) => (
                                                        <div
                                                            key={i}
                                                            className="dropdown-item"
                                                            onClick={() => {
                                                                setModalJobDetails({ ...modalJobDetails, team: team.name })
                                                                setModalShowTeamDropdown(false)
                                                            }}
                                                        >
                                                            {team.name} <span style={{ fontSize: 11, color: '#718096' }}>({team.type === 'QC' ? 'QC' : 'ช่าง'})</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="dropdown-item" style={{ color: '#94a3b8' }}>ไม่พบข้อมูลทีม (QC/ช่าง)</div>
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
                            </div>

                            {/* Modal Location Name Combobox */}
                            <div className="form-group" ref={modalLocationNameDropdownRef}>
                                <label>ชื่อสถานที่ติดตั้ง / จัดส่ง</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        value={modalJobDetails.installLocationName}
                                        onChange={e => {
                                            setModalJobDetails({ ...modalJobDetails, installLocationName: e.target.value })
                                            setModalShowLocationNameDropdown(true)
                                        }}
                                        onFocus={() => setModalShowLocationNameDropdown(true)}
                                        placeholder="เลือกหรือระบุชื่อสถานที่..."
                                        style={{ width: '100%' }}
                                    />
                                    {modalShowLocationNameDropdown && (
                                        <div className="dropdown-menu-absolute">
                                            {savedAddresses.length > 0 ? (
                                                <>
                                                    {savedAddresses.filter(item =>
                                                        !modalJobDetails.installLocationName ||
                                                        item.name.toLowerCase().includes(modalJobDetails.installLocationName.toLowerCase()) ||
                                                        savedAddresses.some(saved => saved.name === modalJobDetails.installLocationName)
                                                    ).map((item, i) => (
                                                        <div
                                                            key={i}
                                                            className="dropdown-item"
                                                            onClick={() => handleModalSelectLocationName(item)}
                                                        >
                                                            <div style={{ fontWeight: 600, marginBottom: 2 }}>{item.name}</div>
                                                            <div style={{ fontSize: 12, color: '#718096' }}>{item.address}</div>
                                                            {item.googleMapLink && <small style={{ color: '#0070f3' }}>📍 มีลิงก์แผนที่</small>}
                                                        </div>
                                                    ))}
                                                </>
                                            ) : (
                                                <div className="dropdown-item" style={{ color: '#94a3b8', cursor: 'default' }}>
                                                    ไม่มีข้อมูลสถานที่ที่บันทึกไว้
                                                </div>
                                            )}
                                            <div className="divider" style={{ margin: '4px 0' }}></div>
                                            <div
                                                className="dropdown-item"
                                                onClick={() => {
                                                    // Save temp state
                                                    const state = { customer, taxInvoice, jobInfo, items, shippingFee, discount, deposit };
                                                    localStorage.setItem('order_form_temp', JSON.stringify(state));

                                                    if (customer.id) {
                                                        router.push(`/customers/${customer.id}?tab=address&returnUrl=/order`)
                                                    } else if (customer.name) {
                                                        router.push(`/customers/new?name=${encodeURIComponent(customer.name)}&returnUrl=/order`)
                                                    } else {
                                                        alert('กรุณาระบุชื่อลูกค้าก่อนเพิ่มสถานที่ติดตั้ง')
                                                    }
                                                }}
                                                style={{ color: '#0070f3', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', cursor: 'pointer' }}
                                            >
                                                <span>+</span> เพิ่มสถานที่ติดตั้ง
                                            </div>
                                        </div>
                                    )}
                                </div>
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
                                </div>
                            </div>

                            <div className="form-group">
                                <label>
                                    {modalJobDetails.googleMapLink ? (
                                        <a
                                            href={modalJobDetails.googleMapLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#0070f3', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                        >
                                            🗺️ Google Maps Link
                                        </a>
                                    ) : (
                                        'Google Maps Link'
                                    )}
                                    {modalJobDetails.distance && <span style={{ marginLeft: 8, color: '#0070f3', fontSize: 12 }}>({modalJobDetails.distance} km)</span>}
                                </label>
                                <input
                                    type="text"
                                    value={modalJobDetails.googleMapLink}
                                    onChange={e => setModalJobDetails({ ...modalJobDetails, googleMapLink: e.target.value })}
                                    placeholder="https://maps.google.com/..."
                                />
                            </div>

                            {/* Inspector 1 */}
                            <div className="form-group">
                                <label>ผู้ตรวจงาน 1</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    <input
                                        type="text"
                                        value={modalJobDetails.inspector1.name}
                                        onChange={e => setModalJobDetails({ ...modalJobDetails, inspector1: { ...modalJobDetails.inspector1, name: e.target.value } })}
                                        placeholder="ระบุชื่อผู้ตรวจงาน..."
                                    />
                                    <input
                                        type="text"
                                        value={modalJobDetails.inspector1.phone}
                                        onChange={e => setModalJobDetails({ ...modalJobDetails, inspector1: { ...modalJobDetails.inspector1, phone: e.target.value } })}
                                        placeholder="ระบุเบอร์โทร..."
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
                                        placeholder="ระบุชื่อผู้ตรวจงาน..."
                                    />
                                    <input
                                        type="text"
                                        value={modalJobDetails.inspector2.phone}
                                        onChange={e => setModalJobDetails({ ...modalJobDetails, inspector2: { ...modalJobDetails.inspector2, phone: e.target.value } })}
                                        placeholder="ระบุเบอร์โทร..."
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

        /* Top Layout Grid - Updated to 4 equal columns */
        .top-layout {
          display: grid;
          grid-template-columns: repeat(4, 1fr); /* Equal width for all 4 cards */
          gap: 12px;
          margin-bottom: 16px;
          align-items: stretch; /* Make them same height */
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
          z-index: 10000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          max-height: 300px;
          overflow-y: auto;
          min-width: 280px;
        }

        .dropdown-menu-modal {
          position: fixed;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          z-index: 10001;
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
            overflow: visible;
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
            overflow-y: auto;
            max-height: calc(90vh - 120px);
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
