'use client';

import { useState } from 'react';
import AddressSearch from '@/components/AddressSearch';
import TroveLifecycle from '@/components/TroveLifecycle';
import RedemptionSummary from '@/components/RedemptionSummary';
import LoadingSpinner from '@/components/LoadingSpinner';
import TabNav from '@/components/TabNav';
import History from '@/components/History';
import { findAllTroveEvents, findRedemptionEvents, findPreviousTroveState } from '@/lib/troveUtils';
import Image from 'next/image';

export default function Home() {
  const [activeTab, setActiveTab] = useState('search');
  const [loading, setLoading] = useState(false);
  const [loadingState, setLoadingState] = useState('');
  const [troveEvents, setTroveEvents] = useState([]);
  const [redemptionEvents, setRedemptionEvents] = useState([]);
  const [error, setError] = useState('');
  const [abortController, setAbortController] = useState(null);

  const handleSearch = async (address) => {
    try {
      // Cancel any existing search
      if (abortController) {
        abortController.abort();
      }

      // Create new controller for this search
      const controller = new AbortController();
      setAbortController(controller);
      
      setLoading(true);
      setError('');
      setTroveEvents([]);
      setRedemptionEvents([]);
      
      setLoadingState('Searching for Trove interactions...');
      const troveData = await findAllTroveEvents(address);
      
      // Check if search was aborted
      if (controller.signal.aborted) return;
      
      const sortedTroveData = troveData.sort((a, b) => a.timestamp - b.timestamp);
      setTroveEvents(sortedTroveData);
      setLoadingState(`Found ${troveData.length} Trove interactions. Searching for redemptions...`);
      
      const redemptionData = await findRedemptionEvents(address);
      
      // Check if search was aborted
      if (controller.signal.aborted) return;
      
      setLoadingState(`Found ${redemptionData.length} redemptions. Analyzing previous states...`);

      // Combine all events for accurate state tracking
      const allEvents = [...sortedTroveData, ...redemptionData].sort((a, b) => a.timestamp - b.timestamp);
      
      const enrichedRedemptions = await Promise.all(
        redemptionData.map(async (redemption, index) => {
          // Check if search was aborted before each state analysis
          if (controller.signal.aborted) return;
          
          setLoadingState(`Analyzing state before redemption ${index + 1} of ${redemptionData.length}...`);
          const prevState = await findPreviousTroveState(
            address, 
            redemption.blockNumber,
            allEvents
          );
          return { 
            ...redemption, 
            previousState: prevState,
            currentState: {
              debt: redemption.debt,
              collateral: redemption.collateral
            }
          };
        })
      );
      
      // Final abort check before setting state
      if (controller.signal.aborted) return;
      
      // Sort redemptions by timestamp
      const sortedRedemptions = enrichedRedemptions.sort((a, b) => a.timestamp - b.timestamp);
      setRedemptionEvents(sortedRedemptions);

    } catch (err) {
      // Only show error if the search wasn't aborted
      if (!abortController?.signal.aborted) {
        setError('Error fetching data. Please try again.');
        console.error(err);
      }
    } finally {
      // Only reset loading state if the search wasn't aborted
      if (!abortController?.signal.aborted) {
        setLoading(false);
        setLoadingState('');
        setAbortController(null);
      }
    }
  };

  const handleTabChange = (tab) => {
    // Cancel any ongoing search when switching tabs
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setActiveTab(tab);
  };

  const renderSearchTab = () => (
    <>
      <AddressSearch onSearch={handleSearch} />
      
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mt-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="space-y-4">
          <LoadingSpinner />
          <div className="text-center">
            <p className="text-gray-300 mb-2">{loadingState}</p>
            {troveEvents.length > 0 && (
              <p className="text-gray-400 text-sm">
                Found {troveEvents.length} Trove interaction{troveEvents.length !== 1 ? 's' : ''}
              </p>
            )}
            {redemptionEvents.length > 0 && (
              <p className="text-gray-400 text-sm">
                Found {redemptionEvents.length} redemption{redemptionEvents.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          {troveEvents.length === 0 && redemptionEvents.length === 0 && !loading && (
            <div className="text-center text-gray-400 mt-8">
              No Trove interactions or redemptions found for this address
            </div>
          )}
          
          {troveEvents.length > 0 && (
            <TroveLifecycle 
              events={troveEvents.map(event => ({
                ...event,
                type: event.operation === 3 ? 'redemption' : 'adjustment'
              }))} 
            />
          )}
          
          {redemptionEvents.length > 0 && (
            <RedemptionSummary 
              events={redemptionEvents}
              troveEvents={troveEvents}
            />
          )}
        </>
      )}

      {(troveEvents.length > 0 || redemptionEvents.length > 0) && (
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>All times shown in UTC timezone</p>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span>Data sourced from</span>
            <Image 
              src="/cro-logo.png" 
              alt="Cronos Logo" 
              width={16} 
              height={16} 
              className="inline-block align-middle"
            />
            <span>Cronos blockchain</span>
          </div>
        </footer>
      )}
    </>
  );

  return (
    <main className="min-h-screen p-8 bg-gray-900">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-100">
        Trove Analytics
      </h1>
      
      <TabNav activeTab={activeTab} onTabChange={handleTabChange} />
      
      {activeTab === 'search' ? renderSearchTab() : <History />}
    </main>
  );
}