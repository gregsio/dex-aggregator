// ContractsContext.js
import React, { createContext, useCallback, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useDispatch } from 'react-redux'

import DAI_ABI from '../abis/Dai.json';
import WETH_ABI from '../abis/Weth.json';
import AGGREGATOR_ABI from '../abis/Aggregator.json';
import config from '../config.json';


import {
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
//   fetchTokens,
//   loadAggregator
} from '../store/interactions'


export const ContractsContext = createContext();

export function ContractsProvider({ children })  {

  const [contracts, setContracts] = useState({});
  const dispatch = useDispatch()


  const fetchBlockChainData =  useCallback(async () => {
    // Initiate provider
    const provider = new ethers.BrowserProvider(window.ethereum);
    console.log('fetchBlockChainData/provider', provider)
    loadProvider(provider, dispatch)

    // Fetch current network's chainId (e.g. hardhat: 31337, kovan: 42)
    const chainId = await loadNetwork(provider, dispatch)

    // Reload page when network changes
    window.ethereum.on('chainChanged', () => {
    window.location.reload()
    })

    // Fetch current account from Metamask when changed
    window.ethereum.on('accountsChanged', async () => {
    await loadAccount(dispatch)
    })

    const contractInstances = {
        aggregator: new ethers.Contract(config[chainId].aggregator.address, AGGREGATOR_ABI, provider),
        dai: new ethers.Contract(config[chainId].weth.address, DAI_ABI, provider),
        weth: new ethers.Contract(config[chainId].dai.address, WETH_ABI, provider)
    }

    await loadTokens([contractInstances.dai, contractInstances.weth],dispatch)

    return contractInstances

    },[dispatch])

  useEffect( () => {
    fetchBlockChainData().then(contracts => {
        setContracts(contracts);
        console.log('contracts',contracts)
      });
}, [fetchBlockChainData]);

  return (
    <ContractsContext.Provider value={contracts}>
      {children}
    </ContractsContext.Provider>
  );
}
