import { useState, useCallback } from 'react'

/**
 * Custom hook for managing Order form state
 * Consolidates all state management for the Order component
 * 
 * @param {Object} initialData - Initial data for the order form
 * @returns {Object} Form state and actions
 */
export function useOrderForm(initialData = {}) {
    // ==========================================
    // GROUP 1: CORE ORDER DATA (8 variables)
    // ==========================================
    const [orderNumber, setOrderNumber] = useState(initialData.orderNumber || '')

    const [customer, setCustomer] = useState(initialData.customer || {
        id: '', name: '', code: '', phone: '', email: '', address: ''
    })

    const [taxInvoice, setTaxInvoice] = useState(initialData.taxInvoice || {
        id: '', name: '', taxId: '', address: ''
    })

    const [taxInvoiceDeliveryAddress, setTaxInvoiceDeliveryAddress] = useState(
        initialData.taxInvoiceDeliveryAddress || {
            id: '', name: '', address: '', phone: ''
        }
    )

    const [items, setItems] = useState(initialData.items || [])

    const [generalJobInfo, setGeneralJobInfo] = useState(initialData.generalJobInfo || {
        jobType: 'installation',
        team: '',
        appointmentDate: null,
        completionDate: null,
        description: '',
        installLocationId: null,
        installLocationName: '',
        installAddress: '',
        googleMapLink: '',
        distance: null,
        inspector1: null
    })

    const [initialOrderData, setInitialOrderData] = useState(initialData.initialOrderData || null)

    const [otherOutstandingOrders, setOtherOutstandingOrders] = useState(
        initialData.otherOutstandingOrders || []
    )

    // ==========================================
    // GROUP 2: PAYMENT & PRICING (5 variables)
    // ==========================================
    const [discount, setDiscount] = useState(
        initialData.discount || { mode: 'percent', value: 0 }
    )

    const [vatRate, setVatRate] = useState(initialData.vatRate || 0.07)

    const [vatIncluded, setVatIncluded] = useState(
        initialData.vatIncluded !== undefined ? initialData.vatIncluded : true
    )

    const [shippingFee, setShippingFee] = useState(initialData.shippingFee || 0)

    const [paymentSchedule, setPaymentSchedule] = useState(initialData.paymentSchedule || [])

    // ==========================================
    // GROUP 3: SELECTION STATE (3 variables)
    // ==========================================
    const [selectedItemIndex, setSelectedItemIndex] = useState(
        initialData.selectedItemIndex !== undefined ? initialData.selectedItemIndex : 0
    )

    const [selectedJobIndex, setSelectedJobIndex] = useState(
        initialData.selectedJobIndex !== undefined ? initialData.selectedJobIndex : 0
    )

    const [editingJobIndex, setEditingJobIndex] = useState(null)

    // ==========================================
    // GROUP 4: CONTACT MANAGEMENT (3 variables)
    // ==========================================
    const [receiverContact, setReceiverContact] = useState(initialData.receiverContact || null)

    const [purchaserContact, setPurchaserContact] = useState(initialData.purchaserContact || null)

    const [addingContactFor, setAddingContactFor] = useState(null)

    // ==========================================
    // GROUP 5: UI DROPDOWN STATE (8 variables)
    // ==========================================
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
    const [showTaxInvoiceDropdown, setShowTaxInvoiceDropdown] = useState(false)
    const [showTaxAddressDropdown, setShowTaxAddressDropdown] = useState(false)
    const [showJobDropdown, setShowJobDropdown] = useState(false)
    const [showItemDropdown, setShowItemDropdown] = useState(false)
    const [taxInvoiceSearchTerm, setTaxInvoiceSearchTerm] = useState('')
    const [taxAddressSearchTerm, setTaxAddressSearchTerm] = useState('')
    const [activeSearchIndex, setActiveSearchIndex] = useState(null)

    // ==========================================
    // GROUP 6: MODAL STATE (7 variables)
    // ==========================================
    const [showEditCustomerModal, setShowEditCustomerModal] = useState(false)
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [showOrderItemModal, setShowOrderItemModal] = useState(false)
    const [showProductModal, setShowProductModal] = useState(false)
    const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false)
    const [showMapPopup, setShowMapPopup] = useState(false)

    // ==========================================
    // GROUP 7: MODAL TAB STATE (2 variables)
    // ==========================================
    const [customerModalTab, setCustomerModalTab] = useState('customer')
    const [editingPaymentIndex, setEditingPaymentIndex] = useState(null)

    // ==========================================
    // GROUP 8: EDITING STATE (3 variables)
    // ==========================================
    const [editingItemIndex, setEditingItemIndex] = useState(null)
    const [newProduct, setNewProduct] = useState({
        id: '', category: '', name: '', subcategory: '', price: 0, stock: 0, description: '',
        length: '', width: '', height: '', material: '', color: '', images: []
    })
    const [lastCreatedProduct, setLastCreatedProduct] = useState(null)

    // ==========================================
    // GROUP 9: MAP & SEARCH (3 variables)
    // ==========================================
    const [selectedMapLink, setSelectedMapLink] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [isSaving, setIsSaving] = useState(false)

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================

    /**
     * Open a modal by name
     */
    const openModal = useCallback((modalName) => {
        const modalSetters = {
            editCustomer: setShowEditCustomerModal,
            addCustomer: setShowAddCustomerModal,
            payment: setShowPaymentModal,
            orderItem: setShowOrderItemModal,
            product: setShowProductModal,
            confirmSave: setShowConfirmSaveModal,
            map: setShowMapPopup
        }

        if (modalSetters[modalName]) {
            modalSetters[modalName](true)
        }
    }, [])

    /**
     * Close a modal by name
     */
    const closeModal = useCallback((modalName) => {
        const modalSetters = {
            editCustomer: setShowEditCustomerModal,
            addCustomer: setShowAddCustomerModal,
            payment: setShowPaymentModal,
            orderItem: setShowOrderItemModal,
            product: setShowProductModal,
            confirmSave: setShowConfirmSaveModal,
            map: setShowMapPopup
        }

        if (modalSetters[modalName]) {
            modalSetters[modalName](false)
        }
    }, [])

    /**
     * Toggle a dropdown by name
     */
    const toggleDropdown = useCallback((dropdownName) => {
        const dropdownSetters = {
            customer: setShowCustomerDropdown,
            taxInvoice: setShowTaxInvoiceDropdown,
            taxAddress: setShowTaxAddressDropdown,
            job: setShowJobDropdown,
            item: setShowItemDropdown
        }

        if (dropdownSetters[dropdownName]) {
            dropdownSetters[dropdownName](prev => !prev)
        }
    }, [])

    /**
     * Close all dropdowns
     */
    const closeAllDropdowns = useCallback(() => {
        setShowCustomerDropdown(false)
        setShowTaxInvoiceDropdown(false)
        setShowTaxAddressDropdown(false)
        setShowJobDropdown(false)
        setShowItemDropdown(false)
    }, [])

    /**
     * Close all modals
     */
    const closeAllModals = useCallback(() => {
        setShowEditCustomerModal(false)
        setShowAddCustomerModal(false)
        setShowPaymentModal(false)
        setShowOrderItemModal(false)
        setShowProductModal(false)
        setShowConfirmSaveModal(false)
        setShowMapPopup(false)
    }, [])

    /**
     * Helper to deeply compare objects
     */
    const isDeepEqual = useCallback((obj1, obj2) => {
        return JSON.stringify(obj1) === JSON.stringify(obj2)
    }, [])

    /**
     * Reset form to initial state
     */
    const resetForm = useCallback(() => {
        setOrderNumber('')
        setCustomer({ id: '', name: '', code: '', phone: '', email: '', address: '' })
        setTaxInvoice({ id: '', name: '', taxId: '', address: '' })
        setTaxInvoiceDeliveryAddress({ id: '', name: '', address: '', phone: '' })
        setItems([])
        setGeneralJobInfo({
            jobType: 'installation',
            team: '',
            appointmentDate: null,
            completionDate: null,
            description: '',
            installLocationId: null,
            installLocationName: '',
            installAddress: '',
            googleMapLink: '',
            distance: null,
            inspector1: null
        })
        setDiscount({ mode: 'percent', value: 0 })
        setVatRate(0.07)
        setVatIncluded(true)
        setShippingFee(0)
        setPaymentSchedule([])
        setSelectedItemIndex(0)
        setSelectedJobIndex(0)
        setReceiverContact(null)
        setPurchaserContact(null)
        closeAllDropdowns()
        closeAllModals()
    }, [closeAllDropdowns, closeAllModals])

    // ==========================================
    // RETURN ORGANIZED INTERFACE
    // ==========================================
    return {
        // Core Order Data
        orderNumber,
        setOrderNumber,
        customer,
        setCustomer,
        taxInvoice,
        setTaxInvoice,
        taxInvoiceDeliveryAddress,
        setTaxInvoiceDeliveryAddress,
        items,
        setItems,
        generalJobInfo,
        setGeneralJobInfo,
        initialOrderData,
        setInitialOrderData,
        otherOutstandingOrders,
        setOtherOutstandingOrders,

        // Payment & Pricing
        discount,
        setDiscount,
        vatRate,
        setVatRate,
        vatIncluded,
        setVatIncluded,
        shippingFee,
        setShippingFee,
        paymentSchedule,
        setPaymentSchedule,

        // Selection State
        selectedItemIndex,
        setSelectedItemIndex,
        selectedJobIndex,
        setSelectedJobIndex,
        editingJobIndex,
        setEditingJobIndex,

        // Contact Management
        receiverContact,
        setReceiverContact,
        purchaserContact,
        setPurchaserContact,
        addingContactFor,
        setAddingContactFor,

        // UI Dropdown State
        showCustomerDropdown,
        setShowCustomerDropdown,
        showTaxInvoiceDropdown,
        setShowTaxInvoiceDropdown,
        showTaxAddressDropdown,
        setShowTaxAddressDropdown,
        showJobDropdown,
        setShowJobDropdown,
        showItemDropdown,
        setShowItemDropdown,
        taxInvoiceSearchTerm,
        setTaxInvoiceSearchTerm,
        taxAddressSearchTerm,
        setTaxAddressSearchTerm,
        activeSearchIndex,
        setActiveSearchIndex,

        // Modal State
        showEditCustomerModal,
        setShowEditCustomerModal,
        showAddCustomerModal,
        setShowAddCustomerModal,
        showPaymentModal,
        setShowPaymentModal,
        showOrderItemModal,
        setShowOrderItemModal,
        showProductModal,
        setShowProductModal,
        showConfirmSaveModal,
        setShowConfirmSaveModal,
        showMapPopup,
        setShowMapPopup,

        // Modal Tab State
        customerModalTab,
        setCustomerModalTab,
        editingPaymentIndex,
        setEditingPaymentIndex,

        // Editing State
        editingItemIndex,
        setEditingItemIndex,
        newProduct,
        setNewProduct,
        lastCreatedProduct,
        setLastCreatedProduct,

        // Map & Search
        selectedMapLink,
        setSelectedMapLink,
        searchResults,
        setSearchResults,
        isSaving,
        setIsSaving,

        // Helper Functions
        openModal,
        closeModal,
        toggleDropdown,
        closeAllDropdowns,
        closeAllModals,
        resetForm,
        isDeepEqual
    }
}
