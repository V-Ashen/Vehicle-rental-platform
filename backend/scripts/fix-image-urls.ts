import { db } from '../src/config/firebase';

async function fixImageUrls() {
  const snapshot = await db.collection('vehicles').get();
  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.imageUrl && data.imageUrl.startsWith('https://storage.googleapis.com/')) {
      // https://storage.googleapis.com/vehicle-rental-platform-f73c2.firebasestorage.app/tenants/TEN-CCNEO0/vehicles/1789725426950_Toyota-Vios.webp
      
      const urlParts = data.imageUrl.split('/');
      const bucketName = urlParts[3];
      const filePath = urlParts.slice(4).join('/');
      const encodedFilePath = encodeURIComponent(filePath);
      
      const newUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedFilePath}?alt=media`;
      
      await doc.ref.update({ imageUrl: newUrl });
      console.log(`Updated ${doc.id} image URL to: ${newUrl}`);
      updatedCount++;
    }
  }

  console.log(`Successfully updated ${updatedCount} vehicles.`);
}

fixImageUrls().then(() => process.exit(0)).catch(console.error);
