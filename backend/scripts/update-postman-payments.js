const fs = require('fs');

const collectionPath = './postman_collection.json';
const collectionStr = fs.readFileSync(collectionPath, 'utf8');
const collection = JSON.parse(collectionStr);

const paymentsFolder = {
  "name": "Payments & Renewals",
  "item": [
    {
      "name": "1. Submit Bank Transfer",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"packageId\": \"{{packageId}}\",\n  \"slipUrl\": \"https://storage.googleapis.com/bucket/slip.jpg\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/payments/bank-transfer",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "payments", "bank-transfer"]
        }
      }
    },
    {
      "name": "2. Initialize Online Checkout",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"packageId\": \"{{packageId}}\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/payments/checkout",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "payments", "checkout"]
        }
      }
    },
    {
      "name": "3. Gateway Webhook (PUBLIC)",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Content-Type", "value": "application/json"},
          {"key": "x-signature", "value": "valid-sig"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"order_id\": \"PAY-123\",\n  \"transaction_id\": \"TXN-778899\",\n  \"status\": 2\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/webhooks/payments",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "webhooks", "payments"]
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

// Webhook endpoint does not need auth, so let's override auth for it
paymentsFolder.item[2].request.auth = {
  "type": "noauth"
};

collection.item = collection.item.filter(i => i.name !== 'Payments & Renewals');
collection.item.push(paymentsFolder);

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
console.log('Postman collection updated successfully for Payments');
