# Functional Structure Documentation

## Overview
The **Order Form** application allows users to create purchase orders with detailed customer, tax, and job information. It supports adding multiple items with specific attributes, calculating totals with discounts and VAT, and managing job details either globally (Master Job) or individually per item.

## Key Components

### `components/OrderForm.jsx`
The core component that renders the entire order entry interface. It manages all state related to the order.

## Data Structures (State)

### 1. Customer (`customer`)
Stores general customer contact information.
- `name`: Customer or Company Name
- `phone`: Phone Number
- `email`: Email or LINE ID
- `contact1`, `contact2`: Objects containing `name` and `phone` for additional contacts.

### 2. Tax Invoice (`taxInvoice`)
Stores billing details, separate from the customer contact info.
- `companyName`: Company Name for tax invoice
- `branch`: Branch (e.g., Head Office)
- `taxId`: Tax Identification Number (13 digits)
- `address`: Billing Address
- `phone`, `email`: Contact for billing
- `deliveryAddress`: Address to send the tax invoice to (if different)

### 3. Master Job (`jobInfo`)
Stores the main job details that apply to the order.
- `jobType`: 
  - `'installation'`: Installation Job
  - `'delivery'`: Delivery Job
  - `'separate_job'`: Separate Job (allows per-item configuration)
- `orderDate`: Date of the order (YYYY-MM-DD)
- `appointmentDate`: Date and Time of the appointment (YYYY-MM-DDTHH:mm)
- `installAddress`: Installation/Delivery Address
- `googleMapLink`: URL to Google Maps location
- `team`: Assigned Team Name

### 4. Items (`items`)
Array of product items in the order.
- `image`: Base64 string of the product image
- `code`: Product Code
- `type`: Lamp Type
- `length`, `width`, `height`: Dimensions
- `material`: Material
- `color`: Structure Color
- `crystalColor`: Crystal Color
- `bulbType`: Bulb Type
- `light`: Light Color
- `remote`: Remote Control availability
- `remark`: Details/Notes
- `qty`: Quantity
- `unitPrice`: Unit Price
- `specificJob`: Object containing job details specific to this item (synced from Master Job or set individually).
  - `type`, `team`, `dateTime`, `address`, `googleMapLink`

### 5. Financials
- `discount`: Object `{ mode: 'percent' | 'amount', value: number }`
- `vatRate`: Decimal (default 0.07)
- `deposit`: Object `{ mode: 'percent' | 'amount', value: number }`
- `shippingFee`: Shipping cost

## Key Features & Logic

### Master Job Synchronization
- **Logic**: A `useEffect` hook monitors changes to `jobInfo`.
- **Behavior**: 
  - If `jobInfo.jobType` is **NOT** `'separate_job'`, the system automatically updates the `specificJob` field of **ALL** items to match the Master Job details (`type`, `team`, `dateTime`, `address`, `googleMapLink`).
  - If `jobInfo.jobType` **IS** `'separate_job'`, this synchronization is bypassed, allowing each item to have unique job details set via the "Job" modal.

### Item-Specific Job Modal
- **Trigger**: Clicking the "Job" (or "แก้ไข") button on an item row.
- **Functionality**: Opens a modal to edit `specificJob` details for that specific item.
- **Fields**: Job Type, Team, Date/Time, Address, Google Maps Link.
- **State**: Uses temporary state `modalJobDetails` while editing, saving to `items` state only on "Save".

### Distance Calculation
- **Function**: `calculateDistance(lat1, lon1, lat2, lon2)`
- **Logic**: Uses the Haversine formula to calculate the distance in kilometers between the fixed Shop Coordinates (`SHOP_LAT`, `SHOP_LON`) and the coordinates extracted from the `googleMapLink`.
- **Extraction**: `extractCoordinates(url)` parses standard Google Maps URLs to find latitude and longitude.

### Address & Team Management
- **Saved Addresses**: `savedAddresses` state stores frequently used addresses. New addresses entered in the Master Job or Modal can be saved to this list.
- **Teams**: `teams` state stores available teams. Users can add new teams dynamically by typing a new name in the dropdown.

## Helper Functions

- `currency(n)`: Formats numbers as Thai Baht currency.
- `deg2rad(deg)`: Converts degrees to radians (for distance calc).
- `handleImageChange(index, e)`: Reads uploaded image file as Data URL.
- `handleSaveAddress()`: Adds current address to `savedAddresses` if not duplicate.
- `handleSaveTaxProfile()`: Adds current tax info to `savedTaxProfiles`.

## UI/UX Details
- **Responsive Design**: Uses CSS Grid and Flexbox. Layout adjusts from 4 columns to 2 or 1 column based on screen width.
- **Dropdowns**: Custom implementation with "click outside to close" logic using `useRef`.
- **Modals**: Overlay-based modal for item job details.
