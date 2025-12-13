import React, { createContext, useContext, useState, useEffect } from 'react'

const DebugContext = createContext()

export function DebugProvider({ children }) {
    const [isMouseDebugEnabled, setIsMouseDebugEnabled] = useState(false)

    // Load preference from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('debug_mouse_enabled')
        if (saved) {
            setIsMouseDebugEnabled(JSON.parse(saved))
        }
    }, [])

    const toggleMouseDebug = (value) => {
        const newValue = value !== undefined ? value : !isMouseDebugEnabled
        setIsMouseDebugEnabled(newValue)
        localStorage.setItem('debug_mouse_enabled', JSON.stringify(newValue))
    }

    return (
        <DebugContext.Provider value={{ isMouseDebugEnabled, toggleMouseDebug }}>
            {children}
        </DebugContext.Provider>
    )
}

export function useDebug() {
    return useContext(DebugContext)
}
