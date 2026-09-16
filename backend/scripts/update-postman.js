const fs = require('fs');

const collectionPath = './postman_collection.json';
const collectionStr = fs.readFileSync(collectionPath, 'utf8');
const collection = JSON.parse(collectionStr);

const adminFolder = {
  "name": "SaaS Admin",
  "item": [
    {
      "name": "Packages",
      "item": [
        {
          "name": "List Packages",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/v1/admin/packages",
              "host": ["{{baseUrl}}"],
              "path": ["api", "v1", "admin", "packages"]
            }
          }
        },
        {
          "name": "Create Package",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Pro\",\n  \"monthlyPrice\": 99,\n  \"yearlyPrice\": 990,\n  \"maxVehicles\": 50,\n  \"maxUsers\": 5,\n  \"features\": {}\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/v1/admin/packages",
              "host": ["{{baseUrl}}"],
              "path": ["api", "v1", "admin", "packages"]
            }
          }
        },
        {
          "name": "Update Package Status",
          "request": {
            "method": "PATCH",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"status\": \"ACTIVE\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/v1/admin/packages/PKG-123/status",
              "host": ["{{baseUrl}}"],
              "path": ["api", "v1", "admin", "packages", "PKG-123", "status"]
            }
          }
        }
      ]
    },
    {
      "name": "Tenants",
      "item": [
        {
          "name": "List Tenants",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/v1/admin/tenants?limit=20&accountStatus=ACTIVE",
              "host": ["{{baseUrl}}"],
              "path": ["api", "v1", "admin", "tenants"],
              "query": [
                {"key": "limit", "value": "20"},
                {"key": "accountStatus", "value": "ACTIVE"}
              ]
            }
          }
        },
        {
          "name": "Update Profile Status",
          "request": {
            "method": "PATCH",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"status\": \"VERIFIED\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/v1/admin/tenants/TEN-123/profile-status",
              "host": ["{{baseUrl}}"],
              "path": ["api", "v1", "admin", "tenants", "TEN-123", "profile-status"]
            }
          }
        }
      ]
    },
    {
      "name": "Payment Requests",
      "item": [
        {
          "name": "Approve Payment",
          "request": {
            "method": "PATCH",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/v1/admin/payment-requests/PRQ-123/approve",
              "host": ["{{baseUrl}}"],
              "path": ["api", "v1", "admin", "payment-requests", "PRQ-123", "approve"]
            }
          }
        }
      ]
    },
    {
      "name": "Dashboard",
      "item": [
        {
          "name": "Get Metrics",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/api/v1/admin/dashboard/metrics",
              "host": ["{{baseUrl}}"],
              "path": ["api", "v1", "admin", "dashboard", "metrics"]
            }
          }
        }
      ]
    }
  ],
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{adminToken}}",
        "type": "string"
      }
    ]
  }
};

// Remove old Admin folder if exists
collection.item = collection.item.filter(i => i.name !== 'SaaS Admin');
collection.item.push(adminFolder);

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
console.log('Postman collection updated successfully');
