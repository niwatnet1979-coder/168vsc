import React from 'react'
import { Menu, Package, Download, Plus } from 'lucide-react'

export default function ProductHeader({
    setIsSidebarOpen,
    totalItems,
    handleExport,
    handleAdd
}) {
    return (
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
                        <p className="text-sm text-secondary-500 mt-1">ทั้งหมด {totalItems} รายการ</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <button onClick={handleExport} className="whitespace-nowrap px-3 py-2 bg-white border border-secondary-300 text-secondary-700 rounded-lg hover:bg-secondary-50 transition-colors flex items-center gap-2 font-medium text-sm">
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
    )
}
