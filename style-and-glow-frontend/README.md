# Style & Glow — Online Shopping Project Starter

## Project pages
- `index.html` — customer storefront
- `admin.html` — admin dashboard for demo product and inventory CRUD

## CSS and JavaScript
- `styles.css` — shared/customer storefront styling
- `script.js` — customer product listing, filters, search, wishlist and cart
- `admin.css` — admin dashboard styling
- `admin.js` — admin product CRUD and inventory summary

## Run in VS Code
1. Extract this ZIP file.
2. Open the extracted `style-and-glow-frontend` folder in VS Code (`File > Open Folder`).
3. Open `index.html` and choose **Open with Live Server** (install the Live Server extension if needed).
4. Use the **Admin** link in the customer navigation to open `admin.html`.

## Current demo features
- Customer: category browsing, product filters, search, wishlist and shopping cart.
- Admin: add, view, edit and delete sample products; view stock totals and low-stock count.
- Admin product changes are saved in browser LocalStorage and shared with the customer catalogue in the same browser.

## Important limitations
This is only the first frontend/demo stage. It does **not** yet implement Firebase/Firestore, API/AJAX calls, secure admin/customer authentication, customer CRUD or credit limits, real orders, payment processing, email, or the requested date-range reports. LocalStorage is not a secure database or authorization system. Do not use real customer data or payment details. These features will be developed in later steps against the supplied project requirements.

Sample product details and external images are for demonstration. Google Fonts and remote images require an internet connection.
