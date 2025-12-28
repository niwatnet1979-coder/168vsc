import React, { useState } from 'react'
import { Combobox } from '@headlessui/react'
import { Search, ChevronDown, Plus, Box, Palette, Gem, X, Settings } from 'lucide-react'

const BoxIcon = () => <Box size={14} className="text-secondary-400" />
const PaletteIcon = () => <Palette size={14} className="text-secondary-400" />
const GemIcon = () => <Gem size={14} className="text-secondary-400" />
const DefaultIcon = () => <Box size={24} className="text-secondary-300" />

export default function VariantSelector({
    variants = [],
    value, // selected index
    onChange,
    onAction, // for "Add Variant"
    disabled = false,
    placeholder = "-- เลือก Variant --"
}) {
    const [query, setQuery] = useState('')

    const filteredVariants = query === ''
        ? variants
        : variants.filter((v) => {
            const sku = v.sku || ''
            const name = v.name || ''
            return sku.toLowerCase().includes(query.toLowerCase()) ||
                name.toLowerCase().includes(query.toLowerCase())
        })

    const selectedVariant = variants[value]

    return (
        <div className="w-full">
            <Combobox value={value} onChange={onChange} disabled={disabled}>
                {({ open }) => (
                    <div className="relative">
                        <div className="relative w-full">
                            {/* Display Card when selected AND not open, OR show selection prompt */}
                            {!open && selectedVariant ? (
                                <Combobox.Button className="w-full text-left">
                                    <div className="flex items-center gap-3 w-full">
                                        {/* Image */}
                                        <div className="w-12 h-12 bg-secondary-100 rounded-lg flex-shrink-0 overflow-hidden border border-secondary-100 flex items-center justify-center text-secondary-300 relative">
                                            {selectedVariant.images?.[0] ? (
                                                <img src={selectedVariant.images[0]} className="w-full h-full object-cover" alt="Variant" />
                                            ) : (
                                                <DefaultIcon />
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <div className="font-bold text-secondary-900 text-sm truncate pr-2">
                                                    {selectedVariant.sku || '-- No SKU --'}
                                                </div>
                                                <div className="text-primary-600 font-bold text-sm whitespace-nowrap">
                                                    ฿{selectedVariant.price?.toLocaleString()}
                                                </div>
                                            </div>

                                            <div className="text-[11px] text-secondary-500 flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 leading-none">
                                                {selectedVariant.dimensions && (
                                                    <div className="flex items-center gap-1">
                                                        <BoxIcon />
                                                        <span>{selectedVariant.dimensions.length}×{selectedVariant.dimensions.width}×{selectedVariant.dimensions.height}cm</span>
                                                    </div>
                                                )}
                                                {selectedVariant.color && (
                                                    <div className="flex items-center gap-1">
                                                        <PaletteIcon />
                                                        <span>{selectedVariant.color}</span>
                                                    </div>
                                                )}
                                                {selectedVariant.crystalColor && (
                                                    <div className="flex items-center gap-1">
                                                        <GemIcon />
                                                        <span>{selectedVariant.crystalColor}</span>
                                                    </div>
                                                )}
                                                <div className="ml-auto flex items-center gap-1.5 px-0.5">
                                                    <span className="text-secondary-400 text-[10px]">คงเหลือ {selectedVariant.available ?? selectedVariant.stock ?? 0}</span>
                                                    <Settings size={12} className="text-secondary-300" />
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronDown className="h-4 w-4 text-secondary-400 shrink-0 ml-1" aria-hidden="true" />
                                    </div>
                                </Combobox.Button>
                            ) : (
                                <div className="relative">
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none">
                                        <Search size={14} />
                                    </div>
                                    <Combobox.Input
                                        className={`w-full bg-transparent border-none pl-5 pr-6 py-0 text-sm font-medium text-secondary-900 focus:ring-0 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-text'}`}
                                        displayValue={() => ''}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder={open ? "พิมพ์เพื่อค้นหา..." : placeholder}
                                    />
                                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center">
                                        <ChevronDown className="h-4 w-4 text-secondary-400" aria-hidden="true" />
                                    </Combobox.Button>
                                </div>
                            )}
                        </div>

                        <Combobox.Options
                            className="absolute z-[100] mt-2 w-[calc(100%+1.5rem)] -left-3 bg-white rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none flex flex-col overflow-hidden"
                        >
                            <div className="overflow-y-auto max-h-[220px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {filteredVariants.length === 0 ? (
                                    <div className="relative cursor-default select-none py-10 px-4 text-secondary-500 text-center text-sm">
                                        ไม่พบข้อมูลสินค้าที่ตรงกัน
                                    </div>
                                ) : (
                                    filteredVariants.map((v, i) => {
                                        const realIndex = variants.indexOf(v)
                                        return (
                                            <Combobox.Option
                                                key={realIndex}
                                                className={({ active }) =>
                                                    `relative cursor-default select-none p-3 border-b border-secondary-50 last:border-0 ${active ? 'bg-primary-50' : ''
                                                    }`
                                                }
                                                value={realIndex}
                                            >
                                                {({ selected, active }) => (
                                                    <div className="flex items-center gap-3">
                                                        {/* Image */}
                                                        <div className="w-12 h-12 bg-secondary-100 rounded-lg flex-shrink-0 overflow-hidden border border-secondary-100 flex items-center justify-center text-secondary-300 relative">
                                                            {v.images?.[0] ? (
                                                                <img src={v.images[0]} className="w-full h-full object-cover" alt="Variant" />
                                                            ) : (
                                                                <DefaultIcon />
                                                            )}
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0 text-left">
                                                            <div className="flex justify-between items-start">
                                                                <div className={`font-bold text-sm truncate pr-2 ${selected ? 'text-primary-700' : 'text-secondary-900'}`}>
                                                                    {v.sku || '-- No SKU --'}
                                                                </div>
                                                                <div className="text-primary-600 font-bold text-sm whitespace-nowrap">
                                                                    ฿{v.price?.toLocaleString()}
                                                                </div>
                                                            </div>

                                                            <div className="text-[11px] text-secondary-500 flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 leading-none">
                                                                {v.dimensions && (
                                                                    <div className="flex items-center gap-1">
                                                                        <BoxIcon />
                                                                        <span>{v.dimensions.length}×{v.dimensions.width}×{v.dimensions.height}cm</span>
                                                                    </div>
                                                                )}
                                                                {v.color && (
                                                                    <div className="flex items-center gap-1">
                                                                        <PaletteIcon />
                                                                        <span>{v.color}</span>
                                                                    </div>
                                                                )}
                                                                {v.crystalColor && (
                                                                    <div className="flex items-center gap-1">
                                                                        <GemIcon />
                                                                        <span>{v.crystalColor}</span>
                                                                    </div>
                                                                )}
                                                                <div className="ml-auto flex items-center gap-1.5 px-0.5">
                                                                    <span className="text-secondary-400 text-[10px]">คงเหลือ {v.available ?? v.stock ?? 0}</span>
                                                                    <Settings size={12} className="text-secondary-300" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Combobox.Option>
                                        )
                                    })
                                )}
                            </div>

                            {onAction && (
                                <div
                                    onMouseDown={(e) => {
                                        // Use onMouseDown to trigger before blur/close
                                        e.preventDefault()
                                        e.stopPropagation()
                                        onAction()
                                    }}
                                    className="bg-primary-50 p-3 border-t-2 border-dashed border-primary-200 cursor-pointer hover:bg-primary-100 text-primary-600 font-bold text-sm flex items-center justify-center gap-2 transition-colors sticky bottom-0"
                                >
                                    <Plus size={18} /> เพิ่ม Variant
                                </div>
                            )}
                        </Combobox.Options>
                    </div>
                )}
            </Combobox>
        </div>
    )
}
