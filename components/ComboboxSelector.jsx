import React, { useState } from 'react'
import { Combobox } from '@headlessui/react'
import { Search, ChevronDown, Plus } from 'lucide-react'

/**
 * A generalized Combobox Selector component based on the perfected VariantSelector pattern.
 * Supports:
 * - Rich item rendering via renderItem prop
 * - Integrated search/filtering
 * - Custom "Add New" action button at the bottom
 * - Standardized styling (rounded-lg, shadow-2xl)
 * - Fixed height dropdown (max-h-3 items)
 */
export default function ComboboxSelector({
    items = [],
    value, // selected item or index
    onChange,
    onAction, // for "Add New Item" click
    renderItem, // function to render each item: (item, { isSelected, active }) => JSX
    renderSelected, // function to render the selected state: (item) => JSX
    filterProperty = 'name', // property to filter by (or custom filter function)
    placeholder = "-- Select --",
    disabled = false
}) {
    const [query, setQuery] = useState('')

    const filteredItems = query === ''
        ? items
        : items.filter((item) => {
            const val = typeof filterProperty === 'function'
                ? filterProperty(item)
                : item[filterProperty] || ''
            return val.toLowerCase().includes(query.toLowerCase())
        })

    return (
        <div className="w-full">
            <Combobox value={value} onChange={onChange} disabled={disabled}>
                {({ open }) => (
                    <div className="relative">
                        <div className="relative w-full">
                            {!open && value ? (
                                <Combobox.Button as="div" className="w-full text-left cursor-pointer">
                                    {renderSelected ? renderSelected(value) : (
                                        <div className="flex items-center justify-between w-full p-2.5 border border-secondary-200 rounded-lg bg-white">
                                            <span className="text-secondary-900 text-sm font-medium">
                                                {typeof value === 'object' ? value[filterProperty] : value}
                                            </span>
                                            <ChevronDown className="h-4 w-4 text-secondary-400 shrink-0" />
                                        </div>
                                    )}
                                </Combobox.Button>
                            ) : (
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none">
                                        <Search size={14} />
                                    </div>
                                    <Combobox.Input
                                        className={`w-full bg-white border border-secondary-200 rounded-lg pl-9 pr-8 py-2.5 text-sm font-medium text-secondary-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-text'}`}
                                        displayValue={() => ''}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder={open ? "Type to search..." : placeholder}
                                    />
                                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                        <ChevronDown className="h-4 w-4 text-secondary-400" aria-hidden="true" />
                                    </Combobox.Button>
                                </div>
                            )}
                        </div>

                        <Combobox.Options
                            className="absolute z-[100] mt-1.5 w-[calc(100%+1rem)] -left-2 bg-white rounded-lg shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none flex flex-col overflow-hidden"
                        >
                            <div className="overflow-y-auto max-h-[220px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {filteredItems.length === 0 ? (
                                    <div className="relative cursor-default select-none py-10 px-4 text-secondary-500 text-center text-sm">
                                        No items found.
                                    </div>
                                ) : (
                                    filteredItems.map((item, index) => (
                                        <Combobox.Option
                                            key={index}
                                            className={({ active }) =>
                                                `relative cursor-default select-none p-3 border-b border-secondary-50 last:border-0 ${active ? 'bg-primary-50' : ''}`
                                            }
                                            value={item}
                                        >
                                            {({ selected, active }) => (
                                                renderItem ? renderItem(item, { isSelected: selected, active }) : (
                                                    <span className={`block truncate ${selected ? 'font-bold text-primary-600' : 'font-normal'}`}>
                                                        {typeof item === 'object' ? item[filterProperty] : item}
                                                    </span>
                                                )
                                            )}
                                        </Combobox.Option>
                                    ))
                                )}
                            </div>

                            {onAction && (
                                <div
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        onAction()
                                    }}
                                    className="bg-primary-50 p-3 border-t-2 border-dashed border-primary-200 cursor-pointer hover:bg-primary-100 text-primary-600 font-bold text-sm flex items-center justify-center gap-2 transition-colors sticky bottom-0"
                                >
                                    <Plus size={18} /> Add New Item
                                </div>
                            )}
                        </Combobox.Options>
                    </div>
                )}
            </Combobox>
        </div>
    )
}
