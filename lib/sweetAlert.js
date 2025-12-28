import Swal from 'sweetalert2'

// Base configuration to match the centralized design
const baseConfig = {
    customClass: {
        popup: 'rounded-2xl shadow-xl border border-secondary-100',
        confirmButton: 'rounded-lg px-6 py-2.5 font-medium shadow-lg shadow-primary-500/30',
        cancelButton: 'rounded-lg px-6 py-2.5 font-medium',
        title: 'text-secondary-900',
        htmlContainer: 'text-secondary-600'
    },
    buttonsStyling: true, // Use SweetAlert2's styling but applied via classes
    heightAuto: false, // Fix blinking/jumping issue
    scrollbarPadding: false // Fix double padding issue with other modals
}

/**
 * Show a confirmation dialog
 * @param {Object} options
 * @param {string} options.title - The title of the modal
 * @param {string} options.text - The message body
 * @param {string} options.confirmButtonText - Text for the confirm button
 * @param {string} options.cancelButtonText - Text for the cancel button
 * @param {string} options.confirmButtonColor - Hex color for confirm button
 * @param {string} options.cancelButtonColor - Hex color for cancel button
 * @param {string} options.icon - 'warning', 'error', 'success', 'info', 'question'
 * @returns {Promise<{isConfirmed: boolean}>}
 */
export const showConfirm = async ({
    title = 'ยืนยันการดำเนินการ',
    text = 'คุณต้องการดำเนินการต่อหรือไม่?',
    confirmButtonText = 'ยืนยัน',
    cancelButtonText = 'ยกเลิก',
    confirmButtonColor = '#3085d6', // Default blue
    cancelButtonColor = '#d33',     // Default red
    icon = 'warning'
} = {}) => {
    return Swal.fire({
        ...baseConfig,
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonColor,
        cancelButtonColor,
        confirmButtonText,
        cancelButtonText,
        reverseButtons: false // Default SwAl position
    })
}

/**
 * Show a success message (auto-close)
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.text
 * @param {number} options.timer - Duration in ms (default 1500)
 */
export const showSuccess = async ({
    title = 'สำเร็จ',
    text = 'ดำเนินการเสร็จสิ้น',
    timer = 1500,
    showConfirmButton = false
} = {}) => {
    return Swal.fire({
        ...baseConfig,
        icon: 'success',
        title,
        text,
        timer,
        showConfirmButton
    })
}

/**
 * Show an error message
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.text
 * @param {string} options.confirmButtonText
 */
export const showError = async ({
    title = 'เกิดข้อผิดพลาด',
    text = 'ไม่สามารถดำเนินการได้',
    confirmButtonText = 'ตกลง'
} = {}) => {
    return Swal.fire({
        ...baseConfig,
        icon: 'error',
        title,
        text,
        confirmButtonText
    })
}

/**
 * Show a loading spinner (blocking)
 * @param {string} title
 * @param {string} text
 */
export const showLoading = (title = 'กำลังดำเนินการ...', text = 'กรุณารอสักครู่') => {
    Swal.fire({
        ...baseConfig,
        title,
        text,
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
            Swal.showLoading()
        }
    })
}

/**
 * Close the currently open SweetAlert2 popup
 */
export const closeSwal = () => {
    Swal.close()
}

/**
 * Show a simple toast notification
 * @param {Object} options
 */
export const showToast = async ({
    icon = 'success',
    title = '',
    position = 'top-end',
    timer = 3000
} = {}) => {
    const Toast = Swal.mixin({
        toast: true,
        position,
        showConfirmButton: false,
        timer,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    })

    return Toast.fire({
        icon,
        title
    })
}

/**
 * Show an input dialog
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.inputLabel
 * @param {string} options.inputPlaceholder
 * @param {string} options.confirmButtonText
 * @param {string} options.cancelButtonText
 * @param {Function} options.inputValidator
 */
export const showInput = async ({
    title = 'กรอกข้อมูล',
    inputLabel = '',
    inputPlaceholder = '',
    confirmButtonText = 'ตกลง',
    cancelButtonText = 'ยกเลิก',
    inputValue = '',
    inputValidator = null
} = {}) => {
    return Swal.fire({
        ...baseConfig,
        title,
        input: 'text',
        inputLabel,
        inputPlaceholder,
        inputValue,
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        inputValidator
    })
}

/**
 * Show a selection dialog
 * @param {Object} options
 * @param {string} options.title
 * @param {string} options.inputLabel
 * @param {string} options.inputPlaceholder
 * @param {Object} options.inputOptions - Object with key-value pairs for options
 * @param {string} options.inputValue - Default selected value
 * @returns {Promise<{isConfirmed: boolean, value: string}>}
 */
export const showSelect = async ({
    title = 'เลือกข้อมูล',
    inputLabel = '',
    inputPlaceholder = '-- เลือก --',
    inputOptions = {},
    inputValue = '',
    confirmButtonText = 'ตกลง',
    cancelButtonText = 'ยกเลิก'
} = {}) => {
    return Swal.fire({
        ...baseConfig,
        title,
        input: 'select',
        inputLabel,
        inputPlaceholder,
        inputOptions,
        inputValue,
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33'
    })
}

/**
 * Show a specialized variant selection dialog
 * @param {Object} options
 * @param {Array} options.variants - Array of product variants
 * @param {string} options.productName - Name of the product
 * @param {string} options.material - Material of the product
 * @param {number} options.selectedIndex - Currently selected variant index
 * @param {Function} options.onSelect - Callback when a variant is selected
 */
export const showSelectVariant = async ({
    variants = [],
    productName = '',
    material = '',
    selectedIndex = null,
    onSelect = () => { },
    actionButtonText = null,
    onAction = () => { },
    onEdit = null
} = {}) => {
    if (variants.length === 0 && !actionButtonText) return

    return Swal.fire({
        ...baseConfig,
        title: 'เลือก Variant (V2)',
        html: `
            <div id="variant-list-container" class="flex flex-col gap-3 mt-4 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" style="max-height: 260px;">
                ${variants.map((v, i) => `
                    <div 
                        id="variant-opt-${i}"
                        class="variant-item relative p-3 border rounded-xl cursor-pointer transition-all flex items-center gap-3 group ${selectedIndex === i ? 'bg-primary-50 border-primary-200' : 'bg-transparent border-transparent hover:bg-gray-50'}"
                    >
                        <!-- Image -->
                        <div class="w-12 h-12 bg-secondary-100 rounded-lg flex-shrink-0 overflow-hidden border border-secondary-100 relative">
                            ${v.images && v.images[0]
                ? `<img src="${v.images[0]}" class="w-full h-full object-cover" />`
                : `<div class="w-full h-full flex items-center justify-center text-secondary-300">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                   </div>`
            }
                        </div>

                        <!-- Info -->
                        <div class="flex-1 text-left min-w-0">
                            <div class="flex justify-between items-start">
                                <div class="font-bold text-secondary-900 text-sm truncate pr-2">${v.sku || v.name || '-- No SKU --'}</div>
                                <div class="text-primary-600 font-bold text-sm whitespace-nowrap">฿${v.price?.toLocaleString()}</div>
                            </div>
                            
                            <!-- Detailed Attributes -->
                            <div class="text-[11px] text-secondary-500 flex flex-wrap gap-x-3 gap-y-1 mt-1 items-center">
                                ${v.dimensions ? `
                                    <div class="flex items-center gap-1" title="ขนาด">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-secondary-400"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                                        <span>${v.dimensions.length}×${v.dimensions.width}×${v.dimensions.height}cm</span>
                                    </div>
                                ` : ''}
                                
                                ${v.color ? `
                                    <div class="flex items-center gap-1" title="สี/วัสดุ">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-secondary-400"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
                                        <span>${v.color}</span>
                                    </div>
                                ` : ''}

                                ${v.crystalColor ? `
                                    <div class="flex items-center gap-1" title="สีคริสตัล">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-secondary-400"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/></svg>
                                        <span>${v.crystalColor}</span>
                                    </div>
                                ` : ''}

                                <div class="flex items-center gap-2 ml-auto">
                                    <span class="text-secondary-400 text-[10px]">คงเหลือ ${v.available ?? v.stock ?? 0}</span>
                                    <div class="variant-edit-btn p-1 rounded-md hover:bg-secondary-100 text-secondary-300 hover:text-primary-600 transition-colors cursor-pointer flex-shrink-0" data-index="${i}" title="แก้ไขข้อมูล">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                                    </div>
                                </div>
                            </div>
                            </div>
                        </div>

                        <!-- Edit Icon -->

                    </div>
                `).join('')}
                
                ${actionButtonText ? `
                    <div 
                        id="variant-action-btn"
                        class="mt-4 p-3 border-2 border-dashed border-primary-300 rounded-xl cursor-pointer transition-all hover:bg-primary-50 text-primary-600 font-bold text-sm flex items-center justify-center gap-2"
                    >
                        <span class="text-lg">+</span> ${actionButtonText}
                    </div>
                ` : ''}
            </div>
        `,
        showCancelButton: true,
        showConfirmButton: false,
        cancelButtonText: 'ปิด',
        didOpen: () => {
            variants.forEach((_, i) => {
                const el = document.getElementById(`variant-opt-${i}`)
                if (el) {
                    el.onclick = (e) => {
                        if (e.target.closest('.variant-edit-btn')) return
                        onSelect(i)
                        Swal.close()
                    }
                }
            })

            const editBtns = Swal.getHtmlContainer().querySelectorAll('.variant-edit-btn')
            editBtns.forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation()
                    const index = btn.dataset.index
                    if (onEdit) {
                        onEdit(variants[index])
                        Swal.close()
                    } else if (onAction) {
                        onAction()
                        Swal.close()
                    }
                }
            })

            const actionBtn = document.getElementById('variant-action-btn')
            if (actionBtn) {
                actionBtn.onclick = () => {
                    onAction()
                    Swal.close()
                }
            }
        }
    })
}

// Product Search Popup
export const showProductSearch = async (products = [], onSelect = () => { }, selectedId = null, onAddNew = null, onEdit = null) => {
    // Check if products is null/undefined, but allow empty array
    if (!products) products = []

    let filteredProducts = products

    const renderList = (items) => {
        if (items.length === 0) {
            return `
                <div class="text-center py-8 text-secondary-400">
                    <div class="flex flex-col items-center gap-2">
                        <i data-lucide="search-x" width="48" height="48" class="text-secondary-300"></i>
                        <span>ไม่พบสินค้าที่ค้นหา</span>
                    </div>
                </div>
            `
        }

        return items.slice(0, 50).map((p, i) => {
            const isSelected = selectedId && (p.uuid === selectedId || p.product_code === selectedId || p.id === selectedId)

            // Calculate price range
            let priceDisplay = '฿0'
            const prices = p.variants?.map(v => v.price).filter(p => p > 0) || []
            if (prices.length > 0) {
                const minPrice = Math.min(...prices)
                const maxPrice = Math.max(...prices)
                priceDisplay = minPrice === maxPrice
                    ? `฿${minPrice.toLocaleString()}`
                    : `฿${minPrice.toLocaleString()} - ฿${maxPrice.toLocaleString()}`
            } else if (p.price) {
                priceDisplay = `฿${p.price.toLocaleString()}`
            }

            // Calculate total stock
            const totalStock = p.stock || p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0

            return `
            <div 
                class="product-item relative p-3 border rounded-xl cursor-pointer transition-all flex items-center gap-3 group ${isSelected ? 'bg-primary-50 border-primary-200' : 'bg-transparent border-transparent hover:bg-gray-50'}"
                data-index="${i}"
            >
                <!-- Image -->
                <div class="w-12 h-12 bg-secondary-100 rounded-lg flex-shrink-0 overflow-hidden border border-secondary-100 relative">
                    ${p.images && p.images[0]
                    ? `<img src="${p.images[0]}" class="w-full h-full object-cover" />`
                    : `<div class="w-full h-full flex items-center justify-center text-secondary-300">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                           </div>`
                }
                </div>

                <!-- Info -->
                <div class="flex-1 text-left min-w-0">
                    <div class="flex justify-between items-start mb-0.5">
                         <div class="flex items-center gap-2 truncate pr-2">
                             <span class="text-secondary-500 font-medium whitespace-nowrap text-sm">${p.product_code || ''}</span>
                             <span class="font-bold text-secondary-900 truncate text-sm">${p.name || ''}</span>
                        </div>
                        <div class="text-primary-600 font-bold text-sm whitespace-nowrap">${priceDisplay}</div>
                    </div>
                    
                    <div class="flex justify-between items-center text-xs text-secondary-500">
                        <div class="flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                            <span>${p.material || 'ไม่ระบุวัสดุ'}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span>${p.variants?.length || 0} แบบ • คงเหลือ ${totalStock}</span>
                            ${onEdit ? `
                                <div class="edit-product-btn p-1 rounded-md hover:bg-secondary-100 text-secondary-300 hover:text-primary-600 transition-colors cursor-pointer flex-shrink-0" data-index="${i}" title="แก้ไข">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                                </div>
                             `: ''}
                        </div>
                    </div>
                </div>
                


            </div>
    `}).join('')
    }

    return Swal.fire({
        ...baseConfig,
        title: 'ค้นหาสินค้า',
        html: `
            <div class="flex flex-col gap-4">
                <div class="relative">
                    <div class="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    </div>
                    <input 
                        id="swal-search-input" 
                        type="text" 
                        class="w-full pl-10 pr-4 py-2.5 bg-secondary-50 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        placeholder="พิมพ์ชื่อ, รหัส, หรือรายละเอียด..."
                        autocomplete="off"
                    >
                </div>
                <div id="swal-product-list" class="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden min-h-[100px]">
                    ${renderList(products)}
                </div>
                
                <!--Add New Product Button-- >
    ${onAddNew ? `
                <div class="pt-2 border-t border-secondary-100 mt-2">
                    <button id="swal-add-new-btn" class="w-full py-2.5 px-4 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        เพิ่มสินค้าใหม่
                    </button>
                </div>
                ` : ''
            }

<div class="text-xs text-secondary-400 text-center">
    ${products.length <= 50
                ? `แสดงทั้งหมด ${products.length} รายการ`
                : `แสดง 50 รายการแรกจากทั้งหมด ${products.length} รายการ`
            }
</div>
            </div >
    `,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'ยกเลิก',
        didOpen: () => {
            const input = document.getElementById('swal-search-input')
            const listContainer = document.getElementById('swal-product-list')
            const addNewBtn = document.getElementById('swal-add-new-btn')

            // Add New Handler
            if (addNewBtn) {
                addNewBtn.onclick = () => {
                    if (onAddNew) {
                        onAddNew()
                        Swal.close()
                    }
                }
            }

            // Search Handler
            input.oninput = (e) => {
                const term = e.target.value.toLowerCase()
                filteredProducts = products.filter(p =>
                    (p.name && p.name.toLowerCase().includes(term)) ||
                    (p.product_code && p.product_code.toLowerCase().includes(term)) ||
                    (p.description && p.description.toLowerCase().includes(term))
                )
                listContainer.innerHTML = renderList(filteredProducts)
                attachClickHandlers() // Re-attach after render
            }

            // Click Handler
            const attachClickHandlers = () => {
                const items = listContainer.querySelectorAll('.product-item')
                items.forEach(item => {
                    item.onclick = (e) => {
                        // Prevent if clicking edit button (handled separately but good safety)
                        if (e.target.closest('.edit-product-btn')) return;

                        console.log('[SweetAlert] Item clicked', item.dataset.index)
                        const index = item.dataset.index
                        const selected = filteredProducts[index]
                        console.log('[SweetAlert] Selected data:', selected)

                        if (selected) {
                            try {
                                onSelect(selected)
                                Swal.close()
                            } catch (error) {
                                console.error('[SweetAlert] Error in onSelect:', error)
                            }
                        }
                    }
                })

                // Edit Handlers
                const editBtns = listContainer.querySelectorAll('.edit-product-btn')
                editBtns.forEach(btn => {
                    btn.onclick = (e) => {
                        e.stopPropagation()
                        const index = btn.dataset.index
                        const selected = filteredProducts[index]
                        if (onEdit && selected) {
                            onEdit(selected)
                            Swal.close()
                        }
                    }
                })
            }

            attachClickHandlers()
            // Focus with a slight delay to ensure modal animation is done or at least started
            setTimeout(() => input.focus(), 100)
        }
    })
}

export default {
    showConfirm,
    showSuccess,
    showError,
    showLoading,
    closeSwal,
    showToast,
    showInput,
    showSelect,
    showSelectVariant,
    showProductSearch
}
