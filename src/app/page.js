'use client';
import { useState } from 'react';
import AddressSearch from '@/components/AddressSearch';
import TroveLifecycle from '@/components/TroveLifecycle';
import RedemptionSummary from '@/components/RedemptionSummary';
import LoadingSpinner from '@/components/LoadingSpinner';
import { findAllTroveEvents, findRedemptionEvents, findPreviousTroveState } from '@/lib/troveUtils';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [loadingState, setLoadingState] = useState('');
  const [troveEvents, setTroveEvents] = useState([]);
  const [redemptionEvents, setRedemptionEvents] = useState([]);
  const [error, setError] = useState('');

  const handleSearch = async (address) => {
    try {
      setLoading(true);
      setError('');
      setTroveEvents([]);
      setRedemptionEvents([]);
      
      // Get trove events
      setLoadingState('Searching for Trove interactions...');
      const troveData = await findAllTroveEvents(address);
      const sortedTroveData = troveData.sort((a, b) => a.timestamp - b.timestamp);
      setTroveEvents(sortedTroveData);
      setLoadingState(`Found ${troveData.length} Trove interactions. Searching for redemptions...`);
      
      // Get redemption events
      const redemptionData = await findRedemptionEvents(address);
      setLoadingState(`Found ${redemptionData.length} redemptions. Analyzing previous states...`);
      
      // Get previous states for each redemption
      const enrichedRedemptions = await Promise.all(
        redemptionData.map(async (redemption, index) => {
          setLoadingState(`Analyzing state before redemption ${index + 1} of ${redemptionData.length}...`);
          const prevState = await findPreviousTroveState(address, redemption.blockNumber);
          return { ...redemption, previousState: prevState };
        })
      );
      
      setRedemptionEvents(enrichedRedemptions);
    } catch (err) {
      setError('Error fetching data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingState('');
    }
  };

  return (
    <main className="min-h-screen p-8 bg-[var(--background)]">
      <h1 className="text-4xl font-bold mb-8 text-center text-[var(--foreground)]">
        Trove Analytics
      </h1>
      <AddressSearch onSearch={handleSearch} />
      
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mt-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="space-y-4">
          <LoadingSpinner />
          <p className="text-center text-gray-300">{loadingState}</p>
        </div>
      ) : (
        <>
          {troveEvents.length === 0 && redemptionEvents.length === 0 && !loading && (
            <div className="text-center text-gray-400 mt-8">
              No Trove interactions or redemptions found for this address
            </div>
          )}
          
          {troveEvents.length > 0 && (
            <TroveLifecycle events={troveEvents} />
          )}
          
          {redemptionEvents.length > 0 && (
            <RedemptionSummary events={redemptionEvents} />
          )}
        </>
      )}
    </main>
  );
}