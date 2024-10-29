import { Web3 } from 'web3';
import axios from 'axios';

const web3 = new Web3();
//contract info
const REDEMPTION_CONTRACT = '0x7A47cF15a1fCbAd09c66077d1D021430eed7AC65';
const TROVE_MANAGER = '0x80d32B0FE29A56dd4b6eD5BdcfD2D488db4878fb';
const TROVE_UPDATED_TOPIC = '0xc3770d654ed33aeea6bf11ac8ef05d02a6a04ed4686dd2f624d853bbec43cc8b';
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
export async function findPreviousTroveState(address, blockNumber, allTroveEvents = []) {
  try {
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

      return {
        txHash: mostRecent.transactionHash,
        blockNumber: parseInt(mostRecent.blockNumber, 16),
        timestamp: parseInt(mostRecent.timeStamp, 16),
        debt: web3.utils.fromWei(decodedData[0], 'ether'),
        collateral: web3.utils.fromWei(decodedData[1], 'ether')
      };
    }

    // if no tx found: Use the closest transaction to the redemption found in the trove lifecycle events we already have
    if (allTroveEvents.length > 0) {
      // Find the most recent event before the redemption
      const previousEvents = allTroveEvents
        .filter(event => event.blockNumber < blockNumber)
        .sort((a, b) => b.timestamp - a.timestamp);

      if (previousEvents.length > 0) {
        const mostRecentEvent = previousEvents[0];
        return {
          txHash: mostRecentEvent.txHash,
          blockNumber: mostRecentEvent.blockNumber,
          timestamp: mostRecentEvent.timestamp,
          debt: mostRecentEvent.debt,
          collateral: mostRecentEvent.collateral,
          source: 'trove-lifecycle' // Adding this to track where the data came from
        };
      }
    }

    console.warn(`No previous state found for block ${blockNumber} using either method`);
    return null;
  } catch (error) {
    console.error('Error finding previous state:', error);
    return null;
  }
}