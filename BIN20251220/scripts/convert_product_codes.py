#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Product Code Converter - Smart Generator Format
แปลงรหัสสินค้าทั้งหมดให้เป็นรูปแบบ Smart Generator
"""

import json
import re
from typing import Dict, List, Optional

# ตารางแปลงประเภทสินค้า (Category Mapping)
CATEGORY_MAP = {
    "โคมไฟระย้า": "AA",
    "โคมไฟติดผนัง": "WL",
    "โคมไฟตั้งโต๊ะ": "TL",
    "โคมไฟตั้งพื้น": "FL",
    "โคมไฟเพดาน": "CL",
    "โคมไฟห้อย": "PL",
    "อื่นๆ": "OT",
}

# ตารางแปลงสี (Color Mapping)
COLOR_MAP = {
    "ทอง": "GLD",
    "เงิน": "SLV",
    "ดำ": "BLK",
    "ขาว": "WHT",
    "เทา": "GRY",
    "น้ำตาล": "BRN",
    "ชมพู": "PNK",
    "เขียว": "GRN",
    "น้ำเงิน": "BLU",
    "แดง": "RED",
    "ครีม": "CRM",
    "โครเมี่ยม": "CHR",
    "ทองแดง": "CPR",
    "โรสโกลด์": "RGD",
    "แชมเปญ": "CHP",
}

def get_category_code(category: str) -> str:
    """แปลงชื่อประเภทเป็นรหัส"""
    return CATEGORY_MAP.get(category, "OT")

def get_color_code(color: str) -> str:
    """แปลงชื่อสีเป็นรหัส"""
    if not color:
        return "XXX"
    
    # ถ้ามีหลายสี ใช้สีแรก
    first_color = color.split(",")[0].strip()
    
    # ลองหาในตาราง
    for thai_color, code in COLOR_MAP.items():
        if thai_color in first_color:
            return code
    
    # ถ้าไม่เจอ ใช้ 3 ตัวอักษรแรก
    return first_color[:3].upper()

def clean_dimension(value: str) -> str:
    """ทำความสะอาดค่าขนาด (ยาว/กว้าง/สูง)"""
    if not value or value == "":
        return "00"
    
    # ลบตัวอักษรและเครื่องหมายที่ไม่ใช่ตัวเลข
    cleaned = re.sub(r'[^0-9.]', '', str(value))
    
    if not cleaned:
        return "00"
    
    # แปลงเป็นตัวเลข
    try:
        num = int(float(cleaned))
        return str(num).zfill(2)  # เติม 0 ข้างหน้าถ้าเป็นเลขหลักเดียว
    except:
        return "00"

def generate_smart_code(product: Dict) -> str:
    """สร้างรหัสสินค้าแบบ Smart Generator"""
    
    # ดึงข้อมูล
    category = product.get("category", "")
    length = product.get("length", "")
    width = product.get("width", "")
    height = product.get("height", "")
    color = product.get("color", "")
    base_code = product.get("baseCode", "")
    
    # แปลงเป็นรหัส
    cat_code = get_category_code(category)
    color_code = get_color_code(color)
    l_code = clean_dimension(length)
    w_code = clean_dimension(width)
    h_code = clean_dimension(height)
    
    # สร้างรหัสใหม่: {ประเภท}{เลขรุ่น}-{สี}-{ยาว}-{กว้าง}-{สูง}
    # ใช้ baseCode เป็นเลขรุ่น (เอาตัวเลขออกมา)
    model_num = re.sub(r'[^0-9]', '', base_code) if base_code else "000"
    
    new_code = f"{cat_code}{model_num}-{color_code}-{l_code}-{w_code}-{h_code}"
    
    return new_code

def convert_products(input_file: str, output_file: str, report_file: str):
    """แปลงรหัสสินค้าทั้งหมด"""
    
    print(f"🔄 กำลังอ่านข้อมูลจาก {input_file}...")
    
    # อ่านข้อมูล
    with open(input_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    print(f"📦 พบสินค้าทั้งหมด {len(products)} รายการ")
    
    # แปลงรหัส
    converted_products = []
    conversion_report = []
    
    for i, product in enumerate(products, 1):
        old_id = product.get("id", "")
        new_id = generate_smart_code(product)
        
        # อัปเดตรหัส
        product["oldId"] = old_id
        product["id"] = new_id
        
        converted_products.append(product)
        
        # บันทึกรายงาน
        conversion_report.append({
            "no": i,
            "oldId": old_id,
            "newId": new_id,
            "category": product.get("category", ""),
            "color": product.get("color", ""),
            "dimensions": f"{product.get('length', '')}x{product.get('width', '')}x{product.get('height', '')}",
        })
        
        if i % 50 == 0:
            print(f"  ✓ แปลงแล้ว {i}/{len(products)} รายการ...")
    
    # บันทึกข้อมูลใหม่
    print(f"\n💾 กำลังบันทึกข้อมูลใหม่ไปที่ {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(converted_products, f, ensure_ascii=False, indent=2)
    
    # บันทึกรายงาน
    print(f"📊 กำลังสร้างรายงานการแปลง {report_file}...")
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(conversion_report, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ เสร็จสิ้น! แปลงรหัสสินค้าทั้งหมด {len(products)} รายการ")
    print(f"\n📁 ไฟล์ที่สร้าง:")
    print(f"  - ข้อมูลสินค้าใหม่: {output_file}")
    print(f"  - รายงานการแปลง: {report_file}")
    
    # แสดงตัวอย่าง
    print(f"\n📋 ตัวอย่างการแปลง (5 รายการแรก):")
    print(f"{'No.':<5} {'รหัสเดิม':<20} {'รหัสใหม่':<30} {'ประเภท':<15}")
    print("-" * 80)
    for item in conversion_report[:5]:
        print(f"{item['no']:<5} {item['oldId']:<20} {item['newId']:<30} {item['category']:<15}")

if __name__ == "__main__":
    INPUT_FILE = "products_data_v2.json"
    OUTPUT_FILE = "products_data_v3.json"
    REPORT_FILE = "conversion_report.json"
    
    convert_products(INPUT_FILE, OUTPUT_FILE, REPORT_FILE)
