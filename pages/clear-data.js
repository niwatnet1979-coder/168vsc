import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2, Home, CheckCircle } from 'lucide-react';
import Head from 'next/head';

export default function ClearData() {
    const [cleared, setCleared] = useState(false);

    useEffect(() => {
        // Clear all localStorage data
        localStorage.clear();
        setCleared(true);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Head>
                <title>Clear Data | 168VSC</title>
            </Head>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center space-y-6">
                <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                    {cleared ? (
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    ) : (
                        <Trash2 className="w-10 h-10 text-red-600" />
                    )}
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {cleared ? 'ล้างข้อมูลเรียบร้อย' : 'กำลังล้างข้อมูล...'}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {cleared
                            ? 'ข้อมูลจำลอง (Mock Data) และข้อมูลทั้งหมดในเครื่องถูกลบแล้ว ข้อมูลที่เชื่อมต่อกับ Supabase Database จริงจะยังคงอยู่'
                            : 'กรุณารอสักครู่...'}
                    </p>
                </div>

                {cleared && (
                    <div className="pt-4">
                        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors w-full justify-center">
                            <Home size={20} />
                            กลับหน้าหลัก
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
