const fs = require('fs');

// Color Mapping Function
function getColorCode(thaiColor) {
    if (!thaiColor) return 'NA';
    const c = thaiColor.trim().toLowerCase();
    if (c.includes('ทอง')) return 'GLD';
    if (c.includes('เงิน')) return 'SLV';
    if (c.includes('ดำ')) return 'BLK';
    if (c.includes('ขาว')) return 'WHT';
    if (c.includes('โรส')) return 'RGD'; // Rose Gold
    if (c.includes('เทา')) return 'GRY';
    if (c.includes('น้ำเงิน')) return 'BLU';
    if (c.includes('ฟ้า')) return 'CYN';
    if (c.includes('เขียว')) return 'GRN';
    if (c.includes('แดง')) return 'RED';
    if (c.includes('เหลือง')) return 'YLW';
    if (c.includes('ส้ม')) return 'ORG';
    if (c.includes('ชมพู')) return 'PNK';
    if (c.includes('ม่วง')) return 'PRP';
    if (c.includes('น้ำตาล')) return 'BRN';
    if (c.includes('ใส')) return 'CLR';
    if (c.includes('คละ')) return 'MIX';
    if (c.includes('สนิม')) return 'RST';
    if (c.includes('ครีม')) return 'CRM';
    return 'OTH';
}

// Size Extraction Function
function getSize(description) {
    if (!description) return '00';
    // Look for patterns like "50cm", "50 cm", "D50", "50*"
    // Prioritize explicit "cm"
    const cmMatch = description.match(/(\d+)\s*[xX*]\s*(\d+)|(\d+)\s*cm|D(\d+)|L(\d+)|W(\d+)|H(\d+)/i);

    if (cmMatch) {
        // Return the first captured number that is defined
        for (let i = 1; i < cmMatch.length; i++) {
            if (cmMatch[i]) return cmMatch[i];
        }
    }
    return '00'; // Default if no size found
}

function cleanPrice(priceStr) {
    if (!priceStr) return 0;
    return parseFloat(priceStr.replace(/[" ,]/g, '')) || 0;
}

function inferCategory(id) {
    if (!id) return 'อื่นๆ';
    const prefix = id.substring(0, 2).toUpperCase();
    if (prefix === 'WL') return 'โคมไฟผนัง';
    if (prefix === 'CL') return 'โคมไฟเพดาน';
    if (prefix === 'FL') return 'โคมไฟตั้งพื้น';
    if (prefix === 'TL') return 'โคมไฟตั้งโต๊ะ';
    if (prefix === 'DL') return 'ดาวน์ไลท์';
    if (prefix === 'SL') return 'โคมไฟสปอตไลท์';
    if (['AA', 'AB', 'AC', 'MM', 'IN'].includes(prefix)) return 'โคมไฟระย้า';
    return 'อื่นๆ';
}

try {
    const csvContent = fs.readFileSync(' 30_11_2025 - Sale.csv', 'utf-8');
    const rows = csvContent.split('\n').map(row => {
        // Simple CSV parser handling quoted fields
        const result = [];
        let current = '';
        let inQuote = false;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    });

    const productsMap = {};

    rows.forEach((cols, index) => {
        if (index === 0) return; // Skip header
        if (cols.length < 8) return;

        const rawCode = cols[4]?.trim();
        if (!rawCode || rawCode === 'รหัสสินค้า' || rawCode.includes('XXX')) return;

        const rawColor = cols[5]?.trim() || '';
        const rawDesc = cols[7]?.trim() || '';
        const rawPrice = cleanPrice(cols[8]);

        // Generate Components
        const colorCode = getColorCode(rawColor);
        const sizeCode = getSize(rawDesc);

        // Construct New ID: CODE-SIZE-COLOR
        // Example: AA035-38-GLD
        const newId = `${rawCode}-${sizeCode}-${colorCode}`;

        if (!productsMap[newId]) {
            productsMap[newId] = {
                id: newId,
                baseCode: rawCode,
                category: inferCategory(rawCode),
                subcategory: '',
                price: 0,
                stock: 0,
                length: '',
                width: sizeCode !== '00' ? sizeCode : '',
                height: '',
                material: cols[6]?.trim() || '',
                color: rawColor,
                crystalColor: '',
                bulbType: '',
                light: '',
                remote: '',
                images: new Set(),
                description: rawDesc
            };
        }

        const p = productsMap[newId];

        // Update Price (keep max)
        if (rawPrice > p.price) p.price = rawPrice;

        // Collect Images
        for (let i = 11; i < cols.length; i++) {
            const img = cols[i]?.trim();
            if (img && img.startsWith('MAIN_Images/')) {
                p.images.add(img);
            }
        }

        // Update description if the new one is longer (likely more detailed)
        if (rawDesc.length > p.description.length) {
            p.description = rawDesc;
        }
    });

    const output = Object.values(productsMap).map(p => ({
        ...p,
        images: Array.from(p.images).slice(0, 4), // Limit 4 images
        description: p.description.substring(0, 200) // Truncate desc
    }));

    console.log(JSON.stringify(output, null, 2));

} catch (error) {
    console.error('Error:', error.message);
}
