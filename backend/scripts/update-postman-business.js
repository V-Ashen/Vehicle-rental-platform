const fs = require('fs');

const collectionPath = './postman_collection.json';
const collectionStr = fs.readFileSync(collectionPath, 'utf8');
const collection = JSON.parse(collectionStr);

const businessOpsFolder = {
  "name": "Business Operations",
  "item": [
    {
      "name": "1. Create Maintenance Record",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"vehicleId\": \"{{vehicleId}}\",\n  \"maintenanceType\": \"SERVICE\",\n  \"description\": \"Routine oil change and filter replacement\",\n  \"serviceDate\": \"2026-10-05T08:00:00Z\",\n  \"odometer\": 50500,\n  \"cost\": 150,\n  \"markVehicleAvailable\": true\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/maintenance",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "maintenance"]
        }
      }
    },
    {
      "name": "2. List Maintenance Records",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/v1/maintenance?vehicleId={{vehicleId}}",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "maintenance"],
          "query": [
            {
              "key": "vehicleId",
              "value": "{{vehicleId}}"
            }
          ]
        }
      }
    },
    {
      "name": "3. Upload Vehicle Document",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"documentType\": \"INSURANCE\",\n  \"documentNumber\": \"INS-998877\",\n  \"issueDate\": \"2026-01-01T00:00:00Z\",\n  \"expiryDate\": \"2026-12-31T23:59:59Z\",\n  \"fileUrl\": \"https://storage.googleapis.com/bucket/doc.pdf\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/vehicles/{{vehicleId}}/documents",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "vehicles", "{{vehicleId}}", "documents"]
        }
      }
    },
    {
      "name": "4. Financial Report",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/v1/reports/financial?startDate=2026-01-01T00:00:00Z&endDate=2026-12-31T23:59:59Z",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "reports", "financial"],
          "query": [
            {
              "key": "startDate",
              "value": "2026-01-01T00:00:00Z"
            },
            {
              "key": "endDate",
              "value": "2026-12-31T23:59:59Z"
            }
          ]
        }
      }
    }
  ],
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{ownerToken}}",
        "type": "string"
      }
    ]
  }
};

collection.item = collection.item.filter(i => i.name !== 'Business Operations');
collection.item.push(businessOpsFolder);

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
console.log('Postman collection updated successfully for Business Operations');
