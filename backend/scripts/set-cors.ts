import { storage } from '../src/config/firebase';

async function configureCors() {
  try {
    console.log('Configuring CORS for Firebase Storage bucket...');
    const bucket = storage.bucket();
    
    await bucket.setCorsConfiguration([
      {
        origin: ['*'], // In production, replace with your actual frontend domain
        method: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
        responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'User-Agent', 'x-goog-resumable'],
        maxAgeSeconds: 3600
      }
    ]);

    console.log('Successfully updated CORS configuration for bucket:', bucket.name);
    process.exit(0);
  } catch (error) {
    console.error('Failed to configure CORS:', error);
    process.exit(1);
  }
}

configureCors();
