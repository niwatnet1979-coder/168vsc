#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
สร้างรายงาน CSV จากการแปลงรหัสสินค้า
"""

import json
import csv

def create_csv_report(json_file: str, csv_file: str):
    """สร้างรายงาน CSV"""
    
    # อ่านข้อมูล JSON
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # สร้าง CSV
    with open(csv_file, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        
        # Header
        writer.writerow([
            'ลำดับ',
            'รหัสเดิม',
            'รหัสใหม่',
            'ประเภท',
            'สี',
            'ยาว',
            'กว้าง',
            'สูง',
            'ราคา'
        ])
        
        # Data
        for item in data:
            dimensions = item.get('dimensions', 'xx').split('x')
            length = dimensions[0] if len(dimensions) > 0 else ''
            width = dimensions[1] if len(dimensions) > 1 else ''
            height = dimensions[2] if len(dimensions) > 2 else ''
            
            writer.writerow([
                item.get('no', ''),
                item.get('oldId', ''),
                item.get('newId', ''),
                item.get('category', ''),
                item.get('color', ''),
                length,
                width,
                height,
                ''  # ราคาจะต้องดึงจาก products_data_v3.json
            ])
    
    print(f"✅ สร้างรายงาน CSV เรียบร้อย: {csv_file}")

if __name__ == "__main__":
    create_csv_report("conversion_report.json", "conversion_report.csv")
