import React from 'react'
import { Search, List, LayoutGrid } from 'lucide-react'

export default function ProductToolbar({
    searchTerm,
    setSearchTerm,
    setCurrentPage,
    viewMode,
    setViewMode
}) {
    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                <input
                    type="text"
                    placeholder="ค้นหารหัสสินค้า, ชื่อ, หรือประเภท..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value)
                        // Reset to page 1 on search
                        if (setCurrentPage) setCurrentPage(1)
                    }}
                    className="w-full pl-11 pr-4 py-3 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                />
            </div>
            <div className="flex items-center gap-2 bg-white border border-secondary-200 rounded-lg p-1">
                <button
                    onClick={() => setViewMode('table')}
                    className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${viewMode === 'table' ? 'bg-primary-100 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'}`}
                >
                    <List size={18} />
                    ตาราง
                </button>
                <button
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-secondary-600 hover:bg-secondary-50'}`}
                >
                    <LayoutGrid size={18} />
                    การ์ด
                </button>
            </div>
        </div>
    )
}
