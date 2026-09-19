import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';
dotenv.config();

async function listDbs() {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
    const auth = new GoogleAuth({
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key
      },
      projectId: serviceAccount.project_id,
      scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/datastore']
    });

    const client = await auth.getClient();
    const projectId = serviceAccount.project_id;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases`;

    const res = await client.request({ url });
    console.log('Databases:', JSON.stringify(res.data, null, 2));
    
  } catch (e) {
    console.error('Failed to list databases:', e);
  }
}

listDbs();
