const fs = require('fs');

const collectionPath = './postman_collection.json';
const collectionStr = fs.readFileSync(collectionPath, 'utf8');
const collection = JSON.parse(collectionStr);

const ownerFolder = {
  "name": "Owner Onboarding",
  "item": [
    {
      "name": "Get Profile",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/v1/owner/profile",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "owner", "profile"]
        }
      }
    },
    {
      "name": "Update Profile",
      "request": {
        "method": "PUT",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"ownerNic\": \"199012345678\",\n  \"mobile\": \"0771234567\",\n  \"address\": \"123 Galle Road\",\n  \"city\": \"Colombo\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/owner/profile",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "owner", "profile"]
        }
      }
    },
    {
      "name": "Submit Profile",
      "request": {
        "method": "POST",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/v1/owner/profile/submit",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "owner", "profile", "submit"]
        }
      }
    },
    {
      "name": "Generate Signed URL",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"fileName\": \"logo.png\",\n  \"contentType\": \"image/png\",\n  \"fileCategory\": \"business\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/owner/upload/generate-signed-url",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "owner", "upload", "generate-signed-url"]
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

collection.item = collection.item.filter(i => i.name !== 'Owner Onboarding');
collection.item.push(ownerFolder);

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
console.log('Postman collection updated successfully for Owner');
