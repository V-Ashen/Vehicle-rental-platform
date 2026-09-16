const fs = require('fs');

const collectionPath = './postman_collection.json';
const collectionStr = fs.readFileSync(collectionPath, 'utf8');
const collection = JSON.parse(collectionStr);

const rentalCoreFolderIndex = collection.item.findIndex(i => i.name === 'Rental Core');

if (rentalCoreFolderIndex !== -1) {
  const returnRequest = {
    "name": "5. Unified Rental Return",
    "request": {
      "method": "POST",
      "header": [{"key": "Content-Type", "value": "application/json"}],
      "body": {
        "mode": "raw",
        "raw": "{\n  \"actualReturnAt\": \"2026-10-03T12:30:00Z\",\n  \"endOdometer\": 50150,\n  \"endFuelLevel\": \"HALF\",\n  \"damages\": [\n    {\n      \"damageArea\": \"Front Bumper\",\n      \"damageType\": \"SCRATCH\",\n      \"description\": \"Deep scratch on the right side\",\n      \"estimatedCost\": 300\n    }\n  ],\n  \"otherCharges\": 50,\n  \"requiresMaintenance\": true,\n  \"gracePeriodMinutes\": 60,\n  \"hourlyLateCharge\": 10\n}"
      },
      "url": {
        "raw": "{{baseUrl}}/api/v1/rentals/{{rentalId}}/return",
        "host": ["{{baseUrl}}"],
        "path": ["api", "v1", "rentals", "{{rentalId}}", "return"]
      }
    }
  };

  // Add if not already present
  if (!collection.item[rentalCoreFolderIndex].item.some(i => i.name === '5. Unified Rental Return')) {
    collection.item[rentalCoreFolderIndex].item.push(returnRequest);
    fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
    console.log('Postman collection updated successfully for Rental Return');
  } else {
    console.log('Return request already in Postman collection');
  }
} else {
  console.log('Rental Core folder not found in Postman collection');
}
