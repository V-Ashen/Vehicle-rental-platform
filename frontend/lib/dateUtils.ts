export const parseFirestoreDate = (dateVal: any): Date => {
  if (!dateVal) return new Date();
  // Check if it's a Firestore Timestamp object
  if (dateVal._seconds !== undefined) {
    return new Date(dateVal._seconds * 1000);
  }
  // Otherwise try to parse it normally (ISO string or JS Date)
  return new Date(dateVal);
};
