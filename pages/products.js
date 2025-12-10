import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AppLayout from '../components/AppLayout'
import * as XLSX from 'xlsx'
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    Download,
    LayoutGrid,
    List,
    ChevronUp,
    ChevronDown,
    X,
    Image as ImageIcon,
    Package,
    RotateCcw,
    Menu
} from 'lucide-react'
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
    const isResetting = useRef(false) // Prevent multiple resets

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

    const handleDelete = async (id) => {
        if (confirm('ยืนยันการลบสินค้า?')) {
            const success = await DataManager.deleteProduct(id)
            if (success) {
                setProducts(products.filter(p => p.id !== id))
            } else {
                alert('ไม่สามารถลบสินค้าได้')
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
            length: '', width: '', height: '', material: '', color: '', crystalColor: '',
            bulbType: '', light: '', remote: '', images: []
        })
        setShowModal(true)
    }

    const handleSave = async (productData) => {
        if (!productData.id) {
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
                                            <div className="flex items-center gap-2">รหัสสินค้า {getSortIcon('id')}</div>
                                        </th>
                                        <th onClick={() => requestSort('category')} className="px-4 py-3 text-left text-xs font-semibold text-secondary-700 uppercase cursor-pointer hover:bg-secondary-100">
                                            <div className="flex items-center gap-2">ข้อมูลสินค้า {getSortIcon('category')}</div>
                                        </th>
                                        <th onClick={() => requestSort('price')} className="px-4 py-3 text-right text-xs font-semibold text-secondary-700 uppercase cursor-pointer hover:bg-secondary-100">
                                            <div className="flex items-center justify-end gap-2">ราคา {getSortIcon('price')}</div>
                                        </th>
                                        <th onClick={() => requestSort('stock')} className="px-4 py-3 text-right text-xs font-semibold text-secondary-700 uppercase cursor-pointer hover:bg-secondary-100">
                                            <div className="flex items-center justify-end gap-2">คงเหลือ {getSortIcon('stock')}</div>
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-secondary-700 uppercase w-24">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-secondary-100">
                                    {paginatedProducts.length > 0 ? (
                                        paginatedProducts.map((product, index) => {
                                            const productInfo = [
                                                product.category,
                                                product.subcategory,
                                                product.material,
                                                (product.length || product.width || product.height) ? `${product.length || '-'}×${product.width || '-'}×${product.height || '-'} cm` : null,
                                                product.color ? `สี${product.color}` : null
                                            ].filter(Boolean).join(' • ')

                                            return (
                                                <tr key={product.id} className="hover:bg-secondary-50 transition-colors">
                                                    <td className="px-4 py-4 text-sm text-secondary-500 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                                    <td className="px-4 py-4">
                                                        <div className="w-14 h-14 rounded-lg border border-secondary-200 overflow-hidden bg-secondary-50 flex items-center justify-center">
                                                            {(product.images && product.images[0]) ? (
                                                                <img src={product.images[0]} alt={product.id} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <ImageIcon size={20} className="text-secondary-300" />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <Link href={`/products/${product.id}`} className="font-mono text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline">
                                                            {product.id}
                                                        </Link>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="text-sm text-secondary-700 leading-relaxed">{productInfo || '-'}</div>
                                                        {product.description && (
                                                            <div className="text-xs text-secondary-400 mt-1 line-clamp-1">{product.description}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <span className="text-sm font-semibold text-secondary-900">฿{product.price?.toLocaleString() || 0}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <span className={`text-sm font-semibold ${product.stock > 0 ? 'text-success-600' : 'text-danger-600'}`}>{product.stock || 0}</span>
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
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-12 text-center text-secondary-500">
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
                                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden hover:shadow-lg transition-shadow group">
                                        <div className="aspect-square bg-secondary-50 relative overflow-hidden">
                                            {(product.images && product.images[0]) ? (
                                                <img src={product.images[0]} alt={product.id} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImageIcon size={48} className="text-secondary-300" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <Link href={`/products/${product.id}`} className="font-mono text-sm font-semibold text-primary-600 hover:text-primary-700 hover:underline block mb-2">
                                                {product.id}
                                            </Link>
                                            <p className="text-sm text-secondary-600 mb-3 line-clamp-2 min-h-[2.5rem]">
                                                {[product.category, product.subcategory].filter(Boolean).join(' • ') || '-'}
                                            </p>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-lg font-bold text-secondary-900">฿{product.price?.toLocaleString() || 0}</span>
                                                <span className={`text-sm font-semibold ${product.stock > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                                                    คงเหลือ {product.stock || 0}
                                                </span>
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
