'use client'; // needed if PortfolioDashboard uses hooks or client features
import PortfolioDashboard from '../components/PortfolioDashboard';

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-dashboard">
      <PortfolioDashboard />
    </div>
  );
}