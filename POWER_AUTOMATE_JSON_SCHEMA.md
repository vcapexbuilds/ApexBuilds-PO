# Power Automate JSON Schema Requirements

## ⚠️ CRITICAL: EXACT JSON STRUCTURE REQUIRED

Power Automate expects **EXACTLY** this JSON structure. Any deviation will result in HTTP 400 errors.

## Required JSON Structure

```json
{
  "meta": {
    "projectName": "string",
    "generalContractor": "string",
    "address": "string", 
    "owner": "string",
    "apexOwner": "string",
    "typeStatus": "string",
    "projectManager": "string",
    "contractAmount": integer,
    "addAltAmount": integer,
    "addAltDetails": "string",
    "retainagePct": integer,
    "requestedBy": "string",
    "companyName": "string",
    "contactName": "string",
    "cellNumber": "string",
    "email": "string",
    "officeNumber": "string",
    "vendorType": "string",
    "workType": "string",
    "importantDates": {
      "noticeToProceed": "string (YYYY-MM-DD format)",
      "anticipatedStart": "string (YYYY-MM-DD format)",
      "substantialCompletion": "string (YYYY-MM-DD format)",
      "hundredPercent": "string (YYYY-MM-DD format)"
    }
  },
  "schedule": [
    {
      "primeLine": "string",
      "budgetCode": "string",
      "description": "string",
      "qty": integer,
      "unit": integer,
      "totalCost": integer,
      "scheduled": integer,
      "apexContractValue": integer,
      "profit": integer
    }
  ],
  "scope": [
    {
      "item": "string", 
      "description": "string",
      "included": boolean,
      "excluded": boolean
    }
  ],
  "createdAt": "string (ISO 8601 format)",
  "sent": boolean,
  "timestamp": integer,
  "id": integer
}
```

## Data Type Requirements

### Strings
- All text fields must be converted using `String(value)`
- Dates must be in YYYY-MM-DD or ISO 8601 format
- Empty values should be empty strings `""`, not null

### Integers
- All numeric fields must be converted using `parseInt(value)`
- Never use `Number()` - causes schema mismatch
- Default to 0 for missing values

### Booleans
- Use `Boolean(value)` for true/false fields
- Default to false for missing values

### Arrays
- Always provide arrays, even if empty: `[]`
- Use proper mapping with data type conversion

## Implementation Notes

### shapePOForSend() Function Structure
```javascript
shapePOForSend(po) {
    const meta = po.meta || {};
    
    return {
        meta: {
            projectName: String(meta.projectName || ""),
            generalContractor: String(meta.generalContractor || ""),
            // ... all meta fields with String() conversion
            contractAmount: parseInt(meta.contractAmount) || 0,
            addAltAmount: parseInt(meta.addAltAmount) || 0,
            retainagePct: parseInt(meta.retainagePct) || 0,
            importantDates: {
                noticeToProceed: String((meta.importantDates?.noticeToProceed) || ""),
                anticipatedStart: String((meta.importantDates?.anticipatedStart) || ""),
                substantialCompletion: String((meta.importantDates?.substantialCompletion) || ""),
                hundredPercent: String((meta.importantDates?.hundredPercent) || "")
            }
        },
        schedule: Array.isArray(po.schedule) ? po.schedule.map(item => ({
            primeLine: String(item.primeLine || ""),
            budgetCode: String(item.budgetCode || ""),
            description: String(item.description || ""),
            qty: parseInt(item.qty) || 0,
            unit: parseInt(item.unit) || 0,
            totalCost: parseInt(item.totalCost) || 0,
            scheduled: parseInt(item.scheduled) || 0,
            apexContractValue: parseInt(item.apexContractValue) || 0,
            profit: parseInt(item.profit) || 0
        })) : [],
        scope: Array.isArray(po.scope) ? po.scope.map(item => ({
            item: String(item.item || ""),
            description: String(item.description || ""),
            included: Boolean(item.included),
            excluded: Boolean(item.excluded)
        })) : [],
        createdAt: String(po.createdAt || new Date().toISOString()),
        sent: Boolean(po.sent),
        timestamp: parseInt(po.timestamp) || Date.now(),
        id: parseInt(po.id) || Math.floor(Date.now() / 1000)
    };
}
```

## Common Errors to Avoid

### ❌ WRONG - Will cause HTTP 400
```json
{
  "projectName": "test",           // Missing meta wrapper
  "contractAmount": "50000",       // String instead of integer
  "profit": 45000,                 // At root level instead of schedule items
  "schedule": [{
    "qty": "5"                     // String instead of integer
  }]
}
```

### ✅ CORRECT - Will work
```json
{
  "meta": {
    "projectName": "test",         // Properly nested in meta
    "contractAmount": 50000        // Integer, not string
  },
  "schedule": [{
    "qty": 5,                      // Integer
    "profit": 100                  // At item level
  }],
  "scope": [],                     // Always provide arrays
  "createdAt": "2025-08-22T14:35:47.724Z",
  "sent": false,
  "timestamp": 1755873347724,
  "id": 7
}
```

## Testing Checklist

- [ ] All meta fields are under `meta` object
- [ ] Schedule items include `profit` field at item level
- [ ] All integers use `parseInt()` conversion
- [ ] All strings use `String()` conversion
- [ ] All booleans use `Boolean()` conversion
- [ ] Arrays are provided even if empty
- [ ] Dates are in proper format
- [ ] No null values in required fields

## Files Updated
- `js/core/api.js` - shapePOForSend() method
<!-- test-powerautomate.html removed (was a local troubleshooting page) -->
- Form submission handlers - All use shapePOForSend()

## Last Updated
August 22, 2025 - Updated to match exact Power Automate schema requirements
