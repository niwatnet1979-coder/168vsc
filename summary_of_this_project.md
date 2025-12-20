# 168VSC - Complete Project Summary

## 📋 Project Overview

**168VSC** is a comprehensive Enterprise Resource Planning (ERP) system built for **168 Interior Lighting Store**. It's a full-stack web application that manages the entire business workflow from sales orders, inventory management, job scheduling, customer relations, finance, purchasing, and quality control.

**Version:** 6.0.0  
**Framework:** Next.js 13.4.10 (React 18.2.0)  
**Backend:** Supabase (PostgreSQL)  
**Authentication:** NextAuth.js with Google OAuth  
**Styling:** Tailwind CSS 3.4.3

---

## 🏗️ Technology Stack

### Frontend
- **Next.js 13.4.10** - React framework with SSR/SSG support
- **React 18.2.0** - UI library
- **Tailwind CSS 3.4.3** - Utility-first CSS framework
- **Lucide React** - Icon library
- **html5-qrcode** - QR code scanning functionality
- **qrcode.react** - QR code generation
- **react-signature-canvas** - Digital signature capture
- **xlsx** - Excel file import/export

### Backend & Database
- **Supabase** - Backend-as-a-Service (PostgreSQL database, real-time subscriptions, storage)
- **NextAuth.js 4.24.13** - Authentication system
- **PostgreSQL** - Relational database (via Supabase)

### Development Tools
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing
- **dotenv** - Environment variable management

---

## 📁 Complete Directory Structure

```
168vsc/
├── BIN/                          # Legacy scripts, debug files, and utilities
│   ├── legacy_mobile_jobs/       # Old mobile job pages
│   ├── *.js                      # Debug and test scripts
│   ├── *.sql                     # Database utility scripts
│   ├── *.json                    # Data files
│   └── *.log                     # Build and server logs
│
├── BIN20251220/                  # Archived scripts from Dec 2025
│   ├── lib/                      # Mock data and seeders
│   ├── pages/                    # Utility pages
│   └── scripts/                  # Migration and data processing scripts
│
├── components/                   # React components (35 files)
│   ├── AddressCard.jsx          # Customer address display
│   ├── AddressSelector.jsx      # Address selection UI
│   ├── AppLayout.jsx            # Main application layout wrapper
│   ├── AuthButton.js            # Login/logout button
│   ├── Card.jsx                 # Reusable card component
│   ├── ContactDisplayCard.jsx   # Contact information display
│   ├── ContactSelector.jsx      # Contact selection UI
│   ├── CustomerInfoCard.jsx     # Customer details card
│   ├── CustomerModal.jsx        # Customer create/edit modal
│   ├── DataSourceTooltip.jsx    # Data source indicator
│   ├── InventoryCheckInModal.jsx # Inventory check-in interface
│   ├── InventoryCheckOutModal.jsx # Inventory check-out interface
│   ├── JobCompletionView.jsx    # Job completion interface
│   ├── JobInfoCard.jsx          # Job information display
│   ├── JobInspectorView.jsx     # Job inspection view
│   ├── JobListModal.jsx         # Job list modal
│   ├── LeaveApprovalModal.jsx   # Leave request approval
│   ├── LeaveBookingModal.jsx    # Leave request booking
│   ├── Order.jsx                # Main order form component (2352 lines)
│   ├── OrderItemModal.jsx       # Order item edit modal
│   ├── PaymentEntryModal.jsx     # Payment entry interface
│   ├── PaymentSummaryCard.jsx   # Payment summary display
│   ├── ProductCard.jsx          # Product display card
│   ├── ProductDetailView.jsx    # Product detail view
│   ├── ProductModal.jsx         # Product create/edit modal
│   ├── ProtectedRoute.js        # Route protection wrapper
│   ├── PurchaseOrderModal.jsx   # Purchase order interface
│   ├── QCInspectionModal.jsx    # Quality control inspection
│   ├── QRDisplayModal.jsx       # QR code display modal
│   ├── QRScanner.jsx            # QR code scanner component
│   ├── Quotation.jsx            # Quotation document component
│   ├── StockCheckModal.jsx      # Stock checking interface
│   ├── SubJobModal.jsx         # Sub-job creation modal
│   ├── TaxAddressParserModal.jsx # Tax address parsing
│   ├── TeamMemberModal.jsx      # Team member management
│   ├── TrackingTimeline.jsx     # Item tracking timeline
│   ├── VariantManager.jsx       # Product variant manager
│   └── VideoRecorderModal.jsx   # Video recording interface
│
├── contexts/                     # React Context providers
│   ├── DebugContext.js          # Debug mode context
│   └── LanguageContext.js       # Multi-language support context
│
├── docs/                         # Documentation
│   └── FUNCTIONAL_STRUCTURE.md  # Functional structure documentation
│
├── hooks/                        # Custom React hooks
│   ├── useJobs.js               # Jobs data hook with real-time
│   └── useRealtime.js           # Real-time subscription hook
│
├── lib/                          # Core libraries
│   ├── dataManager.js           # Data access layer (3500+ lines)
│   ├── supabaseClient.js        # Supabase client initialization
│   └── utils.js                 # Utility functions
│
├── migrations/                   # Database migrations (64 files)
│   ├── phase1_*.sql             # Phase 1 migrations
│   ├── phase2_*.sql             # Phase 2 migrations (customer relations)
│   ├── phase3_*.sql             # Phase 3 migrations
│   ├── phase4_*.sql             # Phase 4 migrations (payments)
│   ├── 20251217_*.sql           # December 2025 migrations
│   ├── 20251218_*.sql           # December 2025 migrations
│   ├── 20251219_*.sql           # December 2025 migrations
│   └── *.sql                    # Various schema updates
│
├── out/                          # Static export output (production build)
│   ├── _next/                   # Next.js static assets
│   ├── *.html                   # Static HTML pages
│   └── [pages]/                 # Exported page directories
│
├── pages/                        # Next.js pages (routes)
│   ├── _app.js                  # App wrapper with providers
│   ├── api/                     # API routes
│   │   ├── auth/
│   │   │   └── [...nextauth].js # NextAuth configuration
│   │   └── resolve-map-link.js  # Google Maps link resolver
│   ├── auth/                    # Authentication pages
│   │   ├── signin.js            # Sign-in page
│   │   └── error.js             # Auth error page
│   ├── customers/               # Customer pages
│   │   └── [id].js              # Individual customer page
│   ├── mobile/                  # Mobile-optimized pages
│   │   ├── index.js             # Mobile home
│   │   └── [id].js              # Mobile job detail
│   ├── products/                # Product pages
│   │   └── [id].js              # Individual product page
│   ├── purchasing/              # Purchasing pages
│   │   └── [id].js              # Purchase order detail
│   ├── customers.js             # Customer list page
│   ├── finance.js               # Finance/payments page
│   ├── index.js                 # Dashboard/homepage
│   ├── inventory.js             # Inventory management page
│   ├── job.js                   # Individual job page
│   ├── jobs.js                  # Job queue/list page
│   ├── order.js                 # Order entry page
│   ├── orders.js                # Order list page
│   ├── products.js              # Product management page
│   ├── purchasing.js            # Purchase order list
│   ├── qc.js                    # Quality control page
│   ├── quotation.js             # Quotation page
│   ├── reports.js               # Reports page
│   ├── settings.js              # Settings page
│   ├── shipping.js              # Shipping page
│   └── team.js                  # Team management page
│
├── public/                       # Static assets
│   ├── favicon.ico              # Site favicon
│   ├── logo-*.png               # Logo images
│   └── *.svg                    # SVG assets
│
├── styles/                       # Global styles
│   └── globals.css              # Global CSS with Tailwind
│
├── 168vsc.code-workspace        # VS Code workspace config
├── next.config.js               # Next.js configuration
├── package.json                 # NPM dependencies and scripts
├── package-lock.json            # NPM lock file
├── postcss.config.js            # PostCSS configuration
├── README.md                    # Project README
├── SETUP.md                     # Setup instructions
├── summary_of_this_project.md   # This file
├── tailwind.config.js           # Tailwind CSS configuration
└── test_tax_schema.js           # Tax schema test script
```

---

## 🎯 Core Features & Modules

### 1. **Dashboard** (`pages/index.js`)
- Real-time statistics: Today's revenue, pending orders, pending jobs, low stock alerts
- Recent orders table
- Quick navigation to all modules
- Responsive design with mobile support

### 2. **Order Management** (`pages/order.js`, `pages/orders.js`)
- **Order Entry** (`components/Order.jsx` - 2352 lines):
  - Customer information management
  - Tax invoice details with address parsing
  - Product selection with search and auto-fill
  - Multiple order items with variants
  - Master job configuration (installation/delivery)
  - Per-item job configuration
  - Distance calculation from shop to delivery location
  - Discount and VAT calculation
  - Deposit management
  - Shipping fee calculation
  - Digital signature capture
  - Image upload for products
  - Saved addresses and tax profiles
- **Order List**: View, filter, and search all orders
- **Order Detail**: Individual order view with full details

### 3. **Product Management** (`pages/products.js`)
- Product catalog with search and filtering
- Product variants management (dimensions, colors, materials)
- Smart SKU generator (format: `CODE-COLOR-L-W-H`)
- Excel export functionality
- Product images management
- Stock tracking
- Category and subcategory organization
- Table and grid view modes

### 4. **Customer Management** (`pages/customers.js`, `pages/customers/[id].js`)
- Customer database with contact information
- Multiple contacts per customer
- Multiple addresses per customer (with detailed Thai address fields)
- Tax invoice profiles
- Customer history (orders, jobs)
- Search and filter capabilities

### 5. **Job Management** (`pages/jobs.js`, `pages/job.js`)
- Job queue for installation and delivery
- Job status tracking: รอดำเนินการ (Pending), กำลังดำเนินการ (Processing), เสร็จสิ้น (Completed), ยกเลิก (Cancelled)
- Team assignment
- Appointment scheduling
- Google Maps integration
- Distance calculation
- Job completion with photos and signatures
- Mobile-optimized job views (`pages/mobile/`)
- 1:N relationship (one order item can have multiple jobs)

### 6. **Inventory Management** (`pages/inventory.js`)
- QR code-based inventory tracking
- Check-in/Check-out operations
- Item tracking timeline
- Location management
- Stock checking
- Inventory logs
- Real-time inventory status

### 7. **Quality Control** (`pages/qc.js`)
- QC inspection queue
- Item inspection interface
- Pass/fail tracking
- Defect recording
- Photo documentation

### 8. **Purchasing** (`pages/purchasing.js`)
- Purchase order creation
- Supplier management
- Low stock suggestions
- PO receiving (converts to inventory)
- PO status tracking

### 9. **Finance** (`pages/finance.js`)
- Payment tracking
- Deposit management
- Outstanding balance calculation
- Payment history
- Invoice generation
- Financial reports

### 10. **Quotation** (`pages/quotation.js`)
- Professional quotation generation
- Legal/company information
- Customer details
- Itemized pricing
- VAT calculation
- Terms and conditions
- Print/PDF export

### 11. **Team Management** (`pages/team.js`)
- Employee database
- Role assignment (Admin, QC, Technician)
- Team organization
- Leave management (booking and approval)
- Employee profiles

### 12. **Reports** (`pages/reports.js`)
- Sales reports
- Revenue statistics
- Order analytics
- Performance metrics

### 13. **Settings** (`pages/settings.js`)
- System configuration
- User preferences
- Language settings

### 14. **Shipping** (`pages/shipping.js`)
- Shipping management
- Delivery tracking

---

## 🗄️ Database Schema (Supabase/PostgreSQL)

### Core Tables

#### **customers**
- Main customer table with basic contact info
- Fields: `id`, `name`, `phone`, `email`, `line_id`, `facebook`, `instagram`, `media_source`

#### **customer_contacts**
- Multiple contacts per customer (1:N)
- Fields: `id` (UUID), `customer_id`, `name`, `phone`, `line_id`

#### **customer_addresses**
- Multiple addresses per customer (1:N)
- Detailed Thai address fields: `house_number`, `village_no`, `building`, `soi`, `road`, `subdistrict`, `district`, `province`, `postcode`
- Fields: `id` (UUID), `customer_id`, `label`, `address`, `google_map_link`

#### **customer_tax_invoices**
- Tax invoice profiles per customer (1:N)
- Fields: `id` (UUID), `customer_id`, `company_name`, `tax_id`, `address_id`, `branch_number`, `branch_name`

#### **orders**
- Main order table
- Fields: `id` (TEXT), `customer_id`, `order_date`, `status`, `total`, `discount` (JSONB), `vat_rate`, `deposit`, `shipping_fee`
- Foreign keys: `selected_contact_id`, `delivery_address_id`, `tax_invoice_id`
- Legacy JSONB fields for backward compatibility

#### **order_items**
- Order line items (1:N with orders)
- Fields: `id` (UUID), `order_id`, `product_id`, `quantity`, `unit_price`, `subtotal`, `variant_id`
- Job information stored per item

#### **jobs**
- Installation/delivery jobs (1:N with order_items)
- Fields: `id` (TEXT), `order_id`, `order_item_id`, `job_type`, `appointment_date`, `address`, `google_map_link`, `distance`, `assigned_team`, `status`, `completion_date`, `notes`

#### **products**
- Product catalog
- Fields: `id` (UUID), `product_code`, `category`, `subcategory`, `name`, `description`, `material`, `color`, `base_price`, `stock`, `images`

#### **product_variants**
- Product variants (dimensions, colors, etc.)
- Fields: `id` (UUID), `product_id`, `length`, `width`, `height`, `color`, `crystal_color`, `bulb_type`, `light`, `remote`, `price_adjustment`

#### **inventory_items**
- Individual inventory items with QR codes
- Fields: `id` (UUID), `product_id`, `qr_code`, `status`, `current_location`, `lot_number`

#### **inventory_logs**
- Inventory transaction history
- Fields: `id`, `inventory_item_id`, `action`, `quantity_change`, `reason`, `created_by`

#### **item_tracking**
- Supply chain tracking
- Fields: `id`, `inventory_item_id`, `step_status`, `location_name`, `notes`, `recorded_at`

#### **purchase_orders**
- Purchase orders from suppliers
- Fields: `id` (UUID), `supplier`, `order_date`, `status`, `items` (JSONB)

#### **order_payments**
- Payment records
- Fields: `id` (UUID), `order_id`, `amount`, `payment_method`, `payment_date`, `notes`, `signature`, `image`

#### **leave_requests**
- Employee leave management
- Fields: `id`, `user_id`, `start_date`, `end_date`, `type`, `status`, `reason`

#### **team_members**
- Employee database
- Fields: `eid`, `nickname`, `firstname`, `lastname`, `team`, `teamType`, `job`, `level`, `userType`, `email`, `phone1`, `phone2`, `address`, `photo`

### Key Relationships
- **customers** → **customer_contacts** (1:N, CASCADE DELETE)
- **customers** → **customer_addresses** (1:N, CASCADE DELETE)
- **customers** → **customer_tax_invoices** (1:N, CASCADE DELETE)
- **orders** → **order_items** (1:N)
- **order_items** → **jobs** (1:N)
- **products** → **product_variants** (1:N)
- **products** → **inventory_items** (1:N)

### Security
- Row Level Security (RLS) policies enabled
- Foreign key constraints with CASCADE DELETE where appropriate
- SET NULL on delete for optional relationships

---

## 🔐 Authentication & Authorization

### Authentication System
- **NextAuth.js** with Google OAuth provider
- Session management via JWT
- Protected routes using `ProtectedRoute` component

### Role-Based Access Control
- **Admin** - Full system access
- **QC** - Quality control access
- **Technician (ช่าง)** - Field worker access
- Role assignment based on email patterns (configurable in `pages/api/auth/[...nextauth].js`)

### Protected Routes
- Routes wrapped with `ProtectedRoute` component
- Role-based access control per page
- Session persistence across page navigation

---

## 📱 Mobile Support

### Mobile-Optimized Pages
- `pages/mobile/index.js` - Mobile dashboard
- `pages/mobile/[id].js` - Mobile job detail view
- Responsive design throughout
- Touch-optimized interfaces
- QR code scanning for mobile devices

---

## 🔧 Key Components

### **Order.jsx** (2352 lines)
The most complex component, handling:
- Complete order entry workflow
- Customer and tax invoice management
- Product selection with variants
- Job configuration (master and per-item)
- Financial calculations
- Image and signature capture
- Address parsing and Google Maps integration

### **DataManager** (`lib/dataManager.js` - 3500+ lines)
Central data access layer providing:
- CRUD operations for all entities
- Data transformation (snake_case ↔ camelCase)
- Order status calculation
- Real-time subscriptions
- Batch operations
- Complex queries with joins

### **AppLayout.jsx**
Main application wrapper providing:
- Sidebar navigation
- Header with user info
- Responsive layout
- Mobile menu

---

## 🚀 Development Setup

### Prerequisites
- Node.js (v14+)
- npm or yarn
- Supabase account
- Google OAuth credentials

### Installation
```bash
cd /Users/seng/PROJECT/168vsc
npm install
```

### Environment Variables
Create `.env.local`:
```env
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3001
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Running Development Server
```bash
npm run dev
# Server runs on http://localhost:3001
```

### Building for Production
```bash
npm run build
npm start
```

---

## 📊 Data Flow

1. **Order Creation Flow**:
   - User creates order → `Order.jsx` component
   - Data saved to Supabase via `DataManager`
   - Order items created in `order_items` table
   - Jobs created in `jobs` table (if applicable)
   - Real-time updates via Supabase subscriptions

2. **Inventory Flow**:
   - Purchase order received → Creates `inventory_items` with QR codes
   - Check-in → Updates status and location
   - QC inspection → Updates QC status
   - Check-out → Assigns to order/job
   - Tracking → Records in `item_tracking` table

3. **Job Flow**:
   - Order created with job info → Jobs created
   - Team assigned → Job status updated
   - Job completed → Photos, signature, completion date recorded
   - Status propagated to order status

---

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach, works on all screen sizes
- **Thai Language Support**: Primary language with multi-language context
- **Real-time Updates**: Supabase real-time subscriptions for live data
- **QR Code Integration**: Scanning and generation throughout
- **Image Upload**: Product images, payment receipts, job photos
- **Signature Capture**: Digital signatures for payments and job completion
- **Google Maps Integration**: Address parsing and distance calculation
- **Excel Export**: Product catalog and data export
- **Print/PDF**: Quotation and document printing

---

## 🔄 Migration History

The project has undergone significant schema evolution:
- **Phase 1**: Initial orders and products
- **Phase 2**: Customer relations (contacts, addresses, tax invoices)
- **Phase 3**: Cleanup and optimization
- **Phase 4**: Payments system
- **December 2025**: Major refactoring (jobs 1:N, RLS fixes, real-time improvements)

64 migration files document the complete evolution of the database schema.

---

## 🧪 Testing & Debugging

### Debug Scripts (in `BIN/` directory)
- `debug_*.js` - Various debugging utilities
- `test_*.js` - Test scripts for specific features
- `check_*.js` - Data validation scripts

### Utility Scripts (in `BIN20251220/scripts/`)
- Migration scripts
- Data conversion scripts
- Schema inspection tools
- QA testing scripts

---

## 📝 Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `components/Order.jsx` | Main order entry form | 2352 |
| `lib/dataManager.js` | Data access layer | 3500+ |
| `pages/index.js` | Dashboard | 313 |
| `pages/order.js` | Order entry page | 10 |
| `pages/products.js` | Product management | 809 |
| `pages/jobs.js` | Job queue | 430 |
| `pages/customers.js` | Customer list | ~300 |
| `pages/finance.js` | Finance page | 378 |
| `pages/inventory.js` | Inventory management | 337 |
| `pages/purchasing.js` | Purchase orders | 352 |
| `pages/qc.js` | Quality control | 181 |
| `pages/team.js` | Team management | 295 |

---

## 🌟 Notable Features

1. **Smart SKU Generator**: Auto-generates product codes in format `CODE-COLOR-L-W-H`
2. **Distance Calculation**: Haversine formula for shop-to-delivery distance
3. **Address Parsing**: Thai address parsing with structured fields
4. **Real-time Sync**: Live updates across all clients
5. **QR Code Tracking**: Full inventory traceability
6. **Multi-job Support**: One order item can have multiple installation jobs
7. **Tax Invoice Management**: Separate tax profiles with address linking
8. **Payment Tracking**: Multiple payment methods with signatures and images
9. **Job Timeline**: Complete tracking of item movement through supply chain
10. **Mobile-First**: Optimized for field workers on mobile devices

---

## 🔮 Architecture Patterns

- **Component-Based**: React components with clear separation of concerns
- **Data Access Layer**: Centralized `DataManager` for all database operations
- **Context API**: Global state for debug mode and language
- **Custom Hooks**: Reusable logic (`useJobs`, `useRealtime`)
- **Protected Routes**: Role-based access control
- **Real-time Subscriptions**: Supabase real-time for live updates
- **Migration-Based Schema**: Version-controlled database changes

---

## 📚 Additional Resources

- **README.md**: Quick start guide
- **SETUP.md**: Detailed setup instructions
- **docs/FUNCTIONAL_STRUCTURE.md**: Functional structure documentation
- **migrations/**: Complete database evolution history

---

## 🎯 Project Status

**Active Development** - Version 6.0.0

The system is in active use and development, with continuous improvements to:
- Database schema optimization
- Real-time functionality
- Mobile experience
- User interface
- Feature additions

---

*Last Updated: Based on project structure as of December 2025*

