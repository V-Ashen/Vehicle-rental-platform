import { redirect } from 'next/navigation';

export default function Home() {
  // We can eventually have a real landing page here. 
  // For now, redirect straight to login.
  redirect('/login');
}
