import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import {
    Home,
    ArrowLeft,
    RefreshCw,
    Save,
    UserPlus,
    Search,
    MapPin,
    Calendar,
    X,
    Plus,
    Trash2
} from 'lucide-react'
import { MOCK_CUSTOMERS_DATA, MOCK_PRODUCTS_DATA, SHOP_LAT, SHOP_LON } from '../lib/mockData'


function currency(n) {
    return n.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })
}



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
        const savedProducts = localStorage.getItem('products_data_v3'); // Using v3 to match Product Management
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
            taxInvoice: {
                ...taxInvoice,
                deliveryAddress: taxInvoice.deliveryAddress || taxInvoice.address
            },
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
    // Alias for JSX usage
    const customerSearchResults = filteredCustomers

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
            mediaSource: selectedCustomer.mediaSource || '',
            mediaSourceOther: selectedCustomer.mediaSourceOther || '',
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
    // Alias for JSX usage
    const selectCustomer = handleSelectCustomer

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
                (p.name && p.name.toLowerCase().includes(lowerTerm)) ||
                (p.type && p.type.toLowerCase().includes(lowerTerm)) ||
                (p.category && p.category.toLowerCase().includes(lowerTerm)) ||
                (p.description && p.description.toLowerCase().includes(lowerTerm)) ||
                (p.material && p.material.toLowerCase().includes(lowerTerm)) ||
                (p.color && p.color.toLowerCase().includes(lowerTerm)) ||
                (p.crystalColor && p.crystalColor.toLowerCase().includes(lowerTerm)) ||
                (p.bulbType && p.bulbType.toLowerCase().includes(lowerTerm)) ||
                (p.light && p.light.toLowerCase().includes(lowerTerm)) ||
                (p.remote && p.remote.toLowerCase().includes(lowerTerm)) ||
                (p.length && p.length.toString().includes(lowerTerm)) ||
                (p.width && p.width.toString().includes(lowerTerm)) ||
                (p.height && p.height.toString().includes(lowerTerm))
            ); // Show all results (no limit)
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };

    const selectProduct = (index, product) => {
        const newItems = [...items];
        newItems[index] = {
            ...newItems[index],
            code: product.id || '',
            description: product.description || '',
            image: product.images && product.images[0] ? product.images[0] : null,
            price: product.price || 0,
            unitPrice: product.price || 0, // Add unitPrice

            // Extra fields for display
            category: product.category || '',
            subcategory: product.subcategory || '',
            material: product.material || '',
            length: product.length || '',
            width: product.width || '',
            height: product.height || '',
            color: product.color || '',
            crystalColor: product.crystalColor || '',
            bulbType: product.bulbType || '',
            light: product.light || '',
            remote: product.remote || '',

            _searchTerm: '' // Clear search term
        };
        console.log('selectProduct called:', { index, productId: product.id, newCode: newItems[index].code });
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
    const shipping = Number(shippingFee || 0)
    const subtotalPlusShipping = subtotal + shipping

    let discountAmount = 0
    if (discount.mode === 'percent') {
        discountAmount = subtotalPlusShipping * (Number(discount.value || 0) / 100)
    } else {
        discountAmount = Number(discount.value || 0)
    }

    const afterDiscount = Math.max(0, subtotalPlusShipping - discountAmount)
    const vatAmount = afterDiscount * vatRate
    const total = afterDiscount + vatAmount

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
            image: product.image || '',
            _searchTerm: '' // Clear search term
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
        const newItems = items.filter((_, i) => i !== index);
        // If all items deleted, add one empty row
        if (newItems.length === 0) {
            setItems([{ code: '', description: '', quantity: 1, price: 0, image: null }]);
        } else {
            setItems(newItems);
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
        const existingJob = items[index].specificJob || {}

        // Merge existing specific job with master job info for missing fields
        const currentJob = {
            type: existingJob.type || jobInfo.jobType || 'installation',
            team: existingJob.team || jobInfo.team || '',
            dateTime: existingJob.dateTime || jobInfo.appointmentDate || '',
            installLocationName: existingJob.installLocationName || jobInfo.installLocationName || '',
            address: existingJob.address || jobInfo.installAddress || '',
            googleMapLink: existingJob.googleMapLink || jobInfo.googleMapLink || '',
            inspector1: existingJob.inspector1 || jobInfo.inspector1 || { name: '', phone: '' },
            inspector2: existingJob.inspector2 || jobInfo.inspector2 || { name: '', phone: '' },
            distance: existingJob.distance || jobInfo.distance || ''
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
        <div className="space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-secondary-200">
                <div className="flex flex-col gap-1">
                    <h1 className="text-xl font-bold text-secondary-900">บันทึกข้อมูลสั่งซื้อ (Purchase Order Entry)</h1>
                    <div className="flex items-center gap-2 text-sm text-secondary-500">
                        <Calendar size={16} />
                        <span>วันที่สั่งซื้อ:</span>
                        <input
                            type="date"
                            value={jobInfo.orderDate}
                            onChange={e => setJobInfo({ ...jobInfo, orderDate: e.target.value })}
                            className="px-2 py-1 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="p-2 text-secondary-600 hover:bg-secondary-100 rounded-lg transition-colors"
                        onClick={() => router.push('/')}
                        title="กลับหน้าหลัก"
                    >
                        <Home size={20} />
                    </button>
                    <button
                        className="flex items-center gap-2 px-3 py-2 text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft size={18} />
                        <span>ย้อนกลับ</span>
                    </button>
                    <button
                        className="flex items-center gap-2 px-3 py-2 text-secondary-700 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
                        onClick={() => {
                            const confirmed = confirm('รีโหลดข้อมูลสินค้าใหม่? (ใช้เมื่อค้นหาสินค้าไม่เจอ)')
                            if (confirmed) {
                                const products = localStorage.getItem('products_data_v3')
                                if (products) {
                                    const parsed = JSON.parse(products)
                                    setAllProducts(parsed)
                                    setProductsData(parsed)
                                    alert(`โหลดข้อมูลสินค้าสำเร็จ: ${parsed.length} รายการ`)
                                } else {
                                    alert('ไม่พบข้อมูลสินค้า กรุณาตรวจสอบที่หน้า "จัดการสินค้า"')
                                }
                            }
                        }}
                        title="รีโหลดข้อมูลสินค้า"
                    >
                        <RefreshCw size={18} />
                        <span className="hidden sm:inline">รีโหลดสินค้า</span>
                    </button>
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-sm transition-colors"
                        onClick={handleSaveOrder}
                    >
                        <Save size={18} />
                        <span>บันทึกข้อมูล</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Customer Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-secondary-900 border-l-4 border-primary-500 pl-3">
                            ข้อมูลลูกค้า (Customer)
                        </h2>
                        <a
                            href="/customers"
                            target="_blank"
                            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                        >
                            <UserPlus size={14} />
                            จัดการลูกค้า
                        </a>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1 relative" ref={customerDropdownRef}>
                            <label className="text-sm font-medium text-secondary-700">ชื่อลูกค้า / บริษัท</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="ระบุชื่อลูกค้า หรือ บริษัท"
                                    value={customer.name}
                                    onChange={e => {
                                        handleCustomerChange('name', e.target.value)
                                        setShowCustomerDropdown(true)
                                    }}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                    className="w-full pl-9 pr-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                />
                                {/* Customer Dropdown */}
                                {showCustomerDropdown && customerSearchResults.length > 0 && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {customerSearchResults.map((c, idx) => (
                                            <div
                                                key={idx}
                                                className="px-4 py-2 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0"
                                                onClick={() => selectCustomer(c)}
                                            >
                                                <div className="font-medium text-secondary-900">{c.name}</div>
                                                {c.taxInvoices && c.taxInvoices[0] && (
                                                    <div className="text-xs text-secondary-500">Tax ID: {c.taxInvoices[0].taxId}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-secondary-700">เบอร์โทรศัพท์</label>
                                <input
                                    type="text"
                                    value={customer.phone}
                                    onChange={e => handleCustomerChange('phone', e.target.value)}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-secondary-700">Email</label>
                                <input
                                    type="email"
                                    value={customer.email}
                                    onChange={e => handleCustomerChange('email', e.target.value)}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                />
                            </div>

                            {/* Social Media Fields */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-secondary-700">LINE ID</label>
                                <input
                                    type="text"
                                    value={customer.line}
                                    onChange={e => handleCustomerChange('line', e.target.value)}
                                    placeholder="@lineid"
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-secondary-700">Facebook</label>
                                <input
                                    type="text"
                                    value={customer.facebook}
                                    onChange={e => handleCustomerChange('facebook', e.target.value)}
                                    placeholder="Facebook Name/Link"
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-secondary-700">Instagram</label>
                                <input
                                    type="text"
                                    value={customer.instagram}
                                    onChange={e => handleCustomerChange('instagram', e.target.value)}
                                    placeholder="Instagram Name/Link"
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-secondary-700">ที่มา (Media Source)</label>
                                <select
                                    value={customer.mediaSource}
                                    onChange={e => handleCustomerChange('mediaSource', e.target.value)}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                >
                                    <option value="">-- เลือกที่มา --</option>
                                    <option value="Facebook">Facebook</option>
                                    <option value="Line">Line</option>
                                    <option value="Google">Google</option>
                                    <option value="Walk-in">Walk-in</option>
                                    <option value="เพื่อนแนะนำ">เพื่อนแนะนำ</option>
                                    <option value="อื่นๆ">อื่นๆ</option>
                                </select>
                            </div>
                            {customer.mediaSource === 'อื่นๆ' && (
                                <div className="space-y-1 sm:col-span-2">
                                    <label className="text-sm font-medium text-secondary-700">ระบุที่มาอื่นๆ</label>
                                    <input
                                        type="text"
                                        value={customer.mediaSourceOther}
                                        onChange={e => handleCustomerChange('mediaSourceOther', e.target.value)}
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                    />
                                </div>
                            )}

                            {/* Contact Persons */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-secondary-700">ผู้ติดต่อ 1 (ชื่อ)</label>
                                <input
                                    type="text"
                                    value={customer.contact1?.name || ''}
                                    onChange={e => handleCustomerChange('name', e.target.value, 'contact1')}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-secondary-700">ผู้ติดต่อ 1 (เบอร์โทร)</label>
                                <input
                                    type="text"
                                    value={customer.contact1?.phone || ''}
                                    onChange={e => handleCustomerChange('phone', e.target.value, 'contact1')}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-secondary-700">ผู้ติดต่อ 2 (ชื่อ)</label>
                                <input
                                    type="text"
                                    value={customer.contact2?.name || ''}
                                    onChange={e => handleCustomerChange('name', e.target.value, 'contact2')}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-secondary-700">ผู้ติดต่อ 2 (เบอร์โทร)</label>
                                <input
                                    type="text"
                                    value={customer.contact2?.phone || ''}
                                    onChange={e => handleCustomerChange('phone', e.target.value, 'contact2')}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Tax Invoice Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200 space-y-4" ref={taxDropdownRef}>
                    <h2 className="text-lg font-semibold text-secondary-900 border-l-4 border-primary-500 pl-3">
                        ข้อมูลใบกำกับภาษี (Tax Invoice)
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2 space-y-1 relative">
                            <label className="text-sm font-medium text-secondary-700">ชื่อบริษัท</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={taxInvoice.companyName}
                                    onChange={e => {
                                        handleTaxInvoiceChange('companyName', e.target.value)
                                        setShowTaxDropdown(true)
                                    }}
                                    onFocus={() => setShowTaxDropdown(true)}
                                    placeholder="ระบุชื่อบริษัท..."
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                />
                                {showTaxDropdown && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {savedTaxProfiles.length > 0 ? (
                                            <>
                                                {savedTaxProfiles.filter(p =>
                                                    !taxInvoice.companyName ||
                                                    p.companyName.toLowerCase().includes(taxInvoice.companyName.toLowerCase()) ||
                                                    savedTaxProfiles.some(saved => saved.companyName === taxInvoice.companyName)
                                                ).map((profile, i) => (
                                                    <div
                                                        key={i}
                                                        className="px-4 py-2 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0"
                                                        onClick={() => handleSelectTaxProfile(profile)}
                                                    >
                                                        <div className="font-medium text-secondary-900">{profile.companyName}</div>
                                                        <div className="text-xs text-secondary-500">เลขที่: {profile.taxId || '-'}</div>
                                                    </div>
                                                ))}
                                                {taxInvoice.companyName && taxInvoice.taxId && !savedTaxProfiles.some(
                                                    p => p.companyName === taxInvoice.companyName && p.taxId === taxInvoice.taxId
                                                ) && (
                                                        <div
                                                            className="px-4 py-2 text-primary-600 hover:bg-primary-50 cursor-pointer font-medium flex items-center gap-2"
                                                            onClick={handleSaveTaxProfile}
                                                        >
                                                            <Plus size={14} />
                                                            บันทึกชุดข้อมูลปัจจุบัน
                                                        </div>
                                                    )}
                                                <div className="border-t border-secondary-100 my-1"></div>
                                                <div
                                                    className="px-4 py-2 text-primary-600 hover:bg-primary-50 cursor-pointer flex items-center gap-2 justify-center"
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
                                                >
                                                    <Plus size={14} />
                                                    เพิ่มข้อมูลใบกำกับภาษี
                                                </div>
                                            </>
                                        ) : (
                                            <div className="px-4 py-2 text-secondary-400 italic cursor-default text-center">
                                                ไม่มีข้อมูลใบกำกับภาษีที่บันทึกไว้
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-secondary-700">สาขา</label>
                            <input
                                type="text"
                                value={taxInvoice.branch}
                                onChange={e => handleTaxInvoiceChange('branch', e.target.value)}
                                placeholder="ระบุสาขา..."
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-secondary-700">เลขที่ผู้เสียภาษี</label>
                            <input
                                type="text"
                                value={taxInvoice.taxId}
                                onChange={e => handleTaxInvoiceChange('taxId', e.target.value)}
                                placeholder="ระบุเลขที่ผู้เสียภาษี..."
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                            />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                            <label className="text-sm font-medium text-secondary-700">ที่อยู่</label>
                            <textarea
                                rows={2}
                                value={taxInvoice.address}
                                onChange={e => handleTaxInvoiceChange('address', e.target.value)}
                                placeholder="ระบุที่อยู่..."
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                            />
                        </div>
                        {/* Checkbox removed */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-secondary-700">เบอร์โทรศัพท์</label>
                            <input
                                type="text"
                                value={taxInvoice.phone}
                                onChange={e => handleTaxInvoiceChange('phone', e.target.value)}
                                placeholder="ระบุเบอร์โทรศัพท์..."
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-secondary-700">อีเมล</label>
                            <input
                                type="email"
                                value={taxInvoice.email}
                                onChange={e => handleTaxInvoiceChange('email', e.target.value)}
                                placeholder="ระบุอีเมล..."
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                            />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                            <label className="text-sm font-medium text-secondary-700">ที่อยู่จัดส่งใบกำกับภาษี</label>
                            <input
                                type="text"
                                value={taxInvoice.deliveryAddress}
                                onChange={e => handleTaxInvoiceChange('deliveryAddress', e.target.value)}
                                placeholder="ระบุที่อยู่จัดส่ง..."
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Job Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200 space-y-4">
                    <h2 className="text-lg font-semibold text-secondary-900 border-l-4 border-primary-500 pl-3">
                        ข้อมูลงานหลัก (Master Job)
                    </h2>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-secondary-700">ประเภทงาน</label>
                            <select
                                value={jobInfo.jobType}
                                onChange={e => setJobInfo({ ...jobInfo, jobType: e.target.value })}
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                            >
                                <option value="installation">งานติดตั้ง (Installation)</option>
                                <option value="delivery">งานจัดส่ง (Delivery)</option>
                                <option value="separate_job">Jobงานแยก (Separate Job)</option>
                            </select>
                        </div>

                        {/* Team and Appointment Date - Two Columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Team Dropdown */}
                            <div className="space-y-1 relative" ref={teamDropdownRef}>
                                <label className="text-sm font-medium text-secondary-700">ทีม (Team)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={jobInfo.team}
                                        onChange={e => {
                                            setJobInfo({ ...jobInfo, team: e.target.value })
                                            setShowTeamDropdown(true)
                                        }}
                                        onFocus={() => setShowTeamDropdown(true)}
                                        placeholder="ระบุหรือเลือกทีม..."
                                        className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                    />
                                    {showTeamDropdown && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {availableTeams.length > 0 ? (
                                                availableTeams.filter(t =>
                                                    !jobInfo.team ||
                                                    t.name.toLowerCase().includes(jobInfo.team.toLowerCase())
                                                ).map((team, i) => (
                                                    <div
                                                        key={i}
                                                        className="px-4 py-2 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0"
                                                        onClick={() => {
                                                            setJobInfo({ ...jobInfo, team: team.name })
                                                            setShowTeamDropdown(false)
                                                        }}
                                                    >
                                                        <div className="font-medium text-secondary-900">{team.name}</div>
                                                        <div className="text-xs text-secondary-500">({team.type === 'QC' ? 'QC' : 'ช่าง'})</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-2 text-secondary-400 italic cursor-default text-center">
                                                    ไม่พบข้อมูลทีม
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-secondary-700">วัน-เวลาที่นัดหมาย</label>
                                <input
                                    type="datetime-local"
                                    value={jobInfo.appointmentDate}
                                    onChange={e => setJobInfo({ ...jobInfo, appointmentDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                />
                            </div>
                        </div>

                        {/* Location Name Combobox */}
                        <div className="space-y-1 relative" ref={locationNameDropdownRef}>
                            <label className="text-sm font-medium text-secondary-700">ชื่อสถานที่ติดตั้ง / จัดส่ง</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={jobInfo.installLocationName}
                                    onChange={e => {
                                        setJobInfo({ ...jobInfo, installLocationName: e.target.value })
                                        setShowLocationNameDropdown(true)
                                    }}
                                    onFocus={() => setShowLocationNameDropdown(true)}
                                    placeholder="เลือกหรือระบุชื่อสถานที่..."
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                />
                                {showLocationNameDropdown && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                        {savedAddresses.length > 0 ? (
                                            <>
                                                {savedAddresses.filter(item =>
                                                    !jobInfo.installLocationName ||
                                                    item.name.toLowerCase().includes(jobInfo.installLocationName.toLowerCase()) ||
                                                    savedAddresses.some(saved => saved.name === jobInfo.installLocationName)
                                                ).map((item, i) => (
                                                    <div
                                                        key={i}
                                                        className="px-4 py-2 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0"
                                                        onClick={() => handleSelectLocationName(item)}
                                                    >
                                                        <div className="font-medium text-secondary-900 mb-0.5">{item.name}</div>
                                                        <div className="text-xs text-secondary-500">{item.address}</div>
                                                        {item.googleMapLink && <div className="text-xs text-primary-500 mt-0.5 flex items-center gap-1"><MapPin size={10} /> มีลิงก์แผนที่</div>}
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="px-4 py-2 text-secondary-400 italic cursor-default text-center">
                                                ไม่มีข้อมูลสถานที่ที่บันทึกไว้
                                            </div>
                                        )}
                                        <div className="border-t border-secondary-100 my-1"></div>
                                        <div
                                            className="px-4 py-2 text-primary-600 hover:bg-primary-50 cursor-pointer flex items-center gap-2 justify-center"
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
                                        >
                                            <Plus size={14} />
                                            เพิ่มสถานที่ติดตั้ง
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Address Combobox */}
                        <div className="space-y-1 relative" ref={addressDropdownRef}>
                            <label className="text-sm font-medium text-secondary-700">สถานที่ติดตั้ง / จัดส่ง</label>
                            <div className="relative">
                                <textarea
                                    rows={2}
                                    value={jobInfo.installAddress}
                                    onChange={e => {
                                        setJobInfo({ ...jobInfo, installAddress: e.target.value })
                                        setShowAddressDropdown(true)
                                    }}
                                    onFocus={() => setShowAddressDropdown(true)}
                                    placeholder="ระบุสถานที่..."
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                />
                            </div>
                        </div>

                        {/* Google Maps Link */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-secondary-700 flex items-center gap-2">
                                {jobInfo.googleMapLink ? (
                                    <a
                                        href={jobInfo.googleMapLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:underline"
                                    >
                                        <MapPin size={14} /> Google Maps Link
                                    </a>
                                ) : (
                                    'Google Maps Link'
                                )}
                                {jobInfo.distance && <span className="text-xs text-primary-600">({jobInfo.distance} km)</span>}
                            </label>
                            <input
                                type="text"
                                value={jobInfo.googleMapLink}
                                onChange={e => setJobInfo({ ...jobInfo, googleMapLink: e.target.value })}
                                placeholder="https://maps.google.com/..."
                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                            />
                        </div>

                        {/* Inspector 1 */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-secondary-700">ผู้ตรวจงาน 1</label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    value={jobInfo.inspector1.name}
                                    onChange={e => setJobInfo({ ...jobInfo, inspector1: { ...jobInfo.inspector1, name: e.target.value } })}
                                    placeholder="ระบุชื่อผู้ตรวจงาน..."
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                />
                                <input
                                    type="text"
                                    value={jobInfo.inspector1.phone}
                                    onChange={e => setJobInfo({ ...jobInfo, inspector1: { ...jobInfo.inspector1, phone: e.target.value } })}
                                    placeholder="ระบุเบอร์โทร..."
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                />
                            </div>
                        </div>

                        {/* Inspector 2 */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-secondary-700">ผู้ตรวจงาน 2</label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    value={jobInfo.inspector2.name}
                                    onChange={e => setJobInfo({ ...jobInfo, inspector2: { ...jobInfo.inspector2, name: e.target.value } })}
                                    placeholder="ระบุชื่อผู้ตรวจงาน..."
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                />
                                <input
                                    type="text"
                                    value={jobInfo.inspector2.phone}
                                    onChange={e => setJobInfo({ ...jobInfo, inspector2: { ...jobInfo.inspector2, phone: e.target.value } })}
                                    placeholder="ระบุเบอร์โทร..."
                                    className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Summary & Note Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200 space-y-4">
                    <h2 className="text-lg font-semibold text-secondary-900 border-l-4 border-primary-500 pl-3">
                        สรุปยอด (Summary)
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-secondary-100">
                            <span className="text-sm text-secondary-700">รวมเป็นเงิน</span>
                            <span className="text-sm font-medium text-secondary-900">{currency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-secondary-100">
                            <span className="text-sm text-secondary-700">ค่าเดินทาง/จัดส่ง</span>
                            <input
                                type="number"
                                min={0}
                                value={shippingFee}
                                onChange={e => {
                                    const val = e.target.value
                                    setShippingFee(val === '' ? '' : Number(val))
                                }}
                                placeholder="0"
                                className="w-24 px-2 py-1 text-right border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            />
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-secondary-100">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-secondary-700">ส่วนลด</span>
                                <select
                                    value={discount.mode}
                                    onChange={e => setDiscount({ ...discount, mode: e.target.value })}
                                    className="px-2 py-1 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                >
                                    <option value="percent">%</option>
                                    <option value="amount">฿</option>
                                </select>
                                <input
                                    type="number"
                                    value={discount.value}
                                    onChange={e => setDiscount({ ...discount, value: Number(e.target.value) })}
                                    className="w-20 px-2 py-1 text-right border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                />
                            </div>
                            <span className="text-sm font-medium text-red-600">-{currency(discountAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-secondary-100">
                            <span className="text-sm text-secondary-700">หลังหักส่วนลด</span>
                            <span className="text-sm font-medium text-secondary-900">{currency(afterDiscount)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-secondary-100">
                            <span className="text-sm text-secondary-700">VAT 7%</span>
                            <span className="text-sm font-medium text-secondary-900">{currency(vatAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b-2 border-secondary-300 bg-secondary-50 -mx-6 px-6">
                            <span className="text-base font-semibold text-secondary-900">ยอดรวมทั้งสิ้น</span>
                            <span className="text-lg font-bold text-primary-600">{currency(total)}</span>
                        </div>

                        <div className="border-t border-secondary-200 pt-3 mt-3"></div>

                        <div className="flex justify-between items-center py-2 border-b border-secondary-100">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-secondary-700">มัดจำ</span>
                                <select
                                    value={deposit.mode}
                                    onChange={e => setDeposit({ ...deposit, mode: e.target.value })}
                                    className="px-2 py-1 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                >
                                    <option value="percent">%</option>
                                    <option value="amount">฿</option>
                                </select>
                                <input
                                    type="number"
                                    value={deposit.value}
                                    onChange={e => setDeposit({ ...deposit, value: Number(e.target.value) })}
                                    className="w-20 px-2 py-1 text-right border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                />
                            </div>
                            <span className="text-sm font-medium text-secondary-900">{currency(depositAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 bg-amber-50 -mx-6 px-6 rounded-b-lg">
                            <span className="text-base font-semibold text-amber-900">ยอดคงค้าง</span>
                            <span className="text-lg font-bold text-amber-600">{currency(outstanding)}</span>
                        </div>
                    </div>

                    <div className="mt-4 space-y-1">
                        <label className="text-sm font-medium text-secondary-700">หมายเหตุ (Note)</label>
                        <textarea
                            rows={3}
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="ระบุหมายเหตุ..."
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow resize-y"
                        />
                    </div>
                </div>
            </div>

            {/* 5. Items Section (Full Width Bottom) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-secondary-200 space-y-4">
                <h2 className="text-lg font-semibold text-secondary-900 border-l-4 border-primary-500 pl-3">
                    รายการสินค้า (Order Items)
                </h2>
                <div className="overflow-x-auto rounded-lg border border-secondary-200">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-secondary-50 border-b border-secondary-200">
                                <th className="px-4 py-3 text-center text-xs font-medium text-secondary-500 uppercase tracking-wider w-12">#</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-secondary-500 uppercase tracking-wider w-24">รูปภาพ</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider min-w-[200px]">ข้อมูลสินค้า</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider w-48">หมายเหตุ</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-secondary-500 uppercase tracking-wider w-20">Job</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-secondary-500 uppercase tracking-wider w-20">จำนวน</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider w-32">ราคา/หน่วย</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider w-32">รวม</th>
                                <th className="px-4 py-3 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-secondary-100">
                            {items.map((item, idx) => {
                                // Smart product info display (same as Product Management)
                                const productInfo = [
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
                                    <tr key={idx} className="hover:bg-secondary-50/50 transition-colors">
                                        <td className="px-4 py-3 text-center text-sm text-secondary-500 align-top pt-4">{idx + 1}</td>
                                        <td className="px-4 py-3 align-top">
                                            <div className="flex justify-center">
                                                {(item.images && item.images[0]) ? (
                                                    <div className="relative w-16 h-16 rounded-lg border border-secondary-200 overflow-hidden group">
                                                        <img src={item.images[0]} alt="Product" className="w-full h-full object-cover" />
                                                        <button
                                                            className="absolute top-0.5 right-0.5 bg-black/50 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => removeImage(idx)}
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ) : item.image ? (
                                                    <div className="relative w-16 h-16 rounded-lg border border-secondary-200 overflow-hidden group">
                                                        <img src={item.image} alt="Product" className="w-full h-full object-cover" />
                                                        <button
                                                            className="absolute top-0.5 right-0.5 bg-black/50 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => removeImage(idx)}
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <label htmlFor={`img-${idx}`} className="w-16 h-16 rounded-lg border-2 border-dashed border-secondary-300 flex items-center justify-center text-secondary-400 hover:text-primary-500 hover:border-primary-500 hover:bg-primary-50 cursor-pointer transition-colors">
                                                            <Plus size={20} />
                                                        </label>
                                                        <input
                                                            id={`img-${idx}`}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleImageChange(idx, e)}
                                                            className="hidden"
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            {!item.code ? (
                                                <div className="relative w-full">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={16} />
                                                    <input
                                                        type="text"
                                                        className="w-full pl-9 pr-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-sm"
                                                        placeholder="ค้นหารหัสสินค้า..."
                                                        value={item._searchTerm !== undefined ? item._searchTerm : ''}
                                                        onChange={(e) => handleSearchProduct(idx, e.target.value)}
                                                        onFocus={() => setActiveSearchIndex(idx)}
                                                    />
                                                    {/* Dropdown Results */}
                                                    {activeSearchIndex === idx && searchResults.length > 0 && (
                                                        <div className="absolute z-50 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                            {searchResults.map(p => (
                                                                <div
                                                                    key={p.id}
                                                                    className="px-4 py-2 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0 flex items-center gap-3"
                                                                    onMouseDown={(e) => {
                                                                        e.preventDefault();
                                                                        e.stopPropagation();
                                                                        selectProduct(idx, p);
                                                                    }}
                                                                >
                                                                    <div className="w-10 h-10 bg-secondary-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                                                                        {p.images && p.images[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <span className="text-lg">📷</span>}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-semibold text-secondary-900 text-sm">{p.id}</div>
                                                                        <div className="text-xs text-secondary-500">{currency(p.price)}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <div className="p-2 text-center text-xs bg-secondary-50 border-t border-secondary-100">
                                                                <a href="/products" target="_blank" className="text-primary-600 hover:text-primary-700 hover:underline flex items-center justify-center gap-1">
                                                                    <Plus size={12} /> เพิ่มสินค้าใหม่ (ไปหน้าจัดการสินค้า)
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex justify-between items-start gap-2">
                                                    <div>
                                                        <div className="font-semibold text-secondary-900">{item.code}</div>
                                                        <div className="text-xs text-secondary-600 leading-relaxed mt-0.5">
                                                            {productInfo || '-'}
                                                        </div>
                                                        {item.description && (
                                                            <div className="text-xs text-secondary-400 mt-1 italic">
                                                                {item.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        className="text-secondary-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                                        onClick={() => clearRowProduct(idx)}
                                                        title="เปลี่ยนสินค้า"
                                                    >
                                                        <RefreshCw size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 align-top">
                                            <textarea
                                                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-sm min-h-[38px] resize-y"
                                                value={item.note}
                                                onChange={e => handleItemChange(idx, 'note', e.target.value)}
                                                rows={2}
                                                placeholder="ระบุหมายเหตุ..."
                                            />
                                        </td>
                                        <td className="px-4 py-3 align-top text-center pt-4">
                                            <button
                                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors w-full ${jobInfo.jobType !== 'separate_job'
                                                    ? 'bg-primary-100 text-primary-700 hover:bg-primary-200' // Master Job active
                                                    : item.specificJob ? 'bg-primary-100 text-primary-700 hover:bg-primary-200' : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200' // Separate Job logic
                                                    }`}
                                                onClick={() => openJobModal(idx)}
                                            >
                                                {jobInfo.jobType !== 'separate_job' ? (
                                                    jobInfo.jobType === 'installation' ? 'ติดตั้ง' :
                                                        jobInfo.jobType === 'delivery' ? 'จัดส่ง' : 'งานหลัก'
                                                ) : (
                                                    item.specificJob ? (
                                                        item.specificJob.type === 'installation' ? 'ติดตั้ง' :
                                                            item.specificJob.type === 'delivery' ? 'จัดส่ง' : 'งานแยก'
                                                    ) : 'ระบุ'
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 align-top pt-3">
                                            <input
                                                type="number"
                                                className="w-full px-2 py-1.5 text-center border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-sm"
                                                min={1}
                                                value={item.qty}
                                                onChange={e => handleItemChange(idx, 'qty', Number(e.target.value))}
                                            />
                                        </td>
                                        <td className="px-4 py-3 align-top pt-3">
                                            <input
                                                type="number"
                                                className="w-full px-2 py-1.5 text-right border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow text-sm"
                                                value={item.unitPrice}
                                                onChange={e => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                                            />
                                        </td>
                                        <td className="px-4 py-3 align-top text-right text-sm font-medium text-secondary-900 pt-4">
                                            {currency(item.qty * item.unitPrice)}
                                        </td>
                                        <td className="px-4 py-3 align-top text-center pt-3">
                                            <button
                                                className="text-secondary-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                                                onClick={() => removeItem(idx)}
                                                tabIndex={-1}
                                                title="ลบรายการ"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <button
                        className="w-full py-3 border-2 border-dashed border-secondary-300 rounded-b-lg text-secondary-500 hover:text-primary-600 hover:border-primary-500 hover:bg-primary-50 transition-all flex items-center justify-center gap-2 font-medium text-sm"
                        onClick={addItem}
                    >
                        <Plus size={16} /> เพิ่มรายการสินค้า
                    </button>
                </div>
            </div>

            {/* Job Detail Modal */}
            {
                showJobModal && (
                    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="px-6 py-4 border-b border-secondary-200 flex justify-between items-center bg-secondary-50">
                                <h3 className="text-lg font-semibold text-secondary-900">รายละเอียดงาน (Job Details) - รายการที่ {activeItemIndex + 1}</h3>
                                <button
                                    className="text-secondary-400 hover:text-secondary-600 hover:bg-secondary-200 p-1 rounded-full transition-colors"
                                    onClick={closeJobModal}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                                {/* Logic Check: Is Job Editable? */}
                                {(() => {
                                    const isJobEditable = jobInfo.jobType === 'separate_job';

                                    return (<>
                                        {!isJobEditable && (
                                            <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg text-sm border border-blue-200 flex items-start gap-2">
                                                <Info size={16} className="mt-0.5 flex-shrink-0" />
                                                <span>ข้อมูลถูกอ้างอิงจากงานหลัก (Master Job) ไม่สามารถแก้ไขได้ หากต้องการแยกงาน กรุณาเลือกประเภทงานหลักเป็น "Job งานแยก"</span>
                                            </div>
                                        )}

                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-secondary-700">ประเภทงาน</label>
                                            <select
                                                value={modalJobDetails.type}
                                                onChange={e => setModalJobDetails({ ...modalJobDetails, type: e.target.value })}
                                                disabled={!isJobEditable}
                                                className={`w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow ${!isJobEditable ? 'bg-secondary-100 cursor-not-allowed text-secondary-500' : ''}`}
                                            >
                                                <option value="installation">งานติดตั้ง (Installation)</option>
                                                <option value="delivery">งานจัดส่ง (Delivery)</option>
                                            </select>
                                        </div>
                                        {/* Team and Appointment Date - Two Columns */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Team Dropdown */}
                                            <div className="space-y-1 relative" ref={modalTeamDropdownRef}>
                                                <label className="text-sm font-medium text-secondary-700">ทีม (Team)</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={modalJobDetails.team}
                                                        onChange={e => {
                                                            setModalJobDetails({ ...modalJobDetails, team: e.target.value })
                                                            setModalShowTeamDropdown(true)
                                                        }}
                                                        onFocus={() => isJobEditable && setModalShowTeamDropdown(true)}
                                                        placeholder="ระบุหรือเลือกทีม..."
                                                        className={`w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow ${!isJobEditable ? 'bg-secondary-100 cursor-not-allowed text-secondary-500' : ''}`}
                                                        disabled={!isJobEditable}
                                                    />

                                                    {isJobEditable && modalShowTeamDropdown && (
                                                        <div className="absolute z-50 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                            {availableTeams.length > 0 ? (
                                                                availableTeams.filter(t =>
                                                                    !modalJobDetails.team ||
                                                                    t.name.toLowerCase().includes(modalJobDetails.team.toLowerCase())
                                                                ).map((team, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="px-4 py-2 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0"
                                                                        onClick={() => {
                                                                            setModalJobDetails({ ...modalJobDetails, team: team.name })
                                                                            setModalShowTeamDropdown(false)
                                                                        }}
                                                                    >
                                                                        <div className="font-medium text-secondary-900">{team.name}</div>
                                                                        <div className="text-xs text-secondary-500">({team.type === 'QC' ? 'QC' : 'ช่าง'})</div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="px-4 py-2 text-secondary-400 italic cursor-default text-center">
                                                                    ไม่พบข้อมูลทีม
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-secondary-700">วัน-เวลาที่ติดตั้ง/จัดส่ง</label>
                                                <input
                                                    type="datetime-local"
                                                    value={modalJobDetails.dateTime}
                                                    onChange={e => setModalJobDetails({ ...modalJobDetails, dateTime: e.target.value })}
                                                    disabled={!isJobEditable}
                                                    className={`w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow ${!isJobEditable ? 'bg-secondary-100 cursor-not-allowed text-secondary-500' : ''}`}
                                                />
                                            </div>
                                        </div>

                                        {/* Modal Location Name Combobox */}
                                        <div className="space-y-1 relative" ref={modalLocationNameDropdownRef}>
                                            <label className="text-sm font-medium text-secondary-700">ชื่อสถานที่ติดตั้ง / จัดส่ง</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={modalJobDetails.installLocationName}
                                                    onChange={e => {
                                                        setModalJobDetails({ ...modalJobDetails, installLocationName: e.target.value })
                                                        setModalShowLocationNameDropdown(true)
                                                    }}
                                                    onFocus={() => isJobEditable && setModalShowLocationNameDropdown(true)}
                                                    placeholder="เลือกหรือระบุชื่อสถานที่..."
                                                    className={`w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow ${!isJobEditable ? 'bg-secondary-100 cursor-not-allowed text-secondary-500' : ''}`}
                                                    disabled={!isJobEditable}
                                                />
                                                {isJobEditable && modalShowLocationNameDropdown && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-secondary-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                        {savedAddresses.length > 0 ? (
                                                            <>
                                                                {savedAddresses.filter(item =>
                                                                    !modalJobDetails.installLocationName ||
                                                                    item.name.toLowerCase().includes(modalJobDetails.installLocationName.toLowerCase()) ||
                                                                    savedAddresses.some(saved => saved.name === modalJobDetails.installLocationName)
                                                                ).map((item, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="px-4 py-2 hover:bg-secondary-50 cursor-pointer border-b border-secondary-100 last:border-0"
                                                                        onClick={() => handleModalSelectLocationName(item)}
                                                                    >
                                                                        <div className="font-medium text-secondary-900 mb-0.5">{item.name}</div>
                                                                        <div className="text-xs text-secondary-500">{item.address}</div>
                                                                        {item.googleMapLink && <div className="text-xs text-primary-500 mt-0.5 flex items-center gap-1"><MapPin size={10} /> มีลิงก์แผนที่</div>}
                                                                    </div>
                                                                ))}
                                                            </>
                                                        ) : (
                                                            <div className="px-4 py-2 text-secondary-400 italic cursor-default text-center">
                                                                ไม่มีข้อมูลสถานที่ที่บันทึกไว้
                                                            </div>
                                                        )}
                                                        <div className="border-t border-secondary-100 my-1"></div>
                                                        <div
                                                            className="px-4 py-2 text-primary-600 hover:bg-primary-50 cursor-pointer flex items-center gap-2 justify-center"
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
                                                        >
                                                            <Plus size={14} />
                                                            เพิ่มสถานที่ติดตั้ง
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-1 relative" ref={modalAddressDropdownRef}>
                                            <label className="text-sm font-medium text-secondary-700">สถานที่ติดตั้ง / จัดส่ง</label>
                                            <div className="relative">
                                                <textarea
                                                    rows={3}
                                                    value={modalJobDetails.address}
                                                    onChange={e => setModalJobDetails({ ...modalJobDetails, address: e.target.value })}
                                                    placeholder="ระบุสถานที่..."
                                                    className={`w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow ${!isJobEditable ? 'bg-secondary-100 cursor-not-allowed text-secondary-500' : ''}`}
                                                    disabled={!isJobEditable}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-secondary-700 flex items-center gap-2">
                                                {modalJobDetails.googleMapLink ? (
                                                    <a
                                                        href={modalJobDetails.googleMapLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:underline"
                                                    >
                                                        <MapPin size={14} /> Google Maps Link
                                                    </a>
                                                ) : (
                                                    'Google Maps Link'
                                                )}
                                                {modalJobDetails.distance && <span className="text-xs text-primary-600">({modalJobDetails.distance} km)</span>}
                                            </label>
                                            <input
                                                type="text"
                                                value={modalJobDetails.googleMapLink}
                                                onChange={e => setModalJobDetails({ ...modalJobDetails, googleMapLink: e.target.value })}
                                                placeholder="https://maps.google.com/..."
                                                disabled={!isJobEditable}
                                                className={`w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow ${!isJobEditable ? 'bg-secondary-100 cursor-not-allowed text-secondary-500' : ''}`}
                                            />
                                        </div>

                                        {/* Inspector 1 */}
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-secondary-700">ผู้ตรวจงาน 1</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="text"
                                                    value={modalJobDetails.inspector1.name}
                                                    onChange={e => setModalJobDetails({ ...modalJobDetails, inspector1: { ...modalJobDetails.inspector1, name: e.target.value } })}
                                                    placeholder="ระบุชื่อผู้ตรวจงาน..."
                                                    disabled={!isJobEditable}
                                                    className={`w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow ${!isJobEditable ? 'bg-secondary-100 cursor-not-allowed text-secondary-500' : ''}`}
                                                />
                                                <input
                                                    type="text"
                                                    value={modalJobDetails.inspector1.phone}
                                                    onChange={e => setModalJobDetails({ ...modalJobDetails, inspector1: { ...modalJobDetails.inspector1, phone: e.target.value } })}
                                                    placeholder="ระบุเบอร์โทร..."
                                                    disabled={!isJobEditable}
                                                    className={`w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow ${!isJobEditable ? 'bg-secondary-100 cursor-not-allowed text-secondary-500' : ''}`}
                                                />
                                            </div>
                                        </div>

                                        {/* Inspector 2 */}
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium text-secondary-700">ผู้ตรวจงาน 2</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="text"
                                                    value={modalJobDetails.inspector2.name}
                                                    onChange={e => setModalJobDetails({ ...modalJobDetails, inspector2: { ...modalJobDetails.inspector2, name: e.target.value } })}
                                                    placeholder="ระบุชื่อผู้ตรวจงาน..."
                                                    disabled={!isJobEditable}
                                                    className={`w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow ${!isJobEditable ? 'bg-secondary-100 cursor-not-allowed text-secondary-500' : ''}`}
                                                />
                                                <input
                                                    type="text"
                                                    value={modalJobDetails.inspector2.phone}
                                                    onChange={e => setModalJobDetails({ ...modalJobDetails, inspector2: { ...modalJobDetails.inspector2, phone: e.target.value } })}
                                                    placeholder="ระบุเบอร์โทร..."
                                                    disabled={!isJobEditable}
                                                    className={`w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow ${!isJobEditable ? 'bg-secondary-100 cursor-not-allowed text-secondary-500' : ''}`}
                                                />
                                            </div>
                                        </div>
                                    </>
                                    );
                                })()}
                            </div>
                            <div className="px-6 py-4 border-t border-secondary-200 flex justify-end gap-3 bg-secondary-50">
                                <button
                                    className="px-4 py-2 bg-white border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors font-medium"
                                    onClick={closeJobModal}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-sm"
                                    onClick={saveJobModal}
                                >
                                    บันทึก
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

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

        </div >
    )
}

