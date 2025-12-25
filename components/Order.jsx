import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import CustomerModal from './CustomerModal'
import {
    Save, Plus, Trash2, Calendar, MapPin, FileText, User, Search,
    ChevronDown, ChevronUp, X, Check, Truck, Wrench, Edit2, UserPlus,
    CreditCard, DollarSign, Percent, AlertCircle, Home, ArrowLeft, Phone, Mail, MessageCircle, Facebook, Instagram,
    MoreHorizontal, CheckCircle, FileEdit, Camera, HelpCircle, Map, Globe, Users, Box, Palette, Package, UserCheck, Menu, Layers, Gem, Zap, Power, QrCode, Scaling, Lightbulb, Video, List, Copy, Printer
} from 'lucide-react'
import AppLayout from './AppLayout'
import { DataManager } from '../lib/dataManager'
import { OrdersAPI } from '../lib/data'
import { useOrderData } from '../hooks/useOrderData'
import { useOrderCalculations } from '../hooks/useOrderCalculations'
import { useOrderForm } from '../hooks/useOrderForm'
import { useOrderLoader } from '../hooks/useOrderLoader'
import { useJobState } from '../hooks/useJobState'
import { createOrderHandlers } from '../lib/orderHandlers'
import { createCustomerModalOpeners } from '../lib/orderModalUtils'
import { createProductSearchHandler, createProductSelectHandler } from '../lib/productSearchUtils'
import { createItemHandlers } from '../lib/itemHandlers'
import { createJobHandlers } from '../lib/jobHandlers'

// UI Components
import OrderHeader from './order/OrderHeader'
import OrderCustomerSection from './order/OrderCustomerSection'
import OrderTaxInvoiceSection from './order/OrderTaxInvoiceSection'
import OrderSummarySection from './order/OrderSummarySection'
import OrderSummaryEdit from './order/OrderSummaryEdit'
import OrderPaymentSection from './order/OrderPaymentSection'
import OrderJobSection from './order/OrderJobSection'
import OrderItemsList from './order/OrderItemsList'

import ProductModal from './ProductModal'

import AddressSelector from './AddressSelector' // Import AddressSelector
import ContactSelector from './ContactSelector'
import ContactDisplayCard from './ContactDisplayCard'
import JobInfoCard from './JobInfoCard'
import PaymentEntryModal from './PaymentEntryModal'
import Card from './Card'
import { currency, calculateDistance, deg2rad, extractCoordinates, SHOP_LAT, SHOP_LON, formatAddress, convertToEmbedUrl } from '../lib/utils'

import OrderItemModal from './OrderItemModal'
import PaymentSummaryCard from './PaymentSummaryCard'
import ConfirmationModal from './ConfirmationModal'

export default function OrderForm() {
    const router = useRouter()
    const savingRef = useRef(false)

    // === USE HOOKS ===
    // Use OrderData hook for data loading
    const orderData = useOrderData()
    const {
        customersData: hookCustomersData,
        setCustomersData: hookSetCustomersData,
        productsData: hookProductsData,
        setProductsData: hookSetProductsData,
        availableTeams: hookAvailableTeams,
        promptpayQr,
        isLoading: dataLoading
    } = orderData

    // --- Data Loading States ---
    const customersData = hookCustomersData
    const productsData = hookProductsData
    const availableTeams = hookAvailableTeams

    // === USE ORDER FORM HOOK ===
    // Initialize form state management hook
    const form = useOrderForm()

    // Destructure ALL state from hook (Groups 1-9)
    const {
        // GROUP 1: Core Order Data
        orderNumber, setOrderNumber,
        customer, setCustomer,
        taxInvoice, setTaxInvoice,
        taxInvoiceDeliveryAddress, setTaxInvoiceDeliveryAddress,
        items, setItems,
        generalJobInfo, setGeneralJobInfo,
        initialOrderData, setInitialOrderData,
        otherOutstandingOrders, setOtherOutstandingOrders,

        // GROUP 2: Payment & Pricing
        discount, setDiscount,
        vatRate, setVatRate,
        vatIncluded, setVatIncluded,
        shippingFee, setShippingFee,
        paymentSchedule, setPaymentSchedule,

        // GROUP 3: Selection State
        selectedItemIndex, setSelectedItemIndex,
        selectedJobIndex, setSelectedJobIndex,
        editingJobIndex, setEditingJobIndex,

        // GROUP 4: Contact Management
        receiverContact, setReceiverContact,
        purchaserContact, setPurchaserContact,
        addingContactFor, setAddingContactFor,

        // GROUP 5: UI Dropdown State
        showCustomerDropdown, setShowCustomerDropdown,
        showTaxInvoiceDropdown, setShowTaxInvoiceDropdown,
        showTaxAddressDropdown, setShowTaxAddressDropdown,
        showJobDropdown, setShowJobDropdown,
        showItemDropdown, setShowItemDropdown,
        taxInvoiceSearchTerm, setTaxInvoiceSearchTerm,
        taxAddressSearchTerm, setTaxAddressSearchTerm,
        activeSearchIndex, setActiveSearchIndex,

        // GROUP 6: Modal State
        showEditCustomerModal, setShowEditCustomerModal,
        showAddCustomerModal, setShowAddCustomerModal,
        showPaymentModal, setShowPaymentModal,
        showOrderItemModal, setShowOrderItemModal,
        showProductModal, setShowProductModal,
        showConfirmSaveModal, setShowConfirmSaveModal,
        showMapPopup, setShowMapPopup,

        // GROUP 7: Modal Tab State
        customerModalTab, setCustomerModalTab,
        editingPaymentIndex, setEditingPaymentIndex,

        // GROUP 8: Editing State
        editingItemIndex, setEditingItemIndex,
        newProduct, setNewProduct,
        lastCreatedProduct, setLastCreatedProduct,

        // GROUP 9: Map & Search
        selectedMapLink, setSelectedMapLink,
        searchResults, setSearchResults,
        isSaving, setIsSaving,

        // Helper Functions
        isDeepEqual
    } = form


    // GROUP 5: UI Dropdown State - replaced

    // === USE JOB STATE HOOK ===
    const { flatJobs, currentJobInfo } = useJobState(
        items,
        selectedItemIndex,
        selectedJobIndex
    )


    // === DATA LOADING ===
    // Use OrderLoader hook for all data loading and initialization
    const { fetchOrderData } = useOrderLoader({
        customer,
        items,
        selectedItemIndex,
        setOtherOutstandingOrders,
        setOrderNumber,
        setCustomer,
        setTaxInvoice,
        setTaxInvoiceDeliveryAddress,
        setItems,
        setGeneralJobInfo,
        setInitialOrderData,
        setDiscount,
        setVatRate,
        setVatIncluded,
        setShippingFee,
        setPaymentSchedule,
        setSelectedItemIndex,
        setSelectedJobIndex,
    })

    // --- 1:N Job Management State ---

    // GROUP 5-9: UI States - replaced







    // --- Handlers ---

    // Use handler from createOrderHandlers
    const handleSelectCustomer = (c) => {
        handlersSelectCustomer(c)
        setShowCustomerDropdown(false)
    }

    // Use handler from createOrderHandlers
    const handleUpdateCustomer = (updatedCustomer) => handlersUpdateCustomer(
        updatedCustomer,
        addingContactFor,
        setAddingContactFor,
        setCustomerModalTab,
        setShowEditCustomerModal
    )

    // Use handler from createOrderHandlers
    const handleAddNewCustomer = (newCustomerData) => handlersAddNewCustomer(
        newCustomerData,
        setShowAddCustomerModal
    )

    // Use handler from createOrderHandlers
    const handleDeleteCustomer = (customerId) => handlersDeleteCustomer(
        customerId,
        setShowEditCustomerModal
    )

    // === MODAL HANDLERS (using utilities) ===
    const modalOpeners = createCustomerModalOpeners(
        setCustomerModalTab,
        setShowEditCustomerModal,
        setAddingContactFor
    )

    const handleAddNewContact = (type) => {
        if (!customer.id) return alert('กรุณาเลือกลูกค้าก่อนเพิ่มผู้ติดต่อ')
        modalOpeners.openContactTab(type)
    }

    const handleAddNewTaxInvoice = () => {
        if (!customer.id) return alert('กรุณาเลือกลูกค้าก่อนเพิ่มใบกำกับภาษี')
        setCustomerModalTab('tax')
        setAddingContactFor('taxInvoice')
        setShowEditCustomerModal(true)
    }

    const handleAddNewAddress = () => {
        if (!customer.id) return alert('กรุณาเลือกลูกค้าก่อนเพิ่มที่อยู่')
        setCustomerModalTab('address')
        setAddingContactFor('taxInvoiceDeliveryAddress')
        setShowEditCustomerModal(true)
    }

    const handleAddNewInstallAddress = () => {
        if (!customer.id) return alert('กรุณาเลือกลูกค้าก่อนเพิ่มสถานที่ติดตั้ง')
        setCustomerModalTab('address')
        setAddingContactFor('installAddress')
        setShowEditCustomerModal(true)
    }

    const handleAddNewInspector = () => {
        if (!customer.id) return alert('กรุณาเลือกลูกค้าก่อนเพิ่มผู้ตรวจงาน')
        modalOpeners.openContactTab('inspector')
    }


    // === PRODUCT SEARCH HANDLERS (using utilities) ===
    const handleSearchProduct = createProductSearchHandler(
        items,
        setItems,
        setActiveSearchIndex,
        setSearchResults,
        productsData
    )

    // Quick Add Product State
    // Use handler from createOrderHandlers (with additional UI logic)
    const handleSaveNewProduct = async (productData) => {
        if (!productData.product_code && !productData.id) {
            alert('กรุณากรอกรหัสสินค้า')
            return
        }

        const savedProduct = await handlersSaveNewProduct(productData)
        if (savedProduct) {
            // Close modal and reset (UI-specific logic)
            setShowProductModal(false)
            setNewProduct({
                id: '', category: '', subcategory: '', price: 0, stock: 0, description: '',
                length: '', width: '', height: '', material: '', color: '',
                images: []
            })

            // Trigger auto-select in OrderItemModal
            // Use the full product object from refetched list to ensure variants are present
            const products = await DataManager.getProducts()
            const fullSavedProduct = products.find(p => p.id === savedProduct.id || p.uuid === savedProduct.uuid || p.product_code === savedProduct.product_code)
            setLastCreatedProduct(fullSavedProduct || savedProduct)
            if (editingItemIndex === null) {
                // If we were adding a new item, ensure the modal is open
                setShowOrderItemModal(true)
            }
        } else {
            alert('บันทึกสินค้าไม่สำเร็จ')
        }
    }

    const selectProduct = createProductSelectHandler(
        items,
        setItems,
        setSearchResults,
        currentJobInfo
    )

    // Use handler from createOrderHandlers
    const handleSaveOrder = () => handlersSaveOrder(fetchOrderData)


    // === USE CALCULATIONS HOOK ===
    const calculations = useOrderCalculations(items, discount, shippingFee, vatIncluded, vatRate)
    const {
        subtotal: calcSubtotal,
        discountAmt: calcDiscountAmt,
        afterDiscount: calcAfterDiscount,
        vatAmt: calcVatAmt,
        total: calcTotal
    } = calculations

    // --- Calculations (Now from hook) ---
    const subtotal = calcSubtotal
    const discountAmt = calcDiscountAmt
    const afterDiscount = calcAfterDiscount
    const vatAmt = calcVatAmt
    const total = calcTotal

    // === CREATE ORDER HANDLERS ===
    const handlers = createOrderHandlers(
        {
            // Form state
            customer, setCustomer,
            items, setItems,
            taxInvoice, setTaxInvoice,
            taxInvoiceDeliveryAddress, setTaxInvoiceDeliveryAddress,
            receiverContact, setReceiverContact,
            purchaserContact, setPurchaserContact,
            generalJobInfo, setGeneralJobInfo,
            paymentSchedule, setPaymentSchedule,
            selectedItemIndex, setSelectedItemIndex,
            selectedJobIndex, setSelectedJobIndex,
            discount, setDiscount,
            shippingFee, setShippingFee,
            vatIncluded, setVatIncluded,
            orderNumber, setOrderNumber,
            // note, setNote, // Not used - removed
            initialOrderData, setInitialOrderData,
            isDeepEqual
        },
        {
            // Order data (from useOrderData hook)
            customersData,
            setCustomersData: hookSetCustomersData,
            productsData,
            setProductsData: hookSetProductsData
        },
        router,
        { savingRef }
    )

    // Destructure handlers for easier use
    const {
        handleSelectCustomer: handlersSelectCustomer,
        handleUpdateCustomer: handlersUpdateCustomer,
        handleAddNewCustomer: handlersAddNewCustomer,
        handleDeleteCustomer: handlersDeleteCustomer,
        handleJobInfoUpdate: handlersJobInfoUpdate,
        handleAddJobToItem: handlersAddJobToItem,
        handleDeleteJobFromItem: handlersDeleteJobFromItem,
        handleSaveItem: handlersSaveItem,
        handleDeleteItem: handlersDeleteItem,
        handleSaveNewProduct: handlersSaveNewProduct,
        handleSaveOrder: handlersSaveOrder
    } = handlers

    // === ITEM HANDLERS (using utilities) ===
    const itemHandlers = createItemHandlers({
        saveItem: handlersSaveItem,
        deleteItem: handlersDeleteItem,
        addJobToItem: handlersAddJobToItem,
        deleteJobFromItem: handlersDeleteJobFromItem
    })

    const handleSaveItem = (itemData) => itemHandlers.saveItem(itemData, setEditingItemIndex)
    const handleDeleteItem = itemHandlers.deleteItem
    const handleAddJobToItem = itemHandlers.addJobToItem
    const handleDeleteJobFromItem = itemHandlers.deleteJobFromItem

    // === JOB HANDLERS (using utilities) ===
    const jobHandlers = createJobHandlers(
        currentJobInfo,
        handlersJobInfoUpdate,
        items,
        setItems
    )

    const handleJobInfoUpdate = jobHandlers.updateJobInfo
    const handleShareJobInfo = jobHandlers.shareJobInfo



    // Calculate total paid from payment schedule
    const totalPaid = paymentSchedule.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0)
    const outstanding = Math.max(0, total - totalPaid)

    const renderContactDetails = (contact) => {
        if (!contact || !contact.name) return null;
        return (
            <div className="mt-2 pt-2 border-t border-secondary-100 space-y-1.5 p-1 animate-in fade-in slide-in-from-top-1 duration-200">
                { }
                <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-secondary-900">{contact.name}</span>
                    {contact.position && (
                        <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-100 uppercase tracking-wide">
                            {contact.position}
                        </span>
                    )}
                </div>

                { }
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary-600">
                    {contact.phone && (
                        <div className="flex items-center gap-1.5 hover:text-secondary-900 transition-colors">
                            <Phone size={11} className="text-secondary-400 shrink-0" />
                            <span>{contact.phone}</span>
                        </div>
                    )}
                    {contact.email && (
                        <div className="flex items-center gap-1.5 hover:text-secondary-900 transition-colors pl-3 border-l border-secondary-200">
                            <Mail size={11} className="text-secondary-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{contact.email}</span>
                        </div>
                    )}
                    {(contact.lineId || contact.line) && (
                        <div className="flex items-center gap-1.5 hover:text-secondary-900 transition-colors pl-3 border-l border-secondary-200">
                            <MessageCircle size={11} className="text-[#06c755] shrink-0" />
                            <span className="font-medium text-[#06c755]">{contact.lineId || contact.line}</span>
                        </div>
                    )}
                </div>

                { }
                {
                    contact.note && (
                        <div className="flex items-start gap-1.5 mt-1 bg-secondary-50/80 p-2 rounded-md border border-dashed border-secondary-200">
                            <span className="text-[10px] font-bold text-secondary-500 whitespace-nowrap mt-0.5">Note:</span>
                            <span className="text-[11px] text-secondary-700 leading-relaxed italic">{contact.note}</span>
                        </div>
                    )
                }
            </div >
        );
    };

    return (
        <AppLayout
            renderHeader={OrderHeader({
                orderNumber,
                onSave: handleSaveOrder,
                isSaving
            })}
        >
            <div className="min-h-screen bg-secondary-50 pb-20 pt-6">
                <div className="space-y-6">

                    { }
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                        { }
                        <OrderCustomerSection
                            customer={customer}
                            customersData={customersData}
                            receiverContact={receiverContact}
                            purchaserContact={purchaserContact}
                            onSelectCustomer={handleSelectCustomer}
                            onUpdateCustomer={handleUpdateCustomer}
                            onAddNewCustomer={handleAddNewCustomer}
                            onDeleteCustomer={handleDeleteCustomer}
                            onSetCustomer={setCustomer}
                            onSetReceiverContact={setReceiverContact}
                            onSetPurchaserContact={setPurchaserContact}
                            showCustomerDropdown={showCustomerDropdown}
                            setShowCustomerDropdown={setShowCustomerDropdown}
                            showAddCustomerModal={showAddCustomerModal}
                            setShowAddCustomerModal={setShowAddCustomerModal}
                            showEditCustomerModal={showEditCustomerModal}
                            setShowEditCustomerModal={setShowEditCustomerModal}
                            addingContactFor={addingContactFor}
                            setAddingContactFor={setAddingContactFor}
                            customerModalTab={customerModalTab}
                            setCustomerModalTab={setCustomerModalTab}
                            onAddNewContact={handleAddNewContact}
                        />

                        { }
                        <OrderJobSection
                            currentJobInfo={currentJobInfo}
                            items={items}
                            selectedItemIndex={selectedItemIndex}
                            selectedJobIndex={selectedJobIndex}
                            flatJobs={flatJobs}
                            customer={customer}
                            availableTeams={availableTeams}
                            onJobInfoUpdate={handleJobInfoUpdate}
                            onAddJob={handleAddJobToItem}
                            onDeleteJob={(itemIndex, jobIndex) => {
                                setSelectedItemIndex(itemIndex);
                                handleDeleteJobFromItem(jobIndex);
                            }}
                            onSelectJob={(itemIndex, jobIndex) => {
                                setSelectedItemIndex(itemIndex);
                                setSelectedJobIndex(jobIndex);
                            }}
                            onSelectItem={(idx) => {
                                setSelectedItemIndex(idx);
                                const jobCount = items[idx]?.jobs?.length || 0;
                                setSelectedJobIndex(jobCount > 0 ? jobCount - 1 : 0);
                            }}
                            onShareJobInfo={handleShareJobInfo}
                            onAddNewInstallAddress={handleAddNewInstallAddress}
                            onAddNewInspector={handleAddNewInspector}
                            showJobDropdown={showJobDropdown}
                            setShowJobDropdown={setShowJobDropdown}
                            showItemDropdown={showItemDropdown}
                            setShowItemDropdown={setShowItemDropdown}
                        />

                        { }
                        <OrderTaxInvoiceSection
                            taxInvoice={taxInvoice}
                            setTaxInvoice={setTaxInvoice}
                            customer={customer}
                            taxInvoiceSearchTerm={taxInvoiceSearchTerm}
                            setTaxInvoiceSearchTerm={setTaxInvoiceSearchTerm}
                            showTaxInvoiceDropdown={showTaxInvoiceDropdown}
                            setShowTaxInvoiceDropdown={setShowTaxInvoiceDropdown}
                            taxInvoiceDeliveryAddress={taxInvoiceDeliveryAddress}
                            setTaxInvoiceDeliveryAddress={setTaxInvoiceDeliveryAddress}
                            currentJobInfo={currentJobInfo}
                            receiverContact={receiverContact}
                            setReceiverContact={setReceiverContact}
                            onAddNewTaxInvoice={handleAddNewTaxInvoice}
                            onAddNewAddress={handleAddNewAddress}
                            onAddNewContact={handleAddNewContact}
                            formatAddress={formatAddress}
                        />

                        { }
                        <div className="order-5 md:order-5 flex flex-col h-full">
                            <div className="h-full">
                                <PaymentSummaryCard
                                    subtotal={subtotal}
                                    shippingFee={shippingFee}
                                    onShippingFeeChange={setShippingFee}
                                    discount={discount}
                                    onDiscountChange={setDiscount}
                                    vatRate={vatRate}
                                    onVatRateChange={setVatRate}
                                    paymentSchedule={paymentSchedule}
                                    readOnly={false}
                                    hideControls={true}
                                    promptpayQr={promptpayQr}
                                    onAddPayment={() => {
                                        setEditingPaymentIndex(null)
                                        setShowPaymentModal(true)
                                    }}
                                    onEditPayment={(index) => {
                                        setEditingPaymentIndex(index)
                                        setShowPaymentModal(true)
                                    }}
                                    otherOutstandingOrders={otherOutstandingOrders}
                                    vatIncluded={vatIncluded}
                                    onVatIncludedChange={setVatIncluded}
                                    className="h-full"
                                />
                            </div>
                        </div>

                        { }
                        <OrderItemsList
                            items={items}
                            showOrderItemModal={showOrderItemModal}
                            setShowOrderItemModal={setShowOrderItemModal}
                            editingItemIndex={editingItemIndex}
                            setEditingItemIndex={setEditingItemIndex}
                            onSaveItem={handleSaveItem}
                            onDeleteItem={handleDeleteItem}
                            productsData={productsData}
                            lastCreatedProduct={lastCreatedProduct}
                            onConsumeLastCreatedProduct={() => setLastCreatedProduct(null)}
                            onAddNewProduct={() => {
                                setNewProduct({
                                    id: '', category: '', name: '', subcategory: '', price: 0, stock: 0, description: '',
                                    length: '', width: '', height: '', material: '', color: '',
                                    images: []
                                })
                                setShowProductModal(true)
                            }}
                            onEditProduct={(product) => {
                                setNewProduct(product)
                                setShowProductModal(true)
                            }}
                            currency={currency}
                        />
                    </div >

                    { }
                    {
                        showMapPopup && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
                                    { }
                                    <div className="px-6 py-4 border-b border-secondary-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-secondary-50">
                                        <h3 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
                                            <MapPin className="text-primary-600" size={28} />
                                            ตำแหน่งที่อยู่
                                        </h3>
                                        <button
                                            onClick={() => setShowMapPopup(false)}
                                            className="p-2 text-secondary-400 hover:text-secondary-600 hover:bg-secondary-200 rounded-full transition-colors"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>

                                    { }
                                    <div className="p-8 flex flex-col items-center justify-center space-y-6">
                                        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                                            <MapPin size={48} className="text-primary-600" />
                                        </div>

                                        <div className="text-center space-y-2">
                                            <h4 className="text-xl font-bold text-secondary-900">เปิดดูแผนที่</h4>
                                            <p className="text-secondary-600">คลิกปุ่มด้านล่างเพื่อเปิดดูตำแหน่งใน Google Maps</p>
                                        </div>

                                        {(() => {
                                            const coords = extractCoordinates(selectedMapLink)
                                            if (coords) {
                                                return (
                                                    <div className="bg-secondary-50 p-4 rounded-lg w-full">
                                                        <div className="text-sm text-secondary-600 space-y-1">
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">Latitude:</span>
                                                                <span className="font-mono">{coords.lat}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="font-medium">Longitude:</span>
                                                                <span className="font-mono">{coords.lon}</span>
                                                            </div>
                                                            {currentJobInfo.distance && (
                                                                <div className="flex justify-between pt-2 border-t border-secondary-200">
                                                                    <span className="font-medium">ระยะทาง:</span>
                                                                    <span className="font-semibold text-success-600">📍 {currentJobInfo.distance}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            return null
                                        })()}

                                        <a
                                            href={selectedMapLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30"
                                        >
                                            <MapPin size={20} />
                                            เปิดใน Google Maps
                                        </a>
                                    </div>

                                    { }
                                    <div className="px-6 py-4 border-t border-secondary-200 bg-secondary-50 flex justify-end">
                                        <button
                                            onClick={() => setShowMapPopup(false)}
                                            className="px-6 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors font-medium"
                                        >
                                            ปิด
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                    { }
                    <ProductModal
                        isOpen={showProductModal}
                        onClose={() => setShowProductModal(false)}
                        product={newProduct}
                        onSave={handleSaveNewProduct}
                        existingProducts={productsData}
                    />

                    { }
                    <CustomerModal
                        isOpen={showEditCustomerModal}
                        onClose={() => {
                            setShowEditCustomerModal(false)
                            setCustomerModalTab('customer')
                            setAddingContactFor(null)
                        }}
                        customer={customer}
                        initialTab={customerModalTab}
                        onSave={handleUpdateCustomer}
                        onDelete={handleDeleteCustomer}
                    />

                    { }
                    <CustomerModal
                        isOpen={showAddCustomerModal}
                        onClose={() => setShowAddCustomerModal(false)}
                        customer={null}
                        onSave={handleAddNewCustomer}
                    />

                    { }

                    { }
                    { }
                    <PaymentEntryModal
                        isOpen={showPaymentModal}
                        onClose={() => {
                            setShowPaymentModal(false)
                            setEditingPaymentIndex(null)
                        }}
                        onSave={async (paymentData) => {
                            // Upload slip if it's a File object
                            let slipUrl = paymentData.slip
                            if (paymentData.slip && paymentData.slip instanceof File) {
                                console.log('[OrderFormClean] Uploading payment slip...')
                                const paymentIndex = editingPaymentIndex !== null ? editingPaymentIndex : paymentSchedule.length
                                // Use existing orderId or generate temporary one for new orders
                                const uploadOrderId = router.query.id || `TEMP-${Date.now()}`
                                slipUrl = await DataManager.uploadPaymentSlip(paymentData.slip, uploadOrderId, paymentIndex)
                                if (!slipUrl) {
                                    alert('ไม่สามารถอัพโหลดรูปสลิปได้ กรุณาลองใหม่อีกครั้ง')
                                    return
                                }
                                console.log('[OrderFormClean] Slip uploaded:', slipUrl)
                            }

                            // Calculate amount based on mode
                            const otherPaymentsTotal = paymentSchedule.reduce((sum, p, idx) => {
                                if (editingPaymentIndex !== null && idx === editingPaymentIndex) {
                                    return sum
                                }
                                return sum + (parseFloat(p.amount) || 0)
                            }, 0)
                            const totalOther = otherOutstandingOrders.reduce((s, o) => s + (Number(o.outstanding) || 0), 0)
                            const remainingForThis = (total + totalOther) - otherPaymentsTotal
                            const calculatedAmount = paymentData.amountMode === 'percent'
                                ? (remainingForThis * (parseFloat(paymentData.percentValue) || 0)) / 100
                                : parseFloat(paymentData.amount) || 0

                            if (editingPaymentIndex !== null) {
                                // Edit existing payment
                                const newSchedule = [...paymentSchedule]
                                newSchedule[editingPaymentIndex] = {
                                    ...paymentData,
                                    slip: slipUrl, // Store URL instead of File
                                    amount: calculatedAmount
                                }
                                setPaymentSchedule(newSchedule)
                            } else {
                                // Add new payment
                                setPaymentSchedule([...paymentSchedule, {
                                    ...paymentData,
                                    slip: slipUrl, // Store URL instead of File
                                    amount: calculatedAmount
                                }])
                            }
                        }}
                        onDelete={() => {
                            if (editingPaymentIndex !== null) {
                                setPaymentSchedule(paymentSchedule.filter((_, i) => i !== editingPaymentIndex))
                            }
                        }}
                        payment={editingPaymentIndex !== null ? paymentSchedule[editingPaymentIndex] : null}
                        remainingBalance={(() => {
                            // Calculate remaining balance excluding the payment being edited
                            const otherPaymentsTotal = paymentSchedule.reduce((sum, p, idx) => {
                                if (editingPaymentIndex !== null && idx === editingPaymentIndex) {
                                    return sum
                                }
                                return sum + (parseFloat(p.amount) || 0)
                            }, 0)
                            const totalOther = otherOutstandingOrders.reduce((s, o) => s + (Number(o.outstanding) || 0), 0)
                            return (total + totalOther) - otherPaymentsTotal
                        })()}
                        isEditing={editingPaymentIndex !== null}
                        paymentCount={paymentSchedule.length}
                    />
                </div >
            </div >
        </AppLayout >
    )
}
