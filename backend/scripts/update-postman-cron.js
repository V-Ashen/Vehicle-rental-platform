const fs = require('fs');

const collectionPath = './postman_collection.json';
const collectionStr = fs.readFileSync(collectionPath, 'utf8');
const collection = JSON.parse(collectionStr);

const cronFolder = {
  "name": "Cron & System Jobs",
  "item": [
    {
      "name": "1. Process Notifications",
      "request": {
        "method": "POST",
        "header": [
          {"key": "x-cron-secret", "value": "dev-cron-secret-123"}
        ],
        "url": {
          "raw": "{{baseUrl}}/api/v1/cron/process-notifications",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "cron", "process-notifications"]
        }
      }
    },
    {
      "name": "2. Daily Subscription Automations",
      "request": {
        "method": "POST",
        "header": [
          {"key": "x-cron-secret", "value": "dev-cron-secret-123"}
        ],
        "url": {
          "raw": "{{baseUrl}}/api/v1/cron/daily-subscriptions",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "cron", "daily-subscriptions"]
        }
      }
    }
  ]
};

collection.item = collection.item.filter(i => i.name !== 'Cron & System Jobs');
collection.item.push(cronFolder);

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
console.log('Postman collection updated successfully for Cron Jobs');
