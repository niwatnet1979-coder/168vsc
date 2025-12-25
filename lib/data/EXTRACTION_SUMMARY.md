
# DataManager Extraction Summary

Due to the complexity and size of dataManager.js (4,444 lines), 
automated extraction requires careful manual review.

## Recommended Approach:

1. **Manual Extraction** (Safer):
   - Extract one module at a time
   - Test after each extraction
   - Verify all references

2. **Keep Current Structure** (Alternative):
   - Add JSDoc comments for better navigation
   - Use code folding in IDE
   - Create index/table of contents

## Module Breakdown:

### uploadManager.js (6 functions)
- uploadFile
- uploadSignature
- uploadProductImage
- uploadPaymentSlip
- uploadShopAsset
- uploadJobMedia

### employeeManager.js (3 functions)
- getEmployees
- saveEmployee
- deleteEmployee

### teamManager.js (12 functions)
- getTeams
- findOrCreateTeam
- saveTeam
- getTeamServiceFees
- getTeamServiceFeeById
- saveTeamServiceFee
- addServiceFeeAdjustment
- deleteServiceFeeAdjustment
- linkServiceFeeJobs
- unlinkServiceFeeJob
- addServiceFeePayment
- getTeamOutstanding

### qcManager.js (3 functions)
- getQCQueue
- saveQCRecord
- getQCRecords

### inventoryManager.js (13 functions)
- receivePurchaseOrder
- getItemTrackingHistory
- logTrackingEvent
- getLowStockItems
- getInventoryItems
- addInventoryItem
- updateInventoryItem
- logInventoryAction
- getPurchaseOrders
- createPurchaseOrderWithItems
- deletePurchaseOrder
- getPurchaseOrderById
- updatePurchaseOrderCosts

### productManager.js (4 functions)
- getProducts
- saveProduct
- deleteProduct
- getProductOptions

### customerManager.js (5 functions)
- getCustomers
- getCustomerById
- saveCustomer
- deleteCustomer
- updateCustomerAddress

### orderManager.js (18 functions)
- getNextOrderId
- getOrders
- getOrdersByCustomerId
- getOrderById
- saveOrder
- deleteOrder
- getNextOrderNumber
- getJobs
- getJobById
- updateJob
- getNextJobId
- saveJob
- getJobsRaw
- getJobCompletion
- saveJobCompletion
- _generateDocumentId
- getSettings
- saveSettings
