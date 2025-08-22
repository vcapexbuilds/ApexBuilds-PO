# Power Automate Integration Notes

## PO Form Submission

### HTTP Endpoint
When **PO forms are submitted**, HTTP POST requests are sent to:
```
https://defaulta543e2f6ae4b4d1db263a38786ce68.44.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/146de521bc3a415d9dbbdfec5476be38/triggers/manual/paths/invoke/?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=_bSEuYWnBRzJs_p7EvROZXVi6KLitzuyOtIlD7lEqLA
```

## JSON Structure
The JSON payload sent to the above endpoint must strictly follow this structure:

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
    "contractAmount": 0,
    "addAltAmount": 0,
    "addAltDetails": "string",
    "retainagePct": 0,
    "requestedBy": "string",
    "companyName": "string",
    "contactName": "string",
    "cellNumber": "string",
    "email": "string",
    "officeNumber": "string",
    "vendorType": "string",
    "workType": "string",
    "importantDates": {
      "noticeToProceed": "string",
      "anticipatedStart": "string", 
      "substantialCompletion": "string",
      "hundredPercent": "string"
    }
  },
  "schedule": [
    {
      "primeLine": "string",
      "budgetCode": "string",
      "description": "string",
      "qty": 0,
      "unit": 0,
      "totalCost": 0,
      "scheduled": 0,
      "apexContractValue": 0
    }
  ],
  "scope": [
    {
      "item": "string",
      "description": "string", 
      "included": true,
      "excluded": false
    }
  ],
  "createdAt": "2025-08-19T17:03:44.693Z",
  "sent": true,
  "timestamp": 1755623024693,
  "id": 6,
  "sentAt": "2025-08-21T21:16:52.993Z"
}
```

## Implementation Details
- PO form data is collected from form fields and dynamic tables in the application
- The payload is sent directly without any wrapper objects  
- The `syncDirectly()` method in `js/core/api.js` handles the HTTP POST to Power Automate
- The `shapePOForSend()` method ensures the correct structure before sending
- PO form data is collected from the UI and shaped in `js/pages/form.js`
- Schedule and scope arrays are populated from the dynamic table components

## Date: August 22, 2025
Last updated: PO form submission integration with exact JSON structure requirement
