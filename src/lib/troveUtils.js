
import { Web3 } from 'web3';
import axios from 'axios';

const web3 = new Web3();

const REDEMPTION_CONTRACT = '0x7A47cF15a1fCbAd09c66077d1D021430eed7AC65';
const TROVE_MANAGER = '0x80d32B0FE29A56dd4b6eD5BdcfD2D488db4878fb';
const TROVE_UPDATED_TOPIC = '0xc3770d654ed33aeea6bf11ac8ef05d02a6a04ed4686dd2f624d853bbec43cc8b';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

    return response.data.result.map(log => {
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
  } catch (error) {
    console.error('Error finding trove events:', error);
    return [];
  }
}

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

export async function findPreviousTroveState(address, blockNumber) {
  try {
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

    if (!response.data.result || response.data.result.length === 0) {
      return null;
    }

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
  } catch (error) {
    console.error('Error finding previous state:', error);
    return null;
  }
}