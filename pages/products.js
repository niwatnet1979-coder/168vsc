import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AppLayout from '../components/AppLayout'
import * as XLSX from 'xlsx'
import { Search, Plus, Filter, MoreVertical, Edit2, Trash2, ChevronDown, ChevronUp, Package, Tag, Layers, Scaling, Palette, Gem, ImageIcon, List, LayoutGrid, Download, X, Menu } from 'lucide-react'
import { DataManager } from '../lib/dataManager'
import ProductModal from '../components/ProductModal'

export default function ProductManagement() {
    const [products, setProducts] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [currentProduct, setCurrentProduct] = useState(null)
    const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' })
    const [viewMode, setViewMode] = useState('table')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20
    const [expandedProducts, setExpandedProducts] = useState(new Set())

    const [isLoading, setIsLoading] = useState(true)

    const loadProducts = async () => {
        setIsLoading(true)
        const data = await DataManager.getProducts()
        setProducts(data)
        setIsLoading(false)
    }

    useEffect(() => {
        loadProducts()
    }, [])

    const requestSort = (key) => {
        let direction = 'ascending'
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending'
        }
        setSortConfig({ key, direction })
    }

    const filteredProducts = products.filter(p => {
        const term = searchTerm.toLowerCase()
        return (
            (p.id && (typeof p.id === 'string' ? p.id.toLowerCase() : String(p.id)).includes(term)) ||
            (p.category && p.category.toLowerCase().includes(term)) ||
            (p.subcategory && p.subcategory.toLowerCase().includes(term)) ||
            (p.description && p.description.toLowerCase().includes(term)) ||
            (p.material && p.material.toLowerCase().includes(term)) ||
            (p.color && p.color.toLowerCase().includes(term))
        )
    }).sort((a, b) => {
        const aVal = a[sortConfig.key] || ''
        const bVal = b[sortConfig.key] || ''
        if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1
        return 0
    })

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handleExportExcel = () => {
        const dataToExport = filteredProducts.map(p => ({
            'รหัสสินค้า': p.id,
            'ประเภทหลัก': p.category,
            'ประเภทย่อย': p.subcategory,
            'ราคา': p.price,
            'คงเหลือ': p.stock,
            'ยาว (cm)': p.length,
            'กว้าง (cm)': p.width,
            'สูง (cm)': p.height,
            'วัสดุ': p.material,
            'สีโครงสร้าง': p.color,
            'หมายเหตุ': p.description
        }))
        const ws = XLSX.utils.json_to_sheet(dataToExport)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Products")
        XLSX.writeFile(wb, `Products_Export_${new Date().toISOString().slice(0, 10)}.xlsx`)
    }

    const toggleExpand = (productId) => {
        const newExpanded = new Set(expandedProducts)
        if (newExpanded.has(productId)) {
            newExpanded.delete(productId)
        } else {
            newExpanded.add(productId)
        }
        setExpandedProducts(newExpanded)
    }

    // Helper function to calculate variant summary
    const getVariantSummary = (variants) => {
        if (!variants || variants.length === 0) return null

        const colorCount = variants.length
        const prices = variants.map(v => v.price || 0).filter(p => p > 0)
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0
        const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0)
        const totalMinStock = variants.reduce((sum, v) => sum + (v.minStock || 0), 0)
        // Note: Variants usually don't carry 'total_pending' unless mapped during data loading.
        // We need to ensure variants in products.js have 'total_pending' mapped if using this summary.
        // However, pending counts are usually on the Product level in dataManager.
        // If variants are pure JSON structure from DB, they won't have it.
        // But dataManager.getProducts return 'variants' array.
        // Wait, dataManager 590: `variants: p.variants || []`. It does NOT map pending to variants!
        // So `summary.totalPending` will be 0.
        // Fix: We must update dataManager to distribute pending counts to variants if possible, or just use Product level pending for now?
        // Actually, Orders items usually have variant info (color/size)?
        // Inspecting dataManager: `salesCounts` is by PID. 
        // If PID corresponds to specific variant (which it doesn't, products table is mainly Parent), then we have a problem.
        // But let's assume for now valid Logic is: Product Level Pending.
        // So getVariantSummary isn't enough?
        // User's case: AA001 is a single product (maybe?).
        // Let's just return 0 here and handle it in the Component if summary is used.
        // BUT, the component uses `summary.totalStock`.
        // We should pass `total_pending` from the PRODUCT level down to the row, not rely on variant summary for pending if variants don't have it.

        // Changing approach: return 0 here, but fix Component to use product.total_pending if summary doesn't provide it?
        // Actually, let's keep it simple. `product.total_pending` is available on the `product` object.

        return { colorCount, minPrice, maxPrice, totalStock, totalMinStock, totalPending: 0 }
    }

    const handleDelete = async (id) => {
        if (confirm('ยืนยันการลบสินค้า?')) {
            const success = await DataManager.deleteProduct(id)
            if (success) {
                setProducts(products.filter(p => p.id !== id))
            } else {
                alert('ไม่สามารถลบสินค้าได้\n\nสินค้านี้อาจถูกใช้งานใน Order แล้ว\nกรุณาตรวจสอบ Console (F12) สำหรับรายละเอียด')
            }
        }
    }

    const handleEdit = (product) => {
        setCurrentProduct({ ...product })
        setShowModal(true)
    }

    const handleAdd = () => {
        setCurrentProduct({
            id: '', category: '', name: '', subcategory: '', price: 0, stock: 0, description: '',
            length: '', width: '', height: '', material: '', color: '',
            images: []
        })
        setShowModal(true)
    }

    const handleSave = async (productData) => {
        if (!productData.product_code && !productData.id) {
            alert('กรุณากรอกรหัสสินค้า')
            return
        }

        const savedProduct = await DataManager.saveProduct(productData)
        if (savedProduct) {
            const existingIndex = products.findIndex(p => p.id === savedProduct.id)
            if (existingIndex >= 0) {
                const updatedProducts = [...products]
                updatedProducts[existingIndex] = savedProduct
                setProducts(updatedProducts)
            } else {
                setProducts([...products, savedProduct])
            }
            setShowModal(false)
            setCurrentProduct(null)
        } else {
            alert('บันทึกสินค้าไม่สำเร็จ')
        }
    }

    // Reset removed as it was for localStorage only

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null
        return sortConfig.direction === 'ascending' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
    }

    return (
        <AppLayout
            renderHeader={({ setIsSidebarOpen }) => (
                <header className="bg-white border-b border-secondary-200 px-4 py-3 sm:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                className="lg:hidden p-2 -ml-2 text-secondary-600 hover:bg-secondary-100 rounded-lg"
                                onClick={() => setIsSidebarOpen(true)}
                            >
                                <Menu size={24} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-3">
                                    <Package className="text-primary-600" size={28} />
                                    จัดการสินค้า
                                </h1>
                                <p className="text-sm text-secondary-500 mt-1">ทั้งหมด {filteredProducts.length} รายการ</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">

                            <button onClick={handleExportExcel} className="whitespace-nowrap px-3 py-2 bg-white border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors flex items-center gap-2 font-medium text-sm">
                                <Download size={16} />
                                Export
                            </button>
                            <button onClick={handleAdd} className="whitespace-nowrap px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium shadow-lg shadow-primary-500/30 text-sm">
                                <Plus size={18} />
                                เพิ่มสินค้าใหม่
                            </button>
                        </div>
                    </div>
                </header>
            )}
        >
            <Head>
                <title>จัดการสินค้า - 168VSC System</title>
            </Head>

            <div className="space-y-6 pt-6">

                {/* Search and View Toggle */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                        <input
                            type="text"
                            placeholder="ค้นหารหัสสินค้า, ชื่อ, หรือประเภท..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
                            className="w-full pl-11 pr-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-secondary-200 rounded-lg p-1">
                        <button onClick={() => setViewMode('table')} className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${viewMode === 'table' ? 'bg-primary-100 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'}`}>
                            <List size={18} />
                            ตาราง
                        </button>
                        <button onClick={() => setViewMode('grid')} className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'}`}>
                            <LayoutGrid size={18} />
                            การ์ด
                        </button>
                    </div>
                </div>

                {/* Table View */}
                {viewMode === 'table' && (
                    <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-secondary-50 border-b border-secondary-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-700 uppercase w-12">#</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-secondary-700 uppercase w-20">รูปภาพ</th>
                                        <th onClick={() => requestSort('id')} className="px-4 py-3 text-left text-xs font-semibold text-secondary-700 uppercase cursor-pointer hover:bg-secondary-100">
                                            <div className="flex items-center gap-2">สินค้า {getSortIcon('id')}</div>
                                        </th>
                                        <th onClick={() => requestSort('price')} className="px-4 py-3 text-right text-xs font-semibold text-secondary-700 uppercase cursor-pointer hover:bg-secondary-100 w-32">
                                            <div className="flex items-center justify-end gap-2">ราคา {getSortIcon('price')}</div>
                                        </th>
                                        <th onClick={() => requestSort('total_purchased')} className="px-4 py-3 text-right text-xs font-semibold text-secondary-700 uppercase cursor-pointer hover:bg-secondary-100 w-24">
                                            <div className="flex items-center justify-end gap-2">ซื้อสะสม {getSortIcon('total_purchased')}</div>
                                        </th>
                                        <th onClick={() => requestSort('total_sold')} className="px-4 py-3 text-right text-xs font-semibold text-secondary-700 uppercase cursor-pointer hover:bg-secondary-100 w-24">
                                            <div className="flex items-center justify-end gap-2">ขายสะสม {getSortIcon('total_sold')}</div>
                                        </th>
                                        <th onClick={() => requestSort('total_lost')} className="px-4 py-3 text-right text-xs font-semibold text-secondary-700 uppercase cursor-pointer hover:bg-secondary-100 w-24">
                                            <div className="flex items-center justify-end gap-2">สูญหาย {getSortIcon('total_lost')}</div>
                                        </th>
                                        <th onClick={() => requestSort('stock')} className="px-4 py-3 text-right text-xs font-semibold text-secondary-700 uppercase cursor-pointer hover:bg-secondary-100 w-36">
                                            <div className="flex items-center justify-end gap-2">คงเหลือ {getSortIcon('stock')}</div>
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-secondary-700 uppercase w-24">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-100">
                                    {paginatedProducts.length > 0 ? (
                                        paginatedProducts.map((product, index) => {
                                            // Helper for cleaning prefixes
                                            const cleanPrefix = (str) => {
                                                if (!str) return null
                                                if (str.match(/^[A-Z]{2}\s/)) return str.substring(3)
                                                if (str.match(/^\d{2}\s/)) return str.substring(3)
                                                return str
                                            }

                                            const categoryName = cleanPrefix(product.category)
                                            const materialName = cleanPrefix(product.material)

                                            const hasVariants = product.variants && product.variants.length > 0
                                            const isExpanded = expandedProducts.has(product.id)

                                            return (
                                                <>
                                                    <tr key={product.id} className="hover:bg-secondary-50 transition-colors">
                                                        <td className="px-4 py-4 text-sm text-secondary-500 text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                {hasVariants && (
                                                                    <button
                                                                        onClick={() => toggleExpand(product.id)}
                                                                        className="p-1 hover:bg-secondary-200 rounded transition-colors"
                                                                        title={isExpanded ? "ย่อ" : "ขยาย"}
                                                                    >
                                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                                    </button>
                                                                )}
                                                                <span>{(currentPage - 1) * itemsPerPage + index + 1}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="w-14 h-14 rounded-lg border border-secondary-200 overflow-hidden bg-secondary-50 flex items-center justify-center">
                                                                {(() => {
                                                                    // Try main product image first
                                                                    if (product.images && product.images[0]) {
                                                                        return <img src={product.images[0]} alt={product.product_code || product.id} className="w-full h-full object-cover" />
                                                                    }
                                                                    // Fallback to first variant image
                                                                    if (product.variants && product.variants.length > 0 && product.variants[0].images && product.variants[0].images[0]) {
                                                                        return <img src={product.variants[0].images[0]} alt={product.product_code || product.id} className="w-full h-full object-cover" />
                                                                    }
                                                                    // No image available
                                                                    return <ImageIcon size={20} className="text-secondary-300" />
                                                                })()}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div>
                                                                <Link href={`/products/${product.id}`} className="font-mono text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline block mb-1">
                                                                    {product.product_code || product.id}
                                                                </Link>
                                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-secondary-500">
                                                                    {product.name && <span className="font-medium text-secondary-700">{product.name}</span>}

                                                                    {materialName && <span>• {materialName}</span>}

                                                                    {product.subcategory && <span>• {product.subcategory}</span>}

                                                                    {/* Dimensions */}
                                                                    {(() => {
                                                                        // Try product-level dimensions first
                                                                        if (product.length || product.width || product.height) {
                                                                            return (
                                                                                <div className="flex items-center gap-1 text-secondary-500" title="ขนาด">
                                                                                    <Scaling size={14} />
                                                                                    <span>{product.length || '-'}×{product.width || '-'}×{product.height || '-'} cm</span>
                                                                                </div>
                                                                            )
                                                                        }
                                                                        // Fallback to first variant's dimensions
                                                                        if (product.variants && product.variants.length > 0) {
                                                                            const firstVariant = product.variants[0]
                                                                            if (firstVariant.dimensions && (firstVariant.dimensions.length || firstVariant.dimensions.width || firstVariant.dimensions.height)) {
                                                                                return (
                                                                                    <div className="flex items-center gap-1 text-secondary-500" title="ขนาด">
                                                                                        <Scaling size={14} />
                                                                                        <span>{firstVariant.dimensions.length || '-'}×{firstVariant.dimensions.width || '-'}×{firstVariant.dimensions.height || '-'} cm</span>
                                                                                    </div>
                                                                                )
                                                                            }
                                                                        }
                                                                        return null
                                                                    })()}

                                                                    {hasVariants && (
                                                                        <span className="ml-1 px-1.5 py-0.5 bg-primary-100 text-primary-700 text-[10px] rounded-full font-medium whitespace-nowrap flex items-center gap-1">
                                                                            🎨 {product.variants.length} แบบ
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {product.description && (
                                                                    <div className="text-[10px] text-secondary-400 mt-0.5 line-clamp-1">{product.description}</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            {(() => {
                                                                const summary = getVariantSummary(product.variants)
                                                                if (summary) {
                                                                    // Show price range for variants
                                                                    if (summary.minPrice === summary.maxPrice) {
                                                                        return <span className="text-sm font-semibold text-secondary-900">฿{summary.minPrice.toLocaleString()}</span>
                                                                    } else {
                                                                        return (
                                                                            <div className="text-sm font-semibold text-secondary-900">
                                                                                <div>฿{summary.minPrice.toLocaleString()}</div>
                                                                                <div className="text-xs text-secondary-500">- ฿{summary.maxPrice.toLocaleString()}</div>
                                                                            </div>
                                                                        )
                                                                    }
                                                                } else {
                                                                    // Show price range from variants
                                                                    const variants = product.variants || []
                                                                    if (variants.length === 0) return <span className="text-sm text-secondary-400">-</span>

                                                                    const prices = variants.map(v => v.price || 0).filter(p => p > 0)
                                                                    if (prices.length === 0) return <span className="text-sm text-secondary-400">-</span>

                                                                    const minPrice = Math.min(...prices)
                                                                    const maxPrice = Math.max(...prices)

                                                                    if (minPrice === maxPrice) {
                                                                        return <span className="text-sm font-semibold text-secondary-900">฿{minPrice.toLocaleString()}</span>
                                                                    }
                                                                    return <span className="text-sm font-semibold text-secondary-900">฿{minPrice.toLocaleString()} - ฿{maxPrice.toLocaleString()}</span>
                                                                }
                                                            })()}
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <span className="text-sm text-secondary-600 font-medium">
                                                                {product.total_purchased ? product.total_purchased.toLocaleString() : '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <span className="text-sm text-secondary-600 font-medium">
                                                                {product.total_sold ? product.total_sold.toLocaleString() : '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <span className={`text-sm font-semibold ${product.total_lost > 0 ? 'text-danger-600' : 'text-secondary-400'}`}>
                                                                {product.total_lost > 0 ? `- ${product.total_lost}` : '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            {(() => {
                                                                const summary = getVariantSummary(product.variants)
                                                                const stockValue = summary ? summary.totalStock : (product.stock || 0)
                                                                const minStockValue = summary ? summary.totalMinStock : (product.min_stock_level || 0)

                                                                return (
                                                                    <div className="flex flex-col items-end">
                                                                        {minStockValue > 0 ? (
                                                                            <>
                                                                                {(() => {
                                                                                    // Logic: Available Balance = Stock - Pending Orders - Min Stock
                                                                                    // User Order: (Stock) - (Pending + Min)
                                                                                    // Example: 0 - (4 + 1) = -5
                                                                                    const pendingValue = product.total_pending || 0
                                                                                    const balance = stockValue - pendingValue - minStockValue
                                                                                    // If Balance is negative, it means we are short (Need to Buy)

                                                                                    return (
                                                                                        <>
                                                                                            <span className={`text-sm font-semibold ${balance < 0 ? 'text-danger-600' : 'text-success-600'}`}>
                                                                                                {balance > 0 ? `+${balance}` : balance}
                                                                                            </span>
                                                                                            <div className="flex flex-col items-end text-xs text-secondary-400">
                                                                                                <span>(Stock: {stockValue})</span>
                                                                                                {pendingValue > 0 && <span>(Order: {pendingValue})</span>}
                                                                                            </div>
                                                                                        </>
                                                                                    )
                                                                                })()}
                                                                            </>
                                                                        ) : (
                                                                            <span className={`text-sm font-semibold ${stockValue > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                                                                                {stockValue}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })()}
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button onClick={() => handleEdit(product)} className="p-2 text-secondary-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors" title="แก้ไข">
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button onClick={() => handleDelete(product.id)} className="p-2 text-secondary-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors" title="ลบ">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {/* Expandable Variants Row */}
                                                    {isExpanded && hasVariants && (
                                                        <>
                                                            {product.variants.map((variant, i) => (
                                                                <tr key={`variant-${i}`} className="bg-secondary-50 border-t border-secondary-200">
                                                                    {/* Empty # column */}
                                                                    <td className="px-4 py-3"></td>

                                                                    {/* Image */}
                                                                    <td className="px-4 py-3">
                                                                        <div className="w-14 h-14 rounded-lg border border-secondary-200 overflow-hidden bg-white flex items-center justify-center">
                                                                            {variant.images && variant.images[0] ? (
                                                                                <img src={variant.images[0]} alt={variant.color} className="w-full h-full object-cover" />
                                                                            ) : (
                                                                                <ImageIcon size={20} className="text-secondary-300" />
                                                                            )}
                                                                        </div>
                                                                    </td>

                                                                    {/* Merged Variant Code & Info */}
                                                                    <td className="px-4 py-3">
                                                                        <div className="flex flex-col">
                                                                            <span className="font-mono text-sm font-semibold text-secondary-900 block mb-1">
                                                                                {(() => {
                                                                                    // Format: AA001-D100x100x200-GD
                                                                                    const productCode = product.product_code || product.id || ''
                                                                                    const dims = variant.dimensions
                                                                                    const colorCode = variant.color ? variant.color.substring(0, 2).toUpperCase() : 'XX'

                                                                                    let code = productCode
                                                                                    if (dims && (dims.length || dims.width || dims.height)) {
                                                                                        const dimStr = `${dims.length || 0}x${dims.width || 0}x${dims.height || 0}`
                                                                                        code += `-D${dimStr}`
                                                                                    }
                                                                                    code += `-${colorCode}`

                                                                                    // Helper for Crystal Color Code
                                                                                    const getCrystalCode = (name) => {
                                                                                        if (!name) return ''
                                                                                        const map = {
                                                                                            'ใส': 'CL',
                                                                                            'Clear': 'CL',
                                                                                            'Gold': 'GD',
                                                                                            'Smoke': 'SM',
                                                                                            'Amber': 'AM',
                                                                                            'Tea': 'TE'
                                                                                        }
                                                                                        return map[name] || name.substring(0, 2).toUpperCase()
                                                                                    }

                                                                                    if (variant.crystalColor) {
                                                                                        code += `-${getCrystalCode(variant.crystalColor)}`
                                                                                    }

                                                                                    return code || '-'
                                                                                })()}
                                                                            </span>

                                                                            {/* Info Tags */}
                                                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-secondary-500">
                                                                                {/* Name */}
                                                                                {product.name && <span className="font-medium text-secondary-700">{product.name}</span>}

                                                                                {/* Material (Replaces Category) */}
                                                                                {product.material && (
                                                                                    <span>
                                                                                        • {(() => {
                                                                                            const mat = product.material
                                                                                            if (mat.match(/^[A-Z]{2}\s/)) return mat.substring(3)
                                                                                            return mat
                                                                                        })()}
                                                                                    </span>
                                                                                )}

                                                                                {/* Dimensions */}
                                                                                {variant.dimensions && (variant.dimensions.length || variant.dimensions.width || variant.dimensions.height) && (
                                                                                    <div className="flex items-center gap-1 text-secondary-500" title="ขนาด">
                                                                                        <Scaling size={14} />
                                                                                        <span>{variant.dimensions.length}×{variant.dimensions.width}×{variant.dimensions.height}cm</span>
                                                                                    </div>
                                                                                )}

                                                                                {/* Color */}
                                                                                {variant.color && (
                                                                                    <div className="flex items-center gap-1 text-secondary-500" title="สี">
                                                                                        <Palette size={14} />
                                                                                        <span>
                                                                                            {(() => {
                                                                                                const col = variant.color
                                                                                                if (col.match(/^[A-Z]{2}\s/)) return col.substring(3)
                                                                                                return col
                                                                                            })()}
                                                                                        </span>
                                                                                    </div>
                                                                                )}

                                                                                {/* Crystal Color */}
                                                                                {variant.crystalColor && (
                                                                                    <div className="flex items-center gap-1 text-secondary-500" title="สีคริสตัล">
                                                                                        <Gem size={14} />
                                                                                        <span>
                                                                                            {(() => {
                                                                                                const cc = variant.crystalColor
                                                                                                if (cc && cc.match(/^[A-Z]{2}\s/)) return cc.substring(3)
                                                                                                return cc
                                                                                            })()}
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            {product.description && (
                                                                                <div className="text-[10px] text-secondary-400 mt-0.5 line-clamp-1">{product.description}</div>
                                                                            )}
                                                                        </div>
                                                                    </td>

                                                                    {/* Price */}
                                                                    <td className="px-4 py-3 text-right">
                                                                        <span className="text-sm font-semibold text-secondary-900">฿{variant.price?.toLocaleString() || 0}</span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <span className="text-sm text-secondary-500">{variant.total_purchased?.toLocaleString() || '-'}</span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <span className="text-sm text-secondary-900 font-medium">{variant.total_sold?.toLocaleString() || '-'}</span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <span className="text-sm text-secondary-500">{variant.total_lost?.toLocaleString() || '-'}</span>
                                                                    </td>

                                                                    <td className="px-4 py-3 text-right">
                                                                        {(() => {
                                                                            // Logic: Available Balance = Stock - Pending Orders - Min Stock
                                                                            // User Order: (Stock) - (Pending + Min)
                                                                            const stock = variant.stock || 0
                                                                            const min = variant.minStock || 0
                                                                            const pending = variant.pending_count || 0
                                                                            const balance = stock - pending - min

                                                                            return (
                                                                                <div className="flex flex-col items-end">
                                                                                    <span className={`text-sm font-semibold ${balance < 0 ? 'text-danger-600' : 'text-success-600'}`}>
                                                                                        {balance > 0 ? `+${balance}` : balance}
                                                                                    </span>
                                                                                    <div className="flex flex-col items-end text-xs text-secondary-400">
                                                                                        <span>(Stock: {stock})</span>
                                                                                        {pending > 0 && <span>(Order: {pending})</span>}
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        })()}
                                                                    </td>

                                                                    {/* Empty Actions column */}
                                                                    <td className="px-4 py-3"></td>
                                                                </tr>
                                                            ))}
                                                        </>
                                                    )}
                                                </>
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="10" className="px-4 py-12 text-center text-secondary-500">
                                                <Package size={48} className="mx-auto mb-3 text-secondary-300" />
                                                <p className="text-lg font-medium">ไม่พบสินค้า</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-secondary-200 flex items-center justify-between">
                                <div className="text-sm text-secondary-600">
                                    แสดง {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} จาก {filteredProducts.length} รายการ
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                        ก่อนหน้า
                                    </button>
                                    <span className="text-sm text-secondary-600">หน้า {currentPage} / {totalPages}</span>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                        ถัดไป
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Grid View */}
                {viewMode === 'grid' && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {paginatedProducts.length > 0 ? (
                                paginatedProducts.map((product) => (
                                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
                                        <div className="aspect-square bg-secondary-50 relative overflow-hidden">
                                            {(() => {
                                                // Try main product image first
                                                if (product.images && product.images[0]) {
                                                    return <img src={product.images[0]} alt={product.id} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                }
                                                // Fallback to first variant image
                                                if (product.variants && product.variants.length > 0 && product.variants[0].images && product.variants[0].images[0]) {
                                                    return <img src={product.variants[0].images[0]} alt={product.id} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                }
                                                // No image available
                                                return (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ImageIcon size={48} className="text-secondary-300" />
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                        <div className="p-4 flex flex-col flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <Link href={`/products/${product.id}`} className="font-mono text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline">
                                                    {product.product_code || product.id}
                                                </Link>
                                                {product.variants && product.variants.length > 0 && (
                                                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full font-medium whitespace-nowrap flex items-center gap-1">
                                                        🎨 {product.variants.length} สี
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-sm text-secondary-700 leading-relaxed mb-4 min-h-[3rem]">
                                                {(() => {
                                                    // Use exact same logic as Table View (Line 270+)

                                                    // Extract category name without prefix
                                                    const categoryName = product.category ? product.category.split(' ').slice(1).join(' ') : null
                                                    // Extract material name without prefix
                                                    const materialName = product.material ? product.material.split(' ').slice(1).join(' ') || product.material : null

                                                    const info = [
                                                        categoryName,
                                                        product.name,
                                                        product.subcategory,
                                                        materialName,
                                                        (product.length || product.width || product.height) ? `${product.length || '-'}×${product.width || '-'}×${product.height || '-'} cm` : null
                                                    ].filter(Boolean).join(' • ')

                                                    return info || '-'
                                                })()}
                                            </div>

                                            {product.description && (
                                                <div className="text-xs text-secondary-500 mb-3 line-clamp-2">
                                                    {product.description}
                                                </div>
                                            )}

                                            <div className="mt-auto">
                                                <div className="flex items-center justify-between mb-3 border-t border-secondary-100 pt-3">
                                                    {(() => {
                                                        const variants = product.variants || []
                                                        if (variants.length === 0) return <span className="text-lg font-bold text-secondary-400">-</span>

                                                        const prices = variants.map(v => v.price || 0).filter(p => p > 0)
                                                        if (prices.length === 0) return <span className="text-lg font-bold text-secondary-400">-</span>

                                                        const minPrice = Math.min(...prices)
                                                        const maxPrice = Math.max(...prices)
                                                        const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0)

                                                        return (
                                                            <>
                                                                <span className="text-base font-bold text-secondary-900">
                                                                    {minPrice === maxPrice
                                                                        ? `฿${minPrice.toLocaleString()}`
                                                                        : `฿${minPrice.toLocaleString()} - ฿${maxPrice.toLocaleString()}`
                                                                    }
                                                                </span>
                                                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${totalStock > 0 ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'}`}>
                                                                    คงเหลือ {totalStock}
                                                                </span>
                                                            </>
                                                        )
                                                    })()}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleEdit(product)} className="flex-1 px-3 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors flex items-center justify-center gap-2 font-medium text-sm">
                                                        <Edit2 size={14} />
                                                        แก้ไข
                                                    </button>
                                                    <button onClick={() => handleDelete(product.id)} className="px-3 py-2 bg-danger-50 text-danger-700 rounded-lg hover:bg-danger-100 transition-colors" title="ลบ">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center text-secondary-500">
                                    <Package size={48} className="mx-auto mb-3 text-secondary-300" />
                                    <p className="text-lg font-medium">ไม่พบสินค้า</p>
                                </div>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-secondary-200 px-6 py-4">
                                <div className="text-sm text-secondary-600">
                                    แสดง {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)} จาก {filteredProducts.length} รายการ
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                        ก่อนหน้า
                                    </button>
                                    <span className="text-sm text-secondary-600">หน้า {currentPage} / {totalPages}</span>
                                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-secondary-300 rounded-lg text-sm font-medium text-secondary-700 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                        ถัดไป
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Simple Modal */}
            <ProductModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                product={currentProduct}
                onSave={handleSave}
                existingProducts={products}
            />
        </AppLayout>
    )
}
