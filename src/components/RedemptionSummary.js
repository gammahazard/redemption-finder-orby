export default function RedemptionSummary({ events }) {
    const calculateRedemptionImpact = (previousState, currentState) => {
      const collateralLost = parseFloat(previousState.collateral) - parseFloat(currentState.collateral);
      const debtReduced = parseFloat(previousState.debt) - parseFloat(currentState.debt);
      const isFullRedemption = parseFloat(currentState.collateral) === 0 && parseFloat(currentState.debt) === 0;
      
      return {
        collateralLost,
        debtReduced,
        isFullRedemption
      };
    };
  
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-white">Redemption Summary</h2>
        {events.length === 0 ? (
          <p className="text-gray-300">No redemptions found for this address</p>
        ) : (
          <div className="space-y-6">
            {events.map((redemption, index) => {
              const date = new Date(redemption.timestamp * 1000).toLocaleString();
              const impact = redemption.previousState ? 
                calculateRedemptionImpact(redemption.previousState, redemption) :
                null;
  
              return (
                <div key={index} className="border-l-4 border-green-500 pl-4">
                  <div className="font-semibold text-white">
                    {impact?.isFullRedemption ? 'FULL' : 'PARTIAL'} Redemption
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
                  
                  {redemption.previousState && (
                    <div className="mt-2">
                      <div className="font-medium text-white mb-2">
                        State of Trove prior to {events.length > 1 ? `${index + 1}${getSuffix(index + 1)}` : ''} redemption:
                      </div>
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
                          Collateral Redeemed: {impact.collateralLost.toFixed(4)} CDCETH
                        </div>
                        <div className="text-gray-200">
                          Debt Reduced: {impact.debtReduced.toFixed(4)} USC
                        </div>
                        <div className="text-gray-200">
                          Average Rate: {(impact.debtReduced / impact.collateralLost).toFixed(2)} USC/CDCETH
                        </div>
                      </div>
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