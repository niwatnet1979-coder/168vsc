const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
  const { data, error } = await supabase.from('purchase_orders').select('id, payer_name, is_reimbursed, reimbursed_date').eq('is_reimbursed', true);
  console.log('Reimbursed Items:', data);
  if(error) console.error(error);
  const { data: pending } = await supabase.from('purchase_orders').select('id, payer_name, is_reimbursed').eq('is_reimbursed', false).neq('payer_name', null);
  console.log('Pending Items:', pending);
})();
