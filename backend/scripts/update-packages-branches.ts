import { db } from '../src/config/firebase';

const updatePackages = async () => {
  const packagesCollection = db.collection('packages');
  const snapshot = await packagesCollection.get();
  
  let updatedCount = 0;
  for (const doc of snapshot.docs) {
    const pkg = doc.data();
    let maxBranches = 1;
    
    if (pkg.name === 'Starter') maxBranches = 1;
    else if (pkg.name === 'Growth') maxBranches = 3;
    else if (pkg.name === 'Professional') maxBranches = 5;
    else if (pkg.name === 'Enterprise') maxBranches = 10;
    
    await doc.ref.update({ maxBranches });
    console.log(`Updated package ${pkg.name} with maxBranches = ${maxBranches}`);
    updatedCount++;
  }
  
  console.log(`✅ Updated ${updatedCount} packages.`);
};

updatePackages().catch(console.error).finally(() => process.exit(0));
