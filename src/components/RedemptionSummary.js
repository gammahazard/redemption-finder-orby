export default function RedemptionSummary({ events }) {
    const calculateImpact = (redemption, previousState) => {
      console.log(`\n==== Calculating Impact for Redemption ${redemption.txHash} ====`);
      console.log('Previous State:', {
        txHash: previousState.txHash,
        collateral: previousState.collateral,
        debt: previousState.debt,
        source: previousState.source
      });
      console.log('After Redemption:', {
        txHash: redemption.txHash,
        collateral: redemption.collateral,
        debt: redemption.debt
      });

      const collateralRedeemed = Math.abs(parseFloat(previousState.collateral) - parseFloat(redemption.collateral));
      const debtReduced = Math.abs(parseFloat(previousState.debt) - parseFloat(redemption.debt));
  
      console.log('Calculated Impact:', {
        collateralRedeemed,
        debtReduced,
        calculation: `${previousState.collateral} - ${redemption.collateral} = ${collateralRedeemed} CDCETH`,
        debtCalculation: `${previousState.debt} - ${redemption.debt} = ${debtReduced} USC`
      });
  
      return { collateralRedeemed, debtReduced };
    };
    const formatDate = (timestamp) => {
        const date = new Date(timestamp * 1000);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getUTCMonth()];
        const day = date.getUTCDate().toString().padStart(2, '0');
        const year = date.getUTCFullYear();
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const seconds = date.getUTCSeconds().toString().padStart(2, '0');

        return `${month}-${day}-${year} ${hours}:${minutes}:${seconds} UTC`;
    };
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-white">Redemption Summary</h2>
        {events.length === 0 ? (
          <p className="text-gray-300">No redemptions found for this address</p>
        ) : (
          <div className="space-y-6">
            {events.map((redemption, index) => {
              console.log(`\n==== Processing Redemption ${index + 1} ====`);
              console.log('Redemption:', {
                txHash: redemption.txHash,
                blockNumber: redemption.blockNumber,
                timestamp: redemption.timestamp
              });
              
              if (redemption.previousState) {
                console.log('Found Previous State:', {
                  txHash: redemption.previousState.txHash,
                  blockNumber: redemption.previousState.blockNumber,
                  source: redemption.previousState.source
                });
              } else {
                console.log('No previous state found for this redemption');
              }
  
              const date = new Date(redemption.timestamp * 1000).toLocaleString();
              const impacts = redemption.previousState ? calculateImpact(redemption, redemption.previousState) : null;
  
              return (
                <div key={index} className="border-l-4 border-green-500 pl-4">
                  <div className="font-semibold text-white">
                    {parseFloat(redemption.collateral) === 0 && parseFloat(redemption.debt) === 0 
                      ? 'FULL' 
                      : 'PARTIAL'} Redemption
                  </div>
                  <div className="text-sm text-gray-300">
            Time: {formatDate(redemption.timestamp)}
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
                  
                  {redemption.previousState ? (
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
  
                      {impacts && (
                        <div className="mt-4 bg-gray-700/30 p-3 rounded">
                          <h4 className="font-medium text-white mb-2">Impact:</h4>
                          <div className="text-gray-200">
                            Collateral Redeemed: {impacts.collateralRedeemed.toFixed(4)} CDCETH
                          </div>
                          <div className="text-gray-200">
                            Debt Reduced: {impacts.debtReduced.toFixed(4)} USC
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 p-3 bg-red-900/20 border-l-4 border-red-600 rounded">
                      <p className="text-red-200">
                        Error: Failed to retrieve trove state for this redemption. This should not happen.
                      </p>
                      <p className="text-red-200 text-sm mt-2">
                        Please report this issue: Block {redemption.blockNumber}, Tx {redemption.txHash}
                      </p>
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