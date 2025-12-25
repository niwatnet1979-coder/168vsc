import React, { useState } from 'react';
import { X, Sparkles, Clipboard } from 'lucide-react';

export default function TaxAddressParserModal({ isOpen, onClose, onParse }) {
    const [text, setText] = useState('');

    if (!isOpen) return null;

    const handleParse = () => {
        if (!text) return;

        // Sanitize invisible characters and normalize spaces
        let workingText = text.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim();

        const result = {
            company: '',
            contactName: '', // New field for extracted contact name
            taxid: '',
            branch: '',
            number: '',
            villageno: '',
            village: '',
            lane: '',
            road: '',
            subdistrict: '',
            district: '',
            province: '',
            zipcode: '',
            phone: '',
            email: ''
        };

        // 1. Extract Global Unique Tokens (Tax ID, Zip, Province, Amphoe, Tambon)
        const extract = (regex, key) => {
            const match = workingText.match(regex);
            if (match) {
                if (key) result[key] = match[2] || match[1];
                workingText = workingText.replace(match[0], ' ').trim();
                return true;
            }
            return false;
        };

        extract(/(\d{13})/, 'taxid');

        // Extract/Remove Phone Number
        // Matches 0xx-xxx-xxxx, 0xx xxx xxxx, or 0xxxxxxxxx
        const phoneRegex = /(0\d{1,2}[-\s]?\d{3}[-\s]?\d{3,4})/;
        const phoneMatch = workingText.match(phoneRegex);
        if (phoneMatch) {
            result.phone = phoneMatch[0].replace(/[-\s]/g, '');
            workingText = workingText.replace(phoneMatch[0], ' ').trim();
        }

        // Extract Contact Person (K., คุณ, etc.)
        // Matches K.Name, คุณName, etc.
        const contactRegex = /(?:^|\s)((?:K\.|คุณ|Mr\.|Ms\.|Mrs\.|นาย|นาง|น\.ส\.|Miss)\s*[^\s]+(?:\s+[^\s]+)?)/i;
        const contactMatch = workingText.match(contactRegex);
        if (contactMatch) {
            result.contactName = contactMatch[1].trim();
            workingText = workingText.replace(contactMatch[0], ' ').trim();
        }

        // Extract Email
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/;
        const emailMatch = workingText.match(emailRegex);
        if (emailMatch) {
            result.email = emailMatch[0];
            workingText = workingText.replace(emailMatch[0], ' ').trim();
        }

        if (workingText.match(/(\(?สำนักงานใหญ่\)?|Head Office)/i)) {
            result.branch = 'สำนักงานใหญ่';
            workingText = workingText.replace(/(\(?สำนักงานใหญ่\)?|Head Office)/i, ' ').trim();
        } else {
            extract(/(สาขา|Branch)[\s:]*(\d+|[a-zA-Z0-9]+)/i, 'branch');
        }

        extract(/(\d{5})(?!\d)/, 'zipcode');

        if (!extract(/(จังหวัด|จ\.)\s*([^\s]+)/, 'province')) {
            if (workingText.includes('กรุงเทพ')) {
                result.province = 'กรุงเทพมหานคร';
                workingText = workingText.replace(/กรุงเทพ(มหานคร)?/, ' ').trim();
            }
        }

        extract(/(อำเภอ|อ\.|เขต)\s*([^\s]+)/, 'district');
        extract(/(ตำบล|ต\.|แขวง)\s*([^\s]+)/, 'subdistrict');

        // 2. Identify Split Point
        let splitIndex = -1;

        // Priority A: Company Suffix
        const companySuffixMatch = workingText.match(/\s+(จำกัด|Limited|Inc\.?|Co\.?)\b/i);
        if (companySuffixMatch) {
            splitIndex = companySuffixMatch.index + companySuffixMatch[0].length;
        } else {
            // Priority B: Address Start Indicators
            const indicators = [
                /(เลขที่|No\.|^)\s*[\d\/]+/,
                /(ถนน|ถ\.)/,
                /(ซอย|ซ\.)/,
                /\s\d+\/\d+\s/,
                // Look for: Space + Number + Space + AddressKeyword
                // Matches " 184 Moo" or " 64/44-45 Road"
                /(\s|^)[\d/\-]+\s+(?=หมู่|ม\.|ถนน|ถ\.|ซอย|ซ\.|ตำบล|ต\.|แขวง|อำเภอ|อ\.|เขต|จังหวัด|จ\.)/
            ];

            let earliestIndex = Infinity;
            let bestMatchLength = 0;

            indicators.forEach(regex => {
                const m = workingText.match(regex);
                if (m) {
                    if (m.index < earliestIndex) {
                        earliestIndex = m.index;
                        bestMatchLength = m[0].length;
                    }
                }
            });

            if (earliestIndex !== Infinity) {
                splitIndex = earliestIndex;
            }
        }

        let namePart = '';
        let addressPart = '';

        if (splitIndex !== -1) {
            namePart = workingText.substring(0, splitIndex).trim();
            addressPart = workingText.substring(splitIndex).trim();
        } else {
            const slashMatch = workingText.match(/(\d+\/\d+)/);
            if (slashMatch) {
                const idx = workingText.indexOf(slashMatch[0]);
                namePart = workingText.substring(0, idx).trim();
                addressPart = workingText.substring(idx).trim();
            } else {
                namePart = workingText;
            }
        }

        // 3. Process Name
        result.company = namePart.replace(/^(ที่อยู่|Address|ชื่อ|Name|:)+/i, '').trim();
        let initialName = result.company; // Store original name part

        // Use initialName + Contact Name for fullLabel
        result.fullLabel = [initialName, result.contactName].filter(Boolean).join(' ');

        // 4. Process Address Part
        let addrText = addressPart;

        // Extract Moo (support both Thai and English)
        const mooMatch = addrText.match(/(หมู่|ม\.|Moo|M\.)\s*(\d+)/i);
        if (mooMatch) {
            result.villageno = mooMatch[2];
            addrText = addrText.replace(mooMatch[0], ' ').trim();
        }

        // Extract Soi (support both Thai and English)
        const soiRegex = /(ซอย|ซ\.|Soi|S\.)\s*([^\s]+(?:\s+\d+)?)/i;
        const soiMatch = addrText.match(soiRegex);
        if (soiMatch) {
            result.lane = soiMatch[2];
            addrText = addrText.replace(soiMatch[0], ' ').trim();
        }

        // Extract Road (support both Thai and English)
        const roadRegex = /(ถนน|ถ\.|Road|Rd\.)\s*([^\s]+)/i;
        const roadMatch = addrText.match(roadRegex);
        if (roadMatch) {
            result.road = roadMatch[2];
            addrText = addrText.replace(roadMatch[0], ' ').trim();
        }

        // Extract House Number
        // Priority: Start of string. Updated to support hyphen/slash (e.g. 64/44-45)
        const smartNoMatch = addrText.match(/^([\d/\-]+)/);
        if (smartNoMatch) {
            result.number = smartNoMatch[1];
            addrText = addrText.replace(smartNoMatch[0], ' ').trim();
        } else {
            const noRegex = /(?:เลขที่|No\.)?\s*([\d/\-]+)/;
            const noMatch = addrText.match(noRegex);
            if (noMatch) {
                result.number = noMatch[1];
                addrText = addrText.replace(noMatch[0], ' ').trim();
            }
        }

        // Capture remaining text as Village/Building OR Company Name if misplaced
        let leftovers = addrText.trim();
        if (leftovers && leftovers.length > 2 && !leftovers.match(/^[\d\-\s]+$/)) {
            // Check if it looks like a Company Name (re-check)
            if (leftovers.match(/^(บริษัท|บ\.|หจก|ห้าง|ร้าน|โรง|คณะ|การ|The|Company)/i)) {
                // If the "leftover" looks like a company name and our initial company was actually empty or short, swap?
                // Or maybe just append/replace?
                // But typically if we stripped everything else, this is likely Village.

                // If result.company is suspicious (empty), use this.
                if (!result.company) {
                    result.company = leftovers;
                } else {
                    // If we already have a company name, this might be Village "อาคาร ABC"
                    result.village = leftovers;
                }
            } else {
                result.village = leftovers;
            }
        }

        // Final fallback: If contactName is empty but result.village looks like a person?
        // E.g. "K.เตี้ย"
        if (result.village && !result.contactName && result.village.match(/^(K\.|คุณ|Mr|Ms|Mrs|นาย|นาง|น\.ส)/i)) {
            result.contactName = result.village;
            result.village = '';
        }

        onParse(result);
        onClose();
        setText('');
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-primary-50">
                    <h3 className="text-lg font-bold text-primary-900 flex items-center gap-2">
                        <Sparkles size={18} className="text-primary-600" />
                        ระบบกรอกข้อมูลอัตโนมัติ
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
                </div>

                <div className="p-4">
                    <p className="text-sm text-gray-500 mb-2">วางข้อความที่อยู่/ข้อมูลใบกำกับภาษีที่นี่ ระบบจะแยกข้อมูลให้โดยอัตโนมัติ</p>
                    <textarea
                        className="w-full h-40 p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                        placeholder="ตัวอย่าง: บริษัท ตัวอย่าง จำกัด 123 หมู่ 4 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพ 10110 เลขผู้เสียภาษี 1234567890123"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    ></textarea>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-white text-sm font-medium">ยกเลิก</button>
                    <button onClick={handleParse} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 text-sm font-medium flex items-center gap-2">
                        <Sparkles size={16} />
                        แยกข้อมูลอัตโนมัติ
                    </button>
                </div>
            </div>
        </div>
    );
}
