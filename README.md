# Apex PO System

## Power Automate Integration

**⚠️ CRITICAL:** When working with Power Automate integration, always reference:
- `POWER_AUTOMATE_JSON_SCHEMA.md` - Exact JSON structure requirements (HTTP 400 errors if not followed)
- `POWER_AUTOMATE_INTEGRATION.md` - Integration overview and endpoint details  
<!-- test-powerautomate.html removed (local test page) -->

The Power Automate schema validation is strict and requires exact data types and structure.

## Quick Start

1. Open `index.html` to access the system
2. Use `pages/form.html` for PO creation
3. Use `pages/admin.html` for admin functions
4. Use `pages/tracking.html` for PO tracking

## Testing Power Automate

1. Open `test-powerautomate.html` in browser
2. Click "Test Connection" to verify endpoint
3. Click "Send Sample PO" to test data transmission
4. Check browser console for detailed logs

## Project Structure

- `pages/` - HTML pages (form, admin, tracking)
- `js/core/` - Core functionality (API, auth, storage)
- `js/pages/` - Page-specific JavaScript
- `js/Module/` - Reusable components
- `css/` - Stylesheets
- `components/` - Reusable HTML components

## Last Updated
August 22, 2025