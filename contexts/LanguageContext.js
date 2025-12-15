
import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
    en: {
        'Dashboard': 'Dashboard',
        'Order Entry': 'Order Entry',
        'Orders List': 'Orders List',
        'Products': 'Products',
        'Inventory': 'Inventory',
        'Purchasing': 'Purchasing',
        'Quality Control': 'Quality Control',
        'Customers': 'Customers',
        'Team': 'Team',
        'Jobs': 'Jobs',
        'Mobile': 'Mobile',
        'Reports': 'Reports',
        'Settings': 'Settings',
        'Switch Account': 'Switch Account',
        'Logout': 'Logout',
        'System': 'VSC System',
        'Language': 'Language'
    },
    th: {
        'Dashboard': 'แดชบอร์ด',
        'Order Entry': 'บันทึกออเดอร์',
        'Orders List': 'รายการออเดอร์',
        'Products': 'สินค้า',
        'Inventory': 'คลังสินค้า',
        'Purchasing': 'จัดซื้อ',
        'Quality Control': 'ตรวจสอบคุณภาพ (QC)',
        'Customers': 'ลูกค้า',
        'Team': 'ทีมงาน',
        'Jobs': 'งานติดตั้ง',
        'Mobile': 'โมบายล์',
        'Reports': 'รายงาน',
        'Settings': 'ตั้งค่า',
        'Switch Account': 'สลับบัญชี',
        'Logout': 'ออกจากระบบ',
        'System': 'ระบบ VSC',
        'Language': 'ภาษา'
    }
};

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        const savedLang = localStorage.getItem('app_language');
        if (savedLang) {
            setLanguage(savedLang);
        }
    }, []);

    const toggleLanguage = () => {
        const newLang = language === 'en' ? 'th' : 'en';
        setLanguage(newLang);
        localStorage.setItem('app_language', newLang);
    };

    const t = (key) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
