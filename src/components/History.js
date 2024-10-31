'use client';

import { useState, useEffect } from 'react';
import { getRecentRedemptions } from '@/lib/troveUtils';
import axios from 'axios';

export default function History() {
  // All state declarations stay the same
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({
    message: '',
    current: 0,
    total: 0,
    lastProcessedIndex: -1
  });
  const [abortController, setAbortController] = useState(null);
  const [searchStopped, setSearchStopped] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);


  // All your existing functions stay exactly the same
  const startSearch = async (startFromIndex = -1) => {
    const controller = new AbortController();
    setAbortController(controller);
    setSearchStopped(false);
    setLoading(true);
    setError('');
    setProgress(prev => ({
      ...prev,
      message: 'Starting search...'
    }));
    
    try {
      await getRecentRedemptions(50, (update) => {
        switch (update.type) {
          case 'TOTAL_FOUND':
            setProgress(prev => ({
              ...prev,
              message: update.message,
              total: update.total,
              lastProcessedIndex: startFromIndex
            }));
            break;
          
          case 'PROCESSING':
            setProgress(prev => ({
              ...prev,
              message: update.message,
              current: update.current,
              lastProcessedIndex: update.current - 1
            }));
            break;
          
          case 'NEW_EVENT':
            setRedemptions(update.events);
            setProgress(prev => ({
              ...prev,
              message: update.message,
              current: update.current,
              lastProcessedIndex: update.current - 1
            }));
            sessionStorage.setItem('redemptionResults', JSON.stringify({
              redemptions: update.events,
              progress: {
                ...progress,
                current: update.current,
                lastProcessedIndex: update.current - 1
              }
            }));
            break;
          
          case 'COMPLETE':
            setRedemptions(update.events);
            setProgress(prev => ({
              ...prev,
              message: 'Search complete',
              current: update.total,
              lastProcessedIndex: update.total - 1
            }));
            setLoading(false);
            setSearchStopped(false);
            sessionStorage.setItem('redemptionResults', JSON.stringify({
              redemptions: update.events,
              progress: {
                ...progress,
                current: update.total,
                lastProcessedIndex: update.total - 1
              },
              completed: true
            }));
            break;
        }
      }, controller.signal, startFromIndex);
    } catch (err) {
      if (err.name === 'AbortError' || axios.isCancel(err)) {
        setProgress(prev => ({
          ...prev,
          message: 'Search paused. Click Resume to continue.',
        }));
        setSearchStopped(true);
      } else {
        setError('Error fetching recent redemptions. Please try again later.');
        console.error(err);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedResults = sessionStorage.getItem('redemptionResults');
    if (savedResults) {
      const { redemptions: savedRedemptions, progress: savedProgress, completed } = JSON.parse(savedResults);
      setRedemptions(savedRedemptions);
      
      if (!completed) {
        setProgress(prev => ({
          ...savedProgress,
          message: 'Search paused. Click Resume to continue.'
        }));
        setSearchStopped(true);
      } else {
        setProgress(prev => ({
          ...savedProgress,
          message: 'Search complete'
        }));
        setSearchStopped(false);
      }
      setLoading(false);
    } else if (isInitialLoad) {
      startSearch();
      setIsInitialLoad(false);
    }

    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, []);

  const handleStopSearch = () => {
    if (abortController) {
      // First abort the controller
      abortController.abort();
      
      // Then update UI state
      setSearchStopped(true);
      setLoading(false);
      setProgress(prev => ({
        ...prev,
        message: 'Search paused. Click Resume to continue.',
        // Keep lastProcessedIndex for resume functionality
        lastProcessedIndex: prev.lastProcessedIndex
      }));
  
      // Update session storage with current state
      sessionStorage.setItem('redemptionResults', JSON.stringify({
        redemptions,
        progress: {
          ...progress,
          current: progress.current,
          lastProcessedIndex: progress.lastProcessedIndex
        },
        completed: false
      }));
    }
  };


  const handleResumeSearch = () => {
    startSearch(progress.lastProcessedIndex);
  };

  const handleRestartSearch = () => {
    sessionStorage.removeItem('redemptionResults');
    setRedemptions([]);
    setProgress({
      message: '',
      current: 0,
      total: 0,
      lastProcessedIndex: -1
    });
    startSearch();
  };

  // Add the clear results function
  const handleClearResults = () => {
    // Clear results and storage
    setRedemptions([]);
    sessionStorage.removeItem('redemptionResults');
    
    // Only reset progress index/numbers but keep other states unchanged
    setProgress(prev => ({
      ...prev,
      current: 0,
      lastProcessedIndex: -1,  // Reset this to start fresh
      message: ''
    }));
  };

  const formatAddress = (address) => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  return (
    <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
      {/* Updated header with responsive layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">Recent Redemptions</h2>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
          {(loading || progress.message) && (
            <div className="text-sm text-gray-400 break-words">
              {progress.message}
              {progress.total > 0 && loading && (
                <div className="text-xs mt-1">
                  Progress: {progress.current} / {progress.total}
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {loading ? (
              <button
                onClick={handleStopSearch}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Pause Search
              </button>
            ) : searchStopped ? (
              <>
                <button
                  onClick={handleClearResults}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Clear Results
                </button>
                <button
                  onClick={handleResumeSearch}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Resume Search
                </button>
              </>
            ) : redemptions.length > 0 && (
              <>
                <button
                  onClick={handleClearResults}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Clear Results
                </button>
                <button
                  onClick={handleRestartSearch}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Start New Search
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mb-4 break-words">
          {error}
        </div>
      )}

      <div className="space-y-4 md:space-y-6">
        {redemptions.length === 0 && !loading ? (
          <div className="text-center text-gray-400 py-8">
            No redemptions found
          </div>
        ) : (
          redemptions.map((redemption) => (
            <div key={redemption.id} className="border-l-4 border-green-500 pl-4 bg-gray-700/30 p-4 rounded-lg">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="break-words">
                  <div className="font-semibold text-white mb-1">
                    {redemption.currentState.collateral === "0" && redemption.currentState.debt === "0" 
                      ? 'FULL' 
                      : 'PARTIAL'} Redemption
                  </div>
                  <div className="text-sm text-gray-300">
                    Time: {formatTimestamp(redemption.timestamp)}
                  </div>
                  <div className="text-sm text-gray-300 break-all">
                    Tx: <a 
                      href={`https://cronoscan.com/tx/${redemption.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      {redemption.txHash}
                    </a>
                  </div>
                </div>
                <div className="text-sm space-y-2">
                  <div>
                    <a
                      href={`https://cronoscan.com/address/${redemption.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 hover:underline break-all"
                    >
                      Trove: {formatAddress(redemption.address)}
                    </a>
                  </div>
                  {redemption.redeemer && (
                    <div>
                      <a
                        href={`https://cronoscan.com/address/${redemption.redeemer}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 hover:underline break-all"
                      >
                        {/* Redeemer: {formatAddress(redemption.redeemer)} */}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {redemption.previousState ? (
                <div className="mt-4 space-y-4">
                  <div className="bg-gray-800/50 p-3 rounded break-words">
                    <div className="font-medium text-white mb-2">State Before Redemption:</div>
                    <div className="text-gray-300">
                      Collateral: {parseFloat(redemption.previousState.collateral).toFixed(4)} CDCETH
                    </div>
                    <div className="text-gray-300">
                      Debt: {parseFloat(redemption.previousState.debt).toFixed(4)} USC
                    </div>
                  </div>

                  <div className="bg-gray-800/50 p-3 rounded break-words">
                    <div className="font-medium text-white mb-2">After Redemption:</div>
                    <div className="text-gray-300">
                      Collateral: {parseFloat(redemption.currentState.collateral).toFixed(4)} CDCETH
                    </div>
                    <div className="text-gray-300">
                      Debt: {parseFloat(redemption.currentState.debt).toFixed(4)} USC
                    </div>
                  </div>

                  <div className="bg-gray-800/50 p-3 rounded break-words">
                    <div className="font-medium text-white mb-2">Impact:</div>
                    <div className="text-gray-300">
                      Collateral Redeemed: {(parseFloat(redemption.previousState.collateral) - parseFloat(redemption.currentState.collateral)).toFixed(4)} CDCETH
                    </div>
                    <div className="text-gray-300">
                      Debt Reduced: {(parseFloat(redemption.previousState.debt) - parseFloat(redemption.currentState.debt)).toFixed(4)} USC
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-3 bg-yellow-900/20 border-l-4 border-yellow-600 rounded break-words">
                  <p className="text-yellow-200">Previous state data not available</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}