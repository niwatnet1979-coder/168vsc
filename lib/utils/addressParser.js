/**
 * Universal Address Parser - Version 2.2 DEBUG
 * Adding console.log to debug issues
 */

function extractGlobalTokens(text) {
    const tokens = {
        taxid: '',
        zipcode: '',
        phone: '',
        email: '',
        maps: '',
        branch: ''
    };

    let cleanedText = text;

    // Tax ID
    const taxidMatch = cleanedText.match(/(\d{13})/);
    if (taxidMatch) {
        tokens.taxid = taxidMatch[1];
        cleanedText = cleanedText.replace(taxidMatch[0], ' ');
    }

    // Phone
    const phoneMatch = cleanedText.match(/(โทร\.?|Tel\.?|Phone\.?)?\s*(0\d{1,2}[-\s]?\d{3}[-\s]?\d{3,4})/i);
    if (phoneMatch) {
        tokens.phone = phoneMatch[2].replace(/[-\s]/g, '');
        cleanedText = cleanedText.replace(phoneMatch[0], ' ');
    }

    // Email
    const emailMatch = cleanedText.match(/(อีเมล\.?|Email\.?)?\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
    if (emailMatch) {
        tokens.email = emailMatch[2];
        cleanedText = cleanedText.replace(emailMatch[0], ' ');
    }

    // Maps
    const mapsMatch = cleanedText.match(/(https?:\/\/[^\s]+)/);
    if (mapsMatch) {
        tokens.maps = mapsMatch[0];
        cleanedText = cleanedText.replace(mapsMatch[0], ' ');
    }

    // Branch
    if (cleanedText.match(/(\(?สำนักงานใหญ่\)?|Head Office)/i)) {
        tokens.branch = 'สำนักงานใหญ่';
        cleanedText = cleanedText.replace(/(\(?สำนักงานใหญ่\)?|Head Office)/gi, ' ');
    } else {
        const branchMatch = cleanedText.match(/(สาขา|Branch)[\s:]*(\d+|[a-zA-Z0-9]+)/i);
        if (branchMatch) {
            tokens.branch = branchMatch[2];
            cleanedText = cleanedText.replace(branchMatch[0], ' ');
        }
    }

    // Zipcode
    const zipcodeMatches = cleanedText.match(/(?<!\d)(\d{5})(?!\d)/g);
    if (zipcodeMatches) {
        const realZipcode = zipcodeMatches.find(z => parseInt(z) > 10000) || zipcodeMatches[zipcodeMatches.length - 1];
        tokens.zipcode = realZipcode;
        cleanedText = cleanedText.replace(realZipcode, ' ');
    }

    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();

    console.log('🔍 After extractGlobalTokens:', { tokens, cleanedText });

    return { tokens, cleanedText };
}

function findSplitPoint(text) {
    // Thai company
    const thaiMatch = text.match(/บริษัท\s+([\u0E00-\u0E7Fa-zA-Z\s]+?)\s+จำกัด/i);
    if (thaiMatch) {
        const companyEnd = thaiMatch.index + thaiMatch[0].length;
        const afterCompany = text.substring(companyEnd);
        const numberMatch = afterCompany.match(/\d+\/\d+/);
        if (numberMatch) {
            const splitPoint = companyEnd + numberMatch.index;
            console.log('🔍 Split point (Thai):', splitPoint, 'Company:', text.substring(0, splitPoint));
            return splitPoint;
        }
        console.log('🔍 Split point (Thai, no number):', companyEnd);
        return companyEnd;
    }

    // English company
    const engMatch = text.match(/[\w\s]+(?:Co\.,?\s*Ltd\.|Limited|Inc\.)/i);
    if (engMatch) {
        const companyEnd = engMatch.index + engMatch[0].length;
        const afterCompany = text.substring(companyEnd);
        const numberMatch = afterCompany.match(/\b\d+\/\d+\b/);
        if (numberMatch) {
            return companyEnd + numberMatch.index;
        }
        return companyEnd;
    }

    // Fallback
    const numberMatch = text.match(/\d+\/\d+/);
    const fallback = numberMatch ? numberMatch.index : text.length;
    console.log('🔍 Split point (fallback):', fallback);
    return fallback;
}

function extractAddressComponents(addressText) {
    console.log('🔍 extractAddressComponents input:', addressText);

    const components = {
        province: '',
        district: '',
        subdistrict: '',
        road: '',
        lane: '',
        villageno: '',
        number: '',
        village: ''
    };

    let working = addressText;

    const extract = (regex, field) => {
        const match = working.match(regex);
        if (match) {
            components[field] = (match[2] || match[1]).trim();
            working = working.replace(match[0], ' ').replace(/\s+/g, ' ').trim();
            console.log(`  ✓ ${field}: "${components[field]}" | Remaining: "${working}"`);
            return true;
        }
        return false;
    };

    // Province
    if (!extract(/(จังหวัด|จ\.|Province)\s+([^\s,]+)/i, 'province')) {
        if (working.match(/กรุงเทพ/i)) {
            components.province = 'กรุงเทพมหานคร';
            working = working.replace(/กรุงเทพ(มหานคร)?/gi, ' ');
        } else if (working.match(/Bangkok/i)) {
            components.province = 'Bangkok';
            working = working.replace(/Bangkok/gi, ' ');
        }
    }

    extract(/(อำเภอ|อ\.|เขต|District|Amphoe)\s+([^\s,]+)/i, 'district');
    extract(/(ตำบล|ต\.|แขวง|Tambon|Subdistrict)\s+([^\s,]+)/i, 'subdistrict');
    extract(/(ถนน|ถ\.|Road|Rd\.)\s+([^\s,]+)/i, 'road');
    extract(/(ซอย|ซ\.|Soi|S\.)\s+([^\s,]+(?:\s+\d+)?)/i, 'lane');
    extract(/(หมู่|ม\.|Moo|M\.)\s+(\d+)/i, 'villageno');

    // House number - CRITICAL
    console.log('  🔍 Looking for house number in:', working);
    const numMatch = working.match(/^(\d+\/\d+)/);
    if (numMatch) {
        components.number = numMatch[1];
        working = working.replace(numMatch[0], ' ').trim();
        console.log(`  ✓ number (start): "${components.number}" | Remaining: "${working}"`);
    } else {
        const extracted = extract(/(เลขที่|No\.)\s*(\d+\/\d+)/i, 'number');
        if (!extracted) {
            console.log('  ❌ House number NOT FOUND!');
        }
    }

    // Building/Village
    working = working.trim();
    if (working && working.length > 2 && !working.match(/^[\d\s,.-]+$/)) {
        working = working.replace(/^(อาคาร|หมู่บ้าน|Building)\s*/i, '');
        components.village = working.trim();
        console.log(`  ✓ village: "${components.village}"`);
    }

    console.log('🔍 Final components:', components);
    return components;
}

function extractContactInfo(text) {
    const contact = { name: '', position: '' };
    const nameMatch = text.match(/((?:K\.|คุณ|Mr\.|Ms\.|Mrs\.|Miss|นาย|นาง|น\.ส\.)\s*[^\s]+(?:\s+[^\s]+)?)/i);
    if (nameMatch) {
        contact.name = nameMatch[1].trim();
    }
    return contact;
}

export function parseUniversalAddress(inputText) {
    console.log('🚀 parseUniversalAddress input:', inputText);

    // Normalize
    let text = inputText
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // Extract tokens
    const { tokens, cleanedText } = extractGlobalTokens(text);

    // Split
    const splitIndex = findSplitPoint(cleanedText);
    const companyPart = cleanedText.substring(0, splitIndex).trim();
    const addressPart = cleanedText.substring(splitIndex).trim();

    console.log('🔍 Company part:', companyPart);
    console.log('🔍 Address part:', addressPart);

    // Extract components
    const addressComponents = extractAddressComponents(addressPart);

    // Contact
    const contactInfo = extractContactInfo(text);

    // Result
    const result = {
        company: companyPart.replace(/^(ที่อยู่|Address|ชื่อ|Name|:)+/i, '').trim(),
        taxid: tokens.taxid,
        branch: tokens.branch,
        number: addressComponents.number,
        villageno: addressComponents.villageno,
        village: addressComponents.village,
        lane: addressComponents.lane,
        road: addressComponents.road,
        subdistrict: addressComponents.subdistrict,
        district: addressComponents.district,
        province: addressComponents.province,
        zipcode: tokens.zipcode,
        label: companyPart || contactInfo.name,
        maps: tokens.maps,
        contactName: contactInfo.name,
        position: contactInfo.position,
        phone: tokens.phone,
        email: tokens.email,
        name: companyPart || contactInfo.name,
        line: '',
        fullLabel: [companyPart, contactInfo.name].filter(Boolean).join(' ')
    };

    console.log('✅ Final result:', result);
    return result;
}
