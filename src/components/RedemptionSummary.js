export default function RedemptionSummary({ events }) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-white">Redemption Summary</h2>
        {events.length === 0 ? (
          <p className="text-gray-300">No redemptions found for this address</p>
        ) : (
          <div className="space-y-6">
            {events.map((redemption, index) => {
              const date = new Date(redemption.timestamp * 1000).toLocaleString();
              const hasValidPreviousState = redemption.previousState && 
                !redemption.previousState.note && 
                redemption.previousState.txHash !== 'Unknown' && 
                redemption.previousState.txHash !== 'Error';
  
              return (
                <div key={index} className="border-l-4 border-green-500 pl-4">
                  <div className="font-semibold text-white">
                    {parseFloat(redemption.collateral) === 0 && parseFloat(redemption.debt) === 0 
                      ? 'FULL' 
                      : 'PARTIAL'} Redemption
                  </div>
                  <div className="text-sm text-gray-300">
                    Time: {date}
                  </div>
                  <div className="text-sm text-gray-300">
                    Tx: <a 
                      href={`https://cronoscan.com/tx/${redemption.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      {redemption.txHash}
                    </a>
                  </div>
                  
                  {hasValidPreviousState ? (
                    <div className="mt-2">
                      <div className="font-medium text-white mb-2">
                        State of Trove prior to {events.length > 1 ? `${index + 1}${getSuffix(index + 1)}` : ''} redemption:
                      </div>
                      {redemption.previousState.source === 'trove-lifecycle' && (
                        <div className="text-xs text-yellow-400 mb-2 italic">
                          No events found prior to redemption, using lifecycle transaction that is closest to redemption date
                        </div>
                      )}
                      <div className="bg-gray-700/50 p-3 rounded border-l-4 border-blue-500">
                        <div className="text-gray-200">
                          Collateral: {parseFloat(redemption.previousState.collateral).toFixed(4)} CDCETH
                        </div>
                        <div className="text-gray-200">
                          Debt: {parseFloat(redemption.previousState.debt).toFixed(4)} USC
                        </div>
                        <div className="text-sm text-gray-300">
                          Tx: <a 
                            href={`https://cronoscan.com/tx/${redemption.previousState.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 hover:underline"
                          >
                            {redemption.previousState.txHash}
                          </a>
                        </div>
                      </div>
                      
                      <div className="font-medium text-white mt-4 mb-2">After Redemption:</div>
                      <div className="text-gray-200">
                        Collateral: {parseFloat(redemption.collateral).toFixed(4)} CDCETH
                      </div>
                      <div className="text-gray-200">
                        Debt: {parseFloat(redemption.debt).toFixed(4)} USC
                      </div>
  
                      <div className="mt-4 bg-gray-700/30 p-3 rounded">
                        <h4 className="font-medium text-white mb-2">Impact:</h4>
                        <div className="text-gray-200">
                          Collateral Redeemed: {(parseFloat(redemption.previousState.collateral) - parseFloat(redemption.collateral)).toFixed(4)} CDCETH
                        </div>
                        <div className="text-gray-200">
                          Debt Reduced: {(parseFloat(redemption.previousState.debt) - parseFloat(redemption.debt)).toFixed(4)} USC
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 p-3 bg-yellow-900/20 border-l-4 border-yellow-600 rounded">
                      <p className="text-yellow-200">
                        Previous state data is not available for this redemption. This can happen if:
                      </p>
                      <ul className="list-disc list-inside mt-2 text-yellow-100 text-sm">
                        <li>The redemption occurred in the same block as another transaction</li>
                        <li>The data is too old or has been pruned</li>
                        <li>There was an issue retrieving the historical data</li>
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  
  function getSuffix(num) {
    if (num >= 11 && num <= 13) return 'th';
    switch (num % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }