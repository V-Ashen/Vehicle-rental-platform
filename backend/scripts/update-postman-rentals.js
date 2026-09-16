const fs = require('fs');

const collectionPath = './postman_collection.json';
const collectionStr = fs.readFileSync(collectionPath, 'utf8');
const collection = JSON.parse(collectionStr);

const rentalCoreFolder = {
  "name": "Rental Core",
  "item": [
    {
      "name": "1. Create Customer",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"fullName\": \"John Doe\",\n  \"mobile\": \"+1234567890\",\n  \"email\": \"john@example.com\",\n  \"nicPassport\": \"N12345678\",\n  \"drivingLicence\": \"DL9876543\",\n  \"address\": \"123 Customer St\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/customers",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "customers"]
        }
      }
    },
    {
      "name": "2. Create Vehicle",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"registrationNumber\": \"CA-1234\",\n  \"make\": \"Toyota\",\n  \"model\": \"Prius\",\n  \"year\": 2020,\n  \"vehicleType\": \"CAR\",\n  \"currentOdometer\": 50000,\n  \"dailyRate\": 50,\n  \"extraKmRate\": 2,\n  \"depositAmount\": 200\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/vehicles",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "vehicles"]
        }
      }
    },
    {
      "name": "3. Create Rental (Transaction)",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"customerId\": \"{{customerId}}\",\n  \"vehicleId\": \"{{vehicleId}}\",\n  \"pickupAt\": \"2026-10-01T10:00:00Z\",\n  \"expectedReturnAt\": \"2026-10-03T10:00:00Z\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/rentals",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "rentals"]
        }
      }
    },
    {
      "name": "4. Rental Handover",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"odometer\": 50010,\n  \"fuelLevel\": \"FULL\",\n  \"conditionStatus\": \"GOOD\",\n  \"notes\": \"Car looks clean\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/rentals/{{rentalId}}/handover",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "rentals", "{{rentalId}}", "handover"]
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

collection.item = collection.item.filter(i => i.name !== 'Rental Core');
collection.item.push(rentalCoreFolder);

fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
console.log('Postman collection updated successfully for Rental Core');
