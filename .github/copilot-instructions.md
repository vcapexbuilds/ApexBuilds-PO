# Copilot Instructions for Apex PO System

## Architecture Overview

This is a **client-side JavaScript SPA** for purchase order management with Microsoft OAuth integration and Power Automate backend. Key architectural decisions:

- **No build system** - Direct HTML/CSS/JS for GitHub Pages deployment
- **Module pattern** - Global namespaced objects (`window.PODataManager`, `window.MicrosoftAuth`)
- **Environment-aware** - Auto-detects local vs production via `js/core/environment-config.js`

## Core Components

### Authentication Flow
- **Microsoft OAuth 2.0 with PKCE** in `js/core/microsoft-auth-config.js`
- Real Microsoft Graph API calls replace demo data (`handleCallback()` method)
- User data flows: OAuth → localStorage → auth system integration
- Entry points: `index.html` (login) → `pages/tracking.html` (callback/dashboard)

### Data Management Architecture
```
Power Automate API → PODataManager → TrackingDashboard → UI
                  ↘ (fallback) → DemoData → UI
```

- **PODataManager** (`js/core/po-data-manager.js`): Power Automate integration with intelligent fallbacks
- **TrackingDashboard** (`js/pages/tracking.js`): UI controller with array safety checks
- **Response processing**: Handles 6+ Power Automate response formats dynamically

### Critical Files Structure
```
js/core/
├── po-data-manager.js       # Power Automate integration & fallbacks
├── microsoft-auth-config.js # OAuth flow with real Graph API
├── environment-config.js    # Production-only GitHub Pages config
└── po-data-config.js       # Power Automate endpoints

pages/
├── form.html               # PO creation with dynamic sections
├── tracking.html           # User-specific dashboard (no "My POs" filter needed)
└── admin.html             # Administrative interface
```

## Essential Patterns

### Array Safety Pattern (Critical)
Always check arrays before spread/iteration operations:
```javascript
// REQUIRED pattern throughout codebase
if (!Array.isArray(this.allPOs)) {
    console.warn('⚠️ this.allPOs is not an array, resetting to empty array');
    this.allPOs = [];
}
let tempPOs = [...this.allPOs];
```

### Power Automate Integration Pattern
```javascript
// Method override pattern in tracking.js
this.poDataManager.displayPOs = (pos) => {
    if (!Array.isArray(pos)) {
        this.allPOs = [];
    } else {
        this.allPOs = pos;
    }
    this.filterPOs();
};
```

### Environment-Aware Navigation
Always use environment config for paths:
```javascript
// Use this pattern, not hardcoded URLs
window.location.href = window.ENV_CONFIG?.getFormPagePath() || '../pages/form.html'
```

## Development Workflow

### Local Development
```bash
npm start  # Serves on http://localhost:3000
```

### Deployment
- **Target**: GitHub Pages at `https://vcapexbuilds.github.io/ApexBuilds-PO/`
- **No build process** - Direct file push to main branch
- Environment auto-detection ensures production URLs

### Debugging Commands
```javascript
// Check Power Automate status
window.poDataManager.fetchAndDisplayPOs(true)

// Debug auth state
console.log('Auth state:', localStorage.getItem('currentUser'))

// Test array safety
console.log('Arrays valid:', Array.isArray(window.trackingDashboard.allPOs))
```

## Integration Points

### Microsoft OAuth Integration
- **Client ID**: `d3d0abdb-6c1e-4e54-86e6-262ef5ea3365`
- **Tenant**: Apex Building Group Azure AD
- **Redirect URI**: Auto-configured per environment
- **Real Graph API**: `/me` endpoint for authentic user data

### Power Automate Endpoints
- Configured in `js/core/po-data-config.js`
- **Fallback chain**: Live API → Demo data → Error state
- **NO test data** on production - this is a live system

### Data Flow Boundaries
- **User-specific data**: Tracking page shows only current user's POs
- **Client-side filtering**: Status, date, project filters applied in browser
- **No server-side persistence**: Power Automate handles all data storage

## Critical Constraints

⚠️ **LIVE SYSTEM**: Never add test data or demo modes to production
⚠️ **Array Safety**: Always validate arrays before spread operations
⚠️ **User Context**: Tracking page is inherently user-specific - no "My POs" filter needed
⚠️ **Error Handling**: Failed Power Automate requests should fail silently with fallbacks

## Common Anti-Patterns to Avoid

❌ Hardcoded GitHub Pages URLs (use environment config)
❌ Test data in production environment  
❌ Alert popups for API failures (log to console instead)
❌ Assuming `this.allPOs` is always an array
❌ Adding "My POs only" filters (page is already user-specific)
