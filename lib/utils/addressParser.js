/**
 * Universal Address Parser - Version 3.2
 * Fixed split point to skip branch text
 */

const PARSER_VERSION = '3.2';

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

    return { tokens, cleanedText };
}

/**
 * FIXED: Find split point - split right after "จำกัด" and skip any spaces/numbers
 */
function findSplitPoint(text) {
    // Thai: "บริษัท ... จำกัด" - split right after จำกัด
    const thaiMatch = text.match(/บริษัท\s+.+?\s+จำกัด/i);
    if (thaiMatch) {
        let splitPoint = thaiMatch.index + thaiMatch[0].length;
        // Skip spaces, numbers, slashes, and "สาขา" text
        const afterCompany = text.substring(splitPoint);
        const skipMatch = afterCompany.match(/^[\s\/\d]*(สาขา[\s\/\d]*)?/i);
        if (skipMatch) {
            splitPoint += skipMatch[0].length;
        }
        console.log('🔍 Split at:', splitPoint, '| Company:', text.substring(0, thaiMatch.index + thaiMatch[0].length).trim());
        console.log('🔍 Skipped:', text.substring(thaiMatch.index + thaiMatch[0].length, splitPoint));
        return splitPoint;
    }

    // English
    const engMatch = text.match(/[\w\s]+(?:Co\.,?\s*Ltd\.|Limited|Inc\.)/i);
    if (engMatch) {
        return engMatch.index + engMatch[0].length;
    }

    // Fallback
    const numberMatch = text.match(/\d+\/\d+/);
    return numberMatch ? numberMatch.index : text.length;
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

    let working = addressText.trim();

    const extract = (regex, field) => {
        console.log(`  Trying ${field} with regex:`, regex);
        console.log(`  Working text:`, working);
        const match = working.match(regex);
        console.log(`  Match result:`, match);
        if (match) {
            components[field] = (match[2] || match[1]).trim();
            working = working.replace(match[0], ' ').replace(/\s+/g, ' ').trim();
            console.log(`  ✓ ${field} = "${components[field]}" | Remaining: "${working}"`);
            return true;
        }
        console.log(`  ✗ ${field} not found`);
        return false;
    };

    // 1. Province - NO LOOKAHEAD
    if (!extract(/(จังหวัด|จ\.|Province)\s+([^\s]+)/i, 'province')) {
        if (working.match(/กรุงเทพ/i)) {
            components.province = 'กรุงเทพมหานคร';
            working = working.replace(/กรุงเทพ(มหานคร)?/gi, ' ');
        } else if (working.match(/Bangkok/i)) {
            components.province = 'Bangkok';
            working = working.replace(/Bangkok/gi, ' ');
        }
    }

    // 2. District
    extract(/(อำเภอ|อ\.|เขต|District|Amphoe)\s+([^\s]+)/i, 'district');

    // 3. Subdistrict
    extract(/(ตำบล|ต\.|แขวง|Tambon|Subdistrict)\s+([^\s]+)/i, 'subdistrict');

    // 4. Road
    extract(/(ถนน|ถ\.|Road|Rd\.)\s+([^\s]+)/i, 'road');

    // 5. Soi/Lane - allow spaces and numbers
    extract(/(ซอย|ซ\.|Soi|S\.)\s+([^\s]+(?:\s+\d+)?)/i, 'lane');

    // 6. Moo
    extract(/(หมู่|ม\.|Moo|M\.)\s+(\d+)/i, 'villageno');

    // 7. House number
    let numMatch = working.match(/^(\d+\/\d+)/);
    if (numMatch) {
        components.number = numMatch[1];
        working = working.replace(numMatch[0], ' ').trim();
    } else {
        numMatch = working.match(/(เลขที่|No\.)\s*(\d+\/\d+)/i);
        if (numMatch) {
            components.number = numMatch[2];
            working = working.replace(numMatch[0], ' ').trim();
        } else {
            numMatch = working.match(/(\d+\/\d+)/);
            if (numMatch) {
                components.number = numMatch[1];
                working = working.replace(numMatch[0], ' ').trim();
            }
        }
    }

    // 8. Building/Village
    working = working.trim();
    if (working && working.length > 2 && !working.match(/^[\d\s,.-]+$/)) {
        working = working.replace(/^(อาคาร|หมู่บ้าน|Building)\s*/i, '');
        components.village = working.trim();
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
    console.log(`🚀 Parser v${PARSER_VERSION} | INPUT:`, inputText);

    let text = inputText
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const { tokens, cleanedText } = extractGlobalTokens(text);
    console.log('🔍 After tokens:', cleanedText);
    console.log('🔍 Tokens:', tokens);

    const splitIndex = findSplitPoint(cleanedText);
    const companyPart = cleanedText.substring(0, splitIndex).trim();
    const addressPart = cleanedText.substring(splitIndex).trim();

    console.log('🔍 Company:', companyPart);
    console.log('🔍 Address:', addressPart);

    const addressComponents = extractAddressComponents(addressPart);

    const contactInfo = extractContactInfo(text);

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

    console.log('✅ RESULT:', result);
    return result;
}
