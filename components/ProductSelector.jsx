import React, { useState } from 'react'
import { Combobox } from '@headlessui/react'
import { Search, ChevronDown, Plus, Package } from 'lucide-react'
import ProductCard from './ProductCard'

// Shared component for the search input view
const ProductSearchInput = ({ query, setQuery, placeholder, disabled, open }) => (
    <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none">
            <Search size={14} />
        </div>
        <Combobox.Input
            className={`w-full bg-transparent border-none pl-9 pr-8 py-2.5 text-sm font-medium text-secondary-900 focus:ring-0 outline-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-text'}`}
            displayValue={() => ''}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={open ? "พิมพ์เพื่อค้นหา..." : placeholder}
        />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown className="h-4 w-4 text-secondary-400" aria-hidden="true" />
        </Combobox.Button>
    </div>
)

export default function ProductSelector({
    products = [],
    selectedId,
    onSelect,
    onAdd,
    disabled = false,
    placeholder = "-- เลือกสินค้า --"
}) {
    const [query, setQuery] = useState('')

    const filteredProducts = query === ''
        ? products.slice(0, 50)
        : products.filter((p) => {
            const code = p.product_code || p.id || ''
            const name = p.name || ''
            const material = p.material || ''
            const searchStr = `${code} ${name} ${material}`.toLowerCase()
            return searchStr.includes(query.toLowerCase())
        }).slice(0, 50)

    const selectedProduct = products.find(p => p.uuid === selectedId || p.product_code === selectedId || p.id === selectedId)

    return (
        <div className="w-full">
            <Combobox value={selectedProduct} onChange={onSelect} disabled={disabled}>
                {({ open }) => (
                    <div className="relative">
                        <div className="relative w-full">
                            {!open && selectedProduct ? (
                                <Combobox.Button as="div" className="w-full text-left cursor-pointer bg-secondary-50 p-2.5 rounded-lg border border-secondary-100 transition-all hover:bg-secondary-100 hover:border-secondary-200 hover:shadow-md group">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <div className="text-secondary-500 text-[10px] font-medium uppercase tracking-wider">สินค้า <span className="text-danger-500">*</span></div>
                                    </div>
                                    <ProductCard
                                        product={selectedProduct}
                                        variant="default"
                                        showImage={false} // Match user's green box preference
                                    />
                                </Combobox.Button>
                            ) : (
                                <div className="bg-secondary-50 p-3 rounded-lg border-none">
                                    <label className="block text-xs font-medium text-secondary-500 mb-1">
                                        สินค้า <span className="text-danger-500">*</span>
                                    </label>
                                    <ProductSearchInput
                                        query={query}
                                        setQuery={setQuery}
                                        placeholder={placeholder}
                                        disabled={disabled}
                                        open={open}
                                    />
                                </div>
                            )}
                        </div>

                        <Combobox.Options
                            className="absolute z-[110] mt-1.5 w-full left-0 bg-white rounded-lg shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none flex flex-col overflow-hidden"
                        >
                            <div className="overflow-y-auto max-h-[280px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {filteredProducts.length === 0 ? (
                                    <div className="relative cursor-default select-none py-10 px-4 text-secondary-500 text-center text-sm">
                                        ไม่พบข้อมูลสินค้าที่ตรงกัน
                                    </div>
                                ) : (
                                    filteredProducts.map((p) => (
                                        <Combobox.Option
                                            key={p.uuid || p.id}
                                            className={({ active }) =>
                                                `relative cursor-default select-none p-2 border-b border-secondary-50 last:border-0 ${active ? 'bg-primary-50' : ''}`
                                            }
                                            value={p}
                                        >
                                            {({ selected }) => (
                                                <ProductCard
                                                    product={p}
                                                    variant="compact"
                                                />
                                            )}
                                        </Combobox.Option>
                                    ))
                                )}
                            </div>

                            {onAdd && (
                                <div
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        onAdd()
                                    }}
                                    className="bg-primary-50 p-3 border-t-2 border-dashed border-primary-200 cursor-pointer hover:bg-primary-100 text-primary-600 font-bold text-sm flex items-center justify-center gap-2 transition-colors sticky bottom-0"
                                >
                                    <Plus size={18} /> เพิ่มสินค้าใหม่
                                </div>
                            )}
                        </Combobox.Options>
                    </div>
                )}
            </Combobox>
        </div>
    )
}
