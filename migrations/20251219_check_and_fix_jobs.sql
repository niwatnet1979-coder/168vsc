-- 1. ตรวจสอบโครงสร้าง (Check Structure)
-- order_id ควรเป็น 'text' 
-- order_item_id ควรเป็น 'uuid'
SELECT column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_name = 'jobs'
    AND column_name IN ('order_id', 'order_item_id');
-- 2. ตรวจสอบข้อมูลซ้ำ (Check Duplicates)
-- ถ้า count > 0 แสดงว่ามีการรัน Insert ซ้ำ
SELECT order_item_id,
    COUNT(*)
FROM jobs
GROUP BY order_item_id
HAVING COUNT(*) > 1;
-- 3. ล้างและลงข้อมูลใหม่ (RESET Data)
-- รันชุดนี้เพื่อล้างข้อมูลเก่าและดึงจาก order_items ใหม่ให้ถูกต้อง 100%
TRUNCATE TABLE jobs;
INSERT INTO jobs (
        order_item_id,
        order_id,
        job_type,
        status,
        assigned_team,
        appointment_date,
        completion_date,
        site_inspector_id,
        site_address_id,
        notes
    )
SELECT id,
    order_id,
    COALESCE(job_type, 'installation'),
    COALESCE(status, 'รอดำเนินการ'),
    assigned_team,
    appointment_date,
    completion_date,
    site_inspector_id,
    site_address_id,
    job_notes
FROM order_items
WHERE order_id IS NOT NULL;