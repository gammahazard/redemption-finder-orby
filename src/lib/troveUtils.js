import { Web3 } from 'web3';
import axios from 'axios';

const web3 = new Web3();
const REDEMPTION_CONTRACT = '0x7A47cF15a1fCbAd09c66077d1D021430eed7AC65';
const TROVE_MANAGER = '0x80d32B0FE29A56dd4b6eD5BdcfD2D488db4878fb';
const CDCETH_TOKEN = '0x7a7c9db510aB29A2FC362a4c34260BEcB5cE3446;'; // Replace with actual CDCETH token address
const TROVE_UPDATED_TOPIC = '0xc3770d654ed33aeea6bf11ac8ef05d02a6a04ed4686dd2f624d853bbec43cc8b';
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

//rate limit protection
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
//find all trove events for user
export async function findAllTroveEvents(address) {
  try {
    await delay(1000);
    const response = await axios.get('https://api.cronoscan.com/api', {
      params: {
        module: 'logs',
        action: 'getLogs',
        fromBlock: 0,
        toBlock: 'latest',
        address: TROVE_MANAGER,
        topic0: TROVE_UPDATED_TOPIC,
        topic1: '0x000000000000000000000000' + address.slice(2),
        apikey: process.env.CRONOSCAN_API_KEY
      }
    });

    if (!response.data.result || !Array.isArray(response.data.result)) {
      console.warn('No trove events found or invalid response');
      return [];
    }

    return response.data.result.map(log => {
      const decodedData = web3.eth.abi.decodeParameters(
        ['uint256', 'uint256', 'uint256', 'uint8'],
        log.data
      );
//look for trove updated events (operation 3)
      return {
        txHash: log.transactionHash,
        blockNumber: parseInt(log.blockNumber, 16),
        timestamp: parseInt(log.timeStamp, 16),
        debt: web3.utils.fromWei(decodedData[0], 'ether'),
        collateral: web3.utils.fromWei(decodedData[1], 'ether'),
        operation: parseInt(decodedData[3])
      };
    });
  } catch (error) {
    console.error('Error finding trove events:', error);
    return [];
  }
}
//find redemption events associated with address
export async function findRedemptionEvents(address) {
  try {
    await delay(1000);
    const response = await axios.get('https://api.cronoscan.com/api', {
      params: {
        module: 'logs',
        action: 'getLogs',
        fromBlock: 0,
        toBlock: 'latest',
        address: REDEMPTION_CONTRACT,
        topic0: TROVE_UPDATED_TOPIC,
        topic1: '0x000000000000000000000000' + address.slice(2),
        apikey: process.env.CRONOSCAN_API_KEY
      }
    });

    if (!response.data.result || !Array.isArray(response.data.result)) {
      console.warn('No redemption events found or invalid response');
      return [];
    }

    const events = response.data.result.map(log => {
      const decodedData = web3.eth.abi.decodeParameters(
        ['uint256', 'uint256', 'uint256', 'uint8'],
        log.data
      );

      return {
        txHash: log.transactionHash,
        blockNumber: parseInt(log.blockNumber, 16),
        timestamp: parseInt(log.timeStamp, 16),
        debt: web3.utils.fromWei(decodedData[0], 'ether'),
        collateral: web3.utils.fromWei(decodedData[1], 'ether'),
        operation: parseInt(decodedData[3])
      };
    });

    return events.filter(e => e.operation === 3);
  } catch (error) {
    console.error('Error finding redemption events:', error);
    return [];
  }
}
//find previous trove state, 
export async function findPreviousTroveState(address, blockNumber, allTroveEvents = [], attempt = 0, maxRetries = 3) {
    try {
      console.log(`Attempting to find previous state for block ${blockNumber} (Attempt ${attempt + 1}/${maxRetries + 1})`);
  
      // First attempt: Look for events right before the redemption
      await delay(1000);
      const response = await axios.get('https://api.cronoscan.com/api', {
        params: {
          module: 'logs',
          action: 'getLogs',
          fromBlock: 0,
          toBlock: blockNumber - 1,
          address: TROVE_MANAGER,
          topic0: TROVE_UPDATED_TOPIC,
          topic1: '0x000000000000000000000000' + address.slice(2),
          apikey: process.env.CRONOSCAN_API_KEY
        }
      });
  
      if (response.data.result && Array.isArray(response.data.result) && response.data.result.length > 0) {
        const sortedLogs = response.data.result.sort((a, b) => 
          parseInt(b.blockNumber, 16) - parseInt(a.blockNumber, 16)
        );
  
        const mostRecent = sortedLogs[0];
        const decodedData = web3.eth.abi.decodeParameters(
          ['uint256', 'uint256', 'uint256', 'uint8'],
          mostRecent.data
        );
  
        console.log(`Successfully found previous state via API for block ${blockNumber} on attempt ${attempt + 1}`);
        return {
          txHash: mostRecent.transactionHash,
          blockNumber: parseInt(mostRecent.blockNumber, 16),
          timestamp: parseInt(mostRecent.timeStamp, 16),
          debt: web3.utils.fromWei(decodedData[0], 'ether'),
          collateral: web3.utils.fromWei(decodedData[1], 'ether')
        };
      }
  
      // if no tx found: Use the closest transaction to the redemption found in the trove lifecycle events
      if (allTroveEvents.length > 0) {
        // Find the most recent event before the redemption
        const previousEvents = allTroveEvents
          .filter(event => event.blockNumber < blockNumber)
          .sort((a, b) => b.timestamp - a.timestamp);
  
        if (previousEvents.length > 0) {
          const mostRecentEvent = previousEvents[0];
          console.log(`Found previous state via trove lifecycle events for block ${blockNumber} on attempt ${attempt + 1}`);
          return {
            txHash: mostRecentEvent.txHash,
            blockNumber: mostRecentEvent.blockNumber,
            timestamp: mostRecentEvent.timestamp,
            debt: mostRecentEvent.debt,
            collateral: mostRecentEvent.collateral,
            source: 'trove-lifecycle'
          };
        }
      }
  
      // If we still haven't found the state and haven't hit max retries, try again
      if (attempt < maxRetries) {
        console.log(`No state found on attempt ${attempt + 1}, retrying...`);
        await delay(2000); // Longer delay between retries
        return findPreviousTroveState(address, blockNumber, allTroveEvents, attempt + 1, maxRetries);
      }
  
      console.warn(`No previous state found for block ${blockNumber} after ${attempt + 1} attempts using either method`);
      return null;
  
    } catch (error) {
      console.error(`Error finding previous state on attempt ${attempt + 1}:`, error);
      
      // Retry on error if we haven't hit max retries
      if (attempt < maxRetries) {
        console.log(`Error on attempt ${attempt + 1}, retrying...`);
        await delay(2000);
        return findPreviousTroveState(address, blockNumber, allTroveEvents, attempt + 1, maxRetries);
      }
      
      return null;
    }
  }

export async function getRecentRedemptions(limit = 50, onProgress, signal, startFromIndex = -1) {
    const web3 = new Web3();
    let existingEvents = [];

    try {
      // Load existing events if resuming
      if (startFromIndex >= 0) {
        const savedResults = sessionStorage.getItem('redemptionResults');
        if (savedResults) {
          const { redemptions } = JSON.parse(savedResults);
          existingEvents = redemptions;
        }
      }

      // Early abort check
      if (signal?.aborted) {
        return existingEvents;
      }

      await delay(2000);

      let response;
      try {
        response = await axios.get('https://api.cronoscan.com/api', {
          params: {
            module: 'logs',
            action: 'getLogs',
            fromBlock: 0,
            toBlock: 'latest',
            address: REDEMPTION_CONTRACT,
            topic0: TROVE_UPDATED_TOPIC,
            apikey: process.env.NEXT_PUBLIC_CRONOSCAN_API_KEY
          },
          signal
        });
      } catch (err) {
        if (axios.isCancel(err)) {
          return existingEvents;
        }
        throw err;
      }
  
      if (!response.data.result || !Array.isArray(response.data.result)) {
        console.warn('No redemption events found or invalid response');
        return existingEvents;
      }
  
      const allLogs = response.data.result.sort((a, b) => 
        parseInt(b.timeStamp, 16) - parseInt(a.timeStamp, 16)
      );
  
      const logsToProcess = startFromIndex >= 0 ? 
        allLogs.slice(startFromIndex + 1) : 
        allLogs;

      // Don't send progress if already aborted
      if (!signal?.aborted) {
        onProgress({ 
          type: 'TOTAL_FOUND', 
          total: allLogs.length,
          message: startFromIndex >= 0 ? 
            `Resuming search from event ${startFromIndex + 1} of ${allLogs.length}...` :
            `Found ${allLogs.length} potential redemption events. Processing...`
        });
      }
  
      for (const [index, log] of logsToProcess.entries()) {
        // Check abort before processing each event
        if (signal?.aborted) {
          return existingEvents;
        }

        await delay(2000);
  
        const decodedData = web3.eth.abi.decodeParameters(
          ['uint256', 'uint256', 'uint256', 'uint8'],
          log.data
        );
  
        // Skip non-redemption operations
        if (parseInt(decodedData[3]) !== 3) {
          if (!signal?.aborted) {
            const currentProgress = startFromIndex + index + 2;
            onProgress({ 
              type: 'PROCESSING', 
              current: currentProgress,
              total: allLogs.length,
              message: `Processing event ${currentProgress} of ${allLogs.length}...`
            });
          }
          continue;
        }
  
        const address = '0x' + log.topics[1].slice(26);
        const blockNumber = parseInt(log.blockNumber, 16);
  
        const currentProgress = startFromIndex + index + 2;
        
        // Only send progress if not aborted
        if (!signal?.aborted) {
          onProgress({ 
            type: 'PROCESSING', 
            current: currentProgress,
            total: allLogs.length,
            message: `Processing event ${currentProgress} of ${allLogs.length}...`
          });
        }

        if (signal?.aborted) {
          return existingEvents;
        }

        const prevState = await findPreviousTroveState(
          address, 
          blockNumber,
          []
        );
  
        if (signal?.aborted) {
          return existingEvents;
        }

        await delay(2000);
        let transferResponse;
        try {
          transferResponse = await axios.get('https://api.cronoscan.com/api', {
            params: {
              module: 'logs',
              action: 'getLogs',
              fromBlock: log.blockNumber,
              toBlock: log.blockNumber,
              address: CDCETH_TOKEN,
              topic0: TRANSFER_TOPIC,
              txhash: log.transactionHash,
              apikey: process.env.NEXT_PUBLIC_CRONOSCAN_API_KEY
            },
            signal
          });
        } catch (err) {
          if (axios.isCancel(err)) {
            return existingEvents;
          }
          throw err;
        }
  
        // Process transfer response...
        let redeemer = null;
        if (transferResponse.data.result && Array.isArray(transferResponse.data.result)) {
          const lastTransfer = transferResponse.data.result[transferResponse.data.result.length - 1];
          if (lastTransfer && lastTransfer.topics.length >= 3) {
            redeemer = '0x' + lastTransfer.topics[2].slice(26);
          }
        }
  
        const currentState = {
          debt: web3.utils.fromWei(decodedData[0], 'ether'),
          collateral: web3.utils.fromWei(decodedData[1], 'ether')
        };
  
        const event = {
          id: `${log.transactionHash}-${currentProgress}`,
          txHash: log.transactionHash,
          blockNumber: blockNumber,
          timestamp: parseInt(log.timeStamp, 16),
          address: address,
          redeemer: redeemer,
          currentState,
          previousState: prevState,
          operation: parseInt(decodedData[3])
        };
  
        const processedEvent = {
          ...event,
          amountRedeemed: event.previousState ? {
            collateral: parseFloat(event.previousState.collateral) - parseFloat(event.currentState.collateral),
            debt: parseFloat(event.previousState.debt) - parseFloat(event.currentState.debt)
          } : null
        };
  
        existingEvents.push(processedEvent);
        
        // Only send progress if not aborted
        if (!signal?.aborted) {
          onProgress({ 
            type: 'NEW_EVENT', 
            events: existingEvents.slice(0, limit),
            current: currentProgress,
            total: allLogs.length,
            message: `Found ${existingEvents.length} redemption events so far...`
          });
        }

        if (existingEvents.length >= limit) {
          break;
        }
      }
  
      // Only send complete if not aborted
      if (!signal?.aborted) {
        const finalEvents = existingEvents.slice(0, limit);
        onProgress({ 
          type: 'COMPLETE', 
          events: finalEvents,
          message: `Processing complete. Found ${existingEvents.length} redemption events.`
        });
        return finalEvents;
      }
  
      return existingEvents;
  
    } catch (error) {
      if (error.name === 'AbortError' || axios.isCancel(error)) {
        return existingEvents;
      }
      console.error('Error finding recent redemptions:', error);
      throw error;
    }
}