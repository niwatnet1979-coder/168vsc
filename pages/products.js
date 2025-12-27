import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import AppLayout from '../components/AppLayout'
import * as XLSX from 'xlsx'
import { DataManager } from '../lib/dataManager'
import { supabase } from '../lib/supabaseClient' // Realtime
import ProductModal from '../components/ProductModal'
import { showConfirm, showLoading, showSuccess, showError } from '../lib/sweetAlert'

// Components
import ProductHeader from '../components/ProductHeader'
import ProductToolbar from '../components/ProductToolbar'
import ProductTable from '../components/ProductTable'
import ProductCardGrid from '../components/ProductCardGrid'

export default function ProductManagement() {
    const [products, setProducts] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [currentProduct, setCurrentProduct] = useState(null)
    const [sortConfig, setSortConfig] = useState({ key: 'product_code', direction: 'ascending' })
    const [viewMode, setViewMode] = useState('table')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20
    const [expandedProducts, setExpandedProducts] = useState(new Set())
    const [isLoading, setIsLoading] = useState(true)


    const loadProducts = async (useLoading = true) => {
        if (useLoading) setIsLoading(true)
        const data = await DataManager.getProducts()
        setProducts(data)
        if (useLoading) setIsLoading(false)
    }

    useEffect(() => {
        loadProducts()

        // Realtime Subscription
        const channel = supabase
            .channel('product-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
                loadProducts(false) // Silent update
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'product_variants' }, () => {
                loadProducts(false) // Silent update
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const requestSort = (key) => {
        let direction = 'ascending'
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending'
        }
        setSortConfig({ key, direction })
    }

    // Filter Logic
    const filteredProducts = products.filter(p => {
        const term = searchTerm.toLowerCase()
        return (
            (p.product_code && (typeof p.product_code === 'string' ? p.product_code.toLowerCase() : String(p.product_code)).includes(term)) ||
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
            'รหัสสินค้า': p.product_code,
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

    const handleDelete = async (uuid) => {
        const result = await showConfirm({
            title: 'ยืนยันการลบสินค้า',
            text: "คุณต้องการลบสินค้านี้ใช่หรือไม่?",
            confirmButtonText: 'ลบ',
            confirmButtonColor: '#d33'
        })

        if (!result.isConfirmed) return

        showLoading('กำลังลบสินค้า...', 'กรุณารอสักครู่')

        const resultDelete = await DataManager.deleteProduct(uuid)
        if (resultDelete.success) {
            setProducts(products.filter(p => p.uuid !== uuid))
            await showSuccess({ title: 'ลบสินค้าสำเร็จ' })
        } else {
            await showError({
                title: 'ไม่สามารถลบสินค้าได้',
                text: resultDelete.error || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
            })
        }
    }

    const handleEdit = (product) => {
        setCurrentProduct({ ...product })
        setShowModal(true)
    }

    const handleAdd = () => {
        setCurrentProduct({
            product_code: '', category: '', name: '', subcategory: '', price: 0, stock: 0, description: '',
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

        // 1. Confirm Dialog
        const confirmResult = await showConfirm({
            title: 'ยืนยันการบันทึก?',
            text: "คุณต้องการบันทึกข้อมูลสินค้าใช่หรือไม่",
            confirmButtonText: 'ใช่, บันทึกเลย',
            cancelButtonText: 'ยกเลิก'
        })

        if (!confirmResult.isConfirmed) return

        // 2. Show Loading
        showLoading('กำลังบันทึกข้อมูล...', 'กรุณารอสักครู่')

        // 3. Perform Save
        const savedProduct = await DataManager.saveProduct(productData)

        if (savedProduct) {
            await loadProducts()
            setShowModal(false)
            setCurrentProduct(null)

            // 4. Show Success
            await showSuccess({
                title: 'บันทึกสำเร็จ',
                text: 'ข้อมูลสินค้าถูกบันทึกเรียบร้อยแล้ว'
            })
        } else {
            // 5. Show Error
            await showError({
                title: 'เกิดข้อผิดพลาด',
                text: 'บันทึกสินค้าไม่สำเร็จ กรุณาลองใหม่'
            })
        }
    }

    return (
        <AppLayout
            renderHeader={({ setIsSidebarOpen }) => (
                <ProductHeader
                    setIsSidebarOpen={setIsSidebarOpen}
                    totalItems={filteredProducts.length}
                    handleExport={handleExportExcel}
                    handleAdd={handleAdd}
                />
            )}
        >
            <Head>
                <title>จัดการสินค้า - 168VSC System</title>
            </Head>

            <div className="space-y-6 pt-6">

                <ProductToolbar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    setCurrentPage={setCurrentPage}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                />

                {viewMode === 'table' && (
                    <ProductTable
                        products={paginatedProducts}
                        totalItems={filteredProducts.length}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        sortConfig={sortConfig}
                        requestSort={requestSort}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                        toggleExpand={toggleExpand}
                        expandedProducts={expandedProducts}
                    />
                )}

                {viewMode === 'grid' && (
                    <ProductCardGrid
                        products={paginatedProducts}
                        totalItems={filteredProducts.length}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                    />
                )}

            </div>

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
