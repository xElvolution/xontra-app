// Somnia-specific blockchain data fetching
// Focused only on Somnia Mainnet and Testnet
// Renamed from etherscan.ts to focus only on Somnia chains

export interface TokenBalance {
  contractAddress: string
  tokenSymbol: string
  tokenName: string
  tokenDecimal: string
  balance: string
  usdValue?: number
  chainId: number
  chainName: string
  logoUrl?: string
}

export interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  gas: string
  gasPrice: string
  gasUsed: string
  timeStamp: string
  blockNumber: string
  isError: string
  txreceipt_status: string
  methodId: string
  functionName: string
}

// Somnia chain configurations
const SOMNIA_CHAINS = {
  5031: { // Somnia Mainnet
    baseUrl: 'https://shannon-explorer.somnia.network/api',
    name: 'Somnia Mainnet',
    rpcUrl: 'https://api.infra.mainnet.somnia.network',
    nativeCurrency: 'SOMI'
  },
  50312: { // Somnia Testnet
    baseUrl: 'https://shannon-explorer.somnia.network/api',
    name: 'Somnia Testnet',
    rpcUrl: 'https://dream-rpc.somnia.network',
    nativeCurrency: 'STT'
  }
}

// Get recent transactions for an address on Somnia
export async function getRecentTransactions(address: string, page = 1, offset = 20, chainId?: number): Promise<Transaction[]> {
  if (!chainId || !SOMNIA_CHAINS[chainId as keyof typeof SOMNIA_CHAINS]) {
    console.log(`Chain ${chainId} not supported. Only Somnia chains are supported.`)
    return []
  }

  const chain = SOMNIA_CHAINS[chainId as keyof typeof SOMNIA_CHAINS]
  
  // Try Somnia Explorer API first
  try {
    console.log(`Trying Somnia Explorer API for ${address} on ${chain.name}`)
    
    const explorerResponse = await fetch(
      `${chain.baseUrl}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc`
    )
    const explorerData = await explorerResponse.json()
    
    console.log('Explorer API response:', explorerData)
    
    if (explorerData.status === '1' && explorerData.result && explorerData.result.length > 0) {
      console.log(`Found ${explorerData.result.length} transactions from Somnia Explorer`)
      return explorerData.result.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gas: tx.gas,
        gasPrice: tx.gasPrice,
        gasUsed: tx.gasUsed,
        timeStamp: tx.timeStamp,
        blockNumber: tx.blockNumber,
        isError: tx.isError,
        txreceipt_status: tx.txreceipt_status,
        methodId: tx.methodId,
        functionName: tx.functionName || 'Transfer'
      }))
    } else {
      console.log('No transactions found from Explorer API, trying RPC...')
    }
  } catch (explorerError) {
    console.log('Somnia Explorer API not available, falling back to RPC:', explorerError)
  }
  
  // Fallback to RPC calls
  return await getSomniaTransactions(address, chainId, offset)
}

// Get transactions from Somnia using RPC calls
async function getSomniaTransactions(address: string, chainId: number, limit: number = 100): Promise<Transaction[]> {
  const chain = SOMNIA_CHAINS[chainId as keyof typeof SOMNIA_CHAINS]
  if (!chain) {
    console.log('No RPC URL for Somnia chain', chainId)
    return []
  }

  console.log(`Fetching Somnia transactions for ${address} on chain ${chainId}`)

  try {
    // Get latest block number
    const latestBlockResponse = await fetch(chain.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    })
    const latestBlockData = await latestBlockResponse.json()
    const latestBlockNumber = parseInt(latestBlockData.result, 16)
    
    console.log(`Latest block: ${latestBlockNumber}`)

    // Check recent blocks first for most recent transactions
    const transactions: Transaction[] = []
    const recentBlocks = Math.min(500, latestBlockNumber) // Check last 500 blocks for more transactions
    
    console.log(`Checking last ${recentBlocks} blocks for recent transactions`)
    console.log(`Searching from block ${latestBlockNumber} down to ${latestBlockNumber - recentBlocks}`)
    
    // Check recent blocks first for most recent transactions
    for (let blockNum = latestBlockNumber; blockNum > latestBlockNumber - recentBlocks && transactions.length < limit; blockNum--) {
      try {
        const blockResponse = await fetch(chain.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBlockByNumber',
            params: [`0x${blockNum.toString(16)}`, true],
            id: blockNum
          })
        })
        
        const blockData = await blockResponse.json()
        if (!blockData.result) continue
        
        const block = blockData.result
        const blockTimestamp = parseInt(block.timestamp, 16)
        
        // Filter transactions involving our address
        const relevantTxs = block.transactions.filter((tx: any) => 
          tx.from?.toLowerCase() === address.toLowerCase() || 
          tx.to?.toLowerCase() === address.toLowerCase()
        )
        
        if (relevantTxs.length > 0) {
          console.log(`Block ${block.number}: Found ${relevantTxs.length} relevant transactions`)
        }
        
        for (const tx of relevantTxs) {
          if (transactions.length >= limit) break
          
          // Get transaction receipt for gas used and status
          try {
            const receiptResponse = await fetch(chain.rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getTransactionReceipt',
                params: [tx.hash],
                id: 1
              })
            })
            
            const receiptData = await receiptResponse.json()
            const receipt = receiptData.result
            
            // Determine transaction type based on input data
            let functionName = 'Transfer'
            if (tx.input && tx.input !== '0x' && tx.input.length > 2) {
              if (tx.input.startsWith('0xa9059cbb')) functionName = 'Transfer'
              else if (tx.input.startsWith('0x095ea7b3')) functionName = 'Approve'
              else if (tx.input.startsWith('0x7ff36ab5') || tx.input.startsWith('0x38ed1739')) functionName = 'Swap'
              else if (tx.input.startsWith('0x')) functionName = 'Contract Interaction'
            } else if (tx.value && tx.value !== '0x0' && tx.value !== '0x') {
              functionName = 'Transfer'
            }
            
            const transaction: Transaction = {
              hash: tx.hash,
              from: tx.from || '',
              to: tx.to || '',
              value: tx.value || '0',
              gas: tx.gas || '0',
              gasPrice: tx.gasPrice || '0',
              gasUsed: receipt?.gasUsed || '0',
              timeStamp: Math.floor(blockTimestamp).toString(),
              blockNumber: block.number,
              isError: receipt?.status === '0x0' ? '1' : '0',
              txreceipt_status: receipt?.status || '0x1',
              methodId: tx.input?.slice(0, 10) || '0x',
              functionName
            }
            
            transactions.push(transaction)
            console.log(`Added recent transaction: ${tx.hash.slice(0, 10)}... (${functionName}) from block ${block.number}`)
          } catch (receiptError) {
            console.error(`Error fetching receipt for ${tx.hash}:`, receiptError)
            // Add transaction without receipt data
            transactions.push({
              hash: tx.hash,
              from: tx.from || '',
              to: tx.to || '',
              value: tx.value || '0',
              gas: tx.gas || '0',
              gasPrice: tx.gasPrice || '0',
              gasUsed: '0',
              timeStamp: Math.floor(blockTimestamp).toString(),
              blockNumber: block.number,
              isError: '0',
              txreceipt_status: '0x1',
              methodId: tx.input?.slice(0, 10) || '0x',
              functionName: 'Transfer'
            })
          }
        }
      } catch (blockError) {
        console.error(`Error fetching block ${blockNum}:`, blockError)
        continue
      }
    }
    
    // If we found recent transactions, return them
    if (transactions.length > 0) {
      console.log(`Found ${transactions.length} recent transactions`)
      return transactions.sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp))
    }
    
    console.log('No recent transactions found, trying logs method...')

    // Try to get logs for this address to find transaction hashes more efficiently
    const fromBlock = Math.max(0, latestBlockNumber - 1000) // Search last 1000 blocks for more transactions
    
    try {
      // Get logs for this address to find transaction hashes
      const logsResponse = await fetch(chain.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getLogs',
          params: [{
            fromBlock: `0x${fromBlock.toString(16)}`,
            toBlock: 'latest',
            address: address
          }],
          id: 1
        })
      })
      
      const logsData = await logsResponse.json()
      if (logsData.result && logsData.result.length > 0) {
        console.log(`Found ${logsData.result.length} logs for address`)
        
        // Get unique transaction hashes from logs
        const txHashes = [...new Set(logsData.result.map((log: any) => log.transactionHash))]
        console.log(`Found ${txHashes.length} unique transaction hashes`)
        
        // Fetch transaction details for each hash
        for (const txHash of txHashes.slice(0, limit)) {
          try {
            const txResponse = await fetch(chain.rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getTransactionByHash',
                params: [txHash],
                id: 1
              })
            })
            
            const txData = await txResponse.json()
            if (!txData.result) continue
            
            const tx = txData.result
            
            // Get transaction receipt
            const receiptResponse = await fetch(chain.rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getTransactionReceipt',
                params: [txHash],
                id: 1
              })
            })
            
            const receiptData = await receiptResponse.json()
            const receipt = receiptData.result
            
            // Get block info for timestamp
            const blockResponse = await fetch(chain.rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getBlockByNumber',
                params: [tx.blockNumber, false],
                id: 1
              })
            })
            
            const blockData = await blockResponse.json()
            const blockTimestamp = parseInt(blockData.result?.timestamp || '0', 16)
            
            // Determine transaction type
            let functionName = 'Transfer'
            if (tx.input && tx.input !== '0x' && tx.input.length > 2) {
              if (tx.input.startsWith('0xa9059cbb')) functionName = 'Transfer'
              else if (tx.input.startsWith('0x095ea7b3')) functionName = 'Approve'
              else if (tx.input.startsWith('0x7ff36ab5') || tx.input.startsWith('0x38ed1739')) functionName = 'Swap'
              else if (tx.input.startsWith('0x')) functionName = 'Contract Interaction'
            } else if (tx.value && tx.value !== '0x0' && tx.value !== '0x') {
              functionName = 'Transfer'
            }
            
            transactions.push({
              hash: tx.hash,
              from: tx.from || '',
              to: tx.to || '',
              value: tx.value || '0',
              gas: tx.gas || '0',
              gasPrice: tx.gasPrice || '0',
              gasUsed: receipt?.gasUsed || '0',
              timeStamp: Math.floor(blockTimestamp).toString(),
              blockNumber: tx.blockNumber,
              isError: receipt?.status === '0x0' ? '1' : '0',
              txreceipt_status: receipt?.status || '0x1',
              methodId: tx.input?.slice(0, 10) || '0x',
              functionName
            })
            
            console.log(`Added transaction: ${tx.hash.slice(0, 10)}... (${functionName})`)
          } catch (txError) {
            console.error(`Error fetching transaction ${txHash}:`, txError)
            continue
          }
        }
        
        // Sort by timestamp (newest first)
        return transactions.sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp))
      }
    } catch (logsError) {
      console.log('Logs method failed, falling back to block scanning:', logsError)
    }

    // Fallback: Search through recent blocks for transactions involving this address
    const searchBlocks = Math.min(100, latestBlockNumber) // Search last 100 blocks (more recent)
    
    // Process blocks one by one to avoid overwhelming the RPC
    for (let blockNum = latestBlockNumber; blockNum > latestBlockNumber - searchBlocks && transactions.length < limit; blockNum--) {
      try {
        const blockResponse = await fetch(chain.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBlockByNumber',
            params: [`0x${blockNum.toString(16)}`, true],
            id: blockNum
          })
        })
        
        const blockData = await blockResponse.json()
        if (!blockData.result) continue
        
        const block = blockData.result
        const blockTimestamp = parseInt(block.timestamp, 16)
        
        // Filter transactions involving our address
        const relevantTxs = block.transactions.filter((tx: any) => 
          tx.from?.toLowerCase() === address.toLowerCase() || 
          tx.to?.toLowerCase() === address.toLowerCase()
        )
        
        if (relevantTxs.length > 0) {
          console.log(`Block ${block.number}: Found ${relevantTxs.length} relevant transactions`)
        }
        
        for (const tx of relevantTxs) {
          if (transactions.length >= limit) break
          
          // Get transaction receipt for gas used and status
          try {
            const receiptResponse = await fetch(chain.rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_getTransactionReceipt',
                params: [tx.hash],
                id: 1
              })
            })
            
            const receiptData = await receiptResponse.json()
            const receipt = receiptData.result
            
            // Determine transaction type based on input data
            let functionName = 'Transfer'
            if (tx.input && tx.input !== '0x' && tx.input.length > 2) {
              if (tx.input.startsWith('0xa9059cbb')) functionName = 'Transfer'
              else if (tx.input.startsWith('0x095ea7b3')) functionName = 'Approve'
              else if (tx.input.startsWith('0x7ff36ab5') || tx.input.startsWith('0x38ed1739')) functionName = 'Swap'
              else if (tx.input.startsWith('0x')) functionName = 'Contract Interaction'
            } else if (tx.value && tx.value !== '0x0' && tx.value !== '0x') {
              functionName = 'Transfer'
            }
            
            const transaction: Transaction = {
              hash: tx.hash,
              from: tx.from || '',
              to: tx.to || '',
              value: tx.value || '0',
              gas: tx.gas || '0',
              gasPrice: tx.gasPrice || '0',
              gasUsed: receipt?.gasUsed || '0',
              timeStamp: Math.floor(blockTimestamp).toString(),
              blockNumber: block.number,
              isError: receipt?.status === '0x0' ? '1' : '0',
              txreceipt_status: receipt?.status || '0x1',
              methodId: tx.input?.slice(0, 10) || '0x',
              functionName
            }
            
            transactions.push(transaction)
            console.log(`Added transaction: ${tx.hash.slice(0, 10)}... (${functionName})`)
          } catch (receiptError) {
            console.error(`Error fetching receipt for ${tx.hash}:`, receiptError)
            // Add transaction without receipt data
            transactions.push({
              hash: tx.hash,
              from: tx.from || '',
              to: tx.to || '',
              value: tx.value || '0',
              gas: tx.gas || '0',
              gasPrice: tx.gasPrice || '0',
              gasUsed: '0',
              timeStamp: Math.floor(blockTimestamp).toString(),
              blockNumber: block.number,
              isError: '0',
              txreceipt_status: '0x1',
              methodId: tx.input?.slice(0, 10) || '0x',
              functionName: 'Transfer'
            })
          }
        }
      } catch (blockError) {
        console.error(`Error fetching block ${blockNum}:`, blockError)
        continue
      }
    }
    
    console.log(`Found ${transactions.length} total transactions for ${address}`)
    
    // Sort by timestamp (newest first)
    return transactions.sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp))
    
  } catch (error) {
    console.error('Error fetching Somnia transactions:', error)
    return []
  }
}

// Get native token price (SOMI/STT)
export async function getNativeTokenPrice(chainId: number): Promise<number> {
  const chain = SOMNIA_CHAINS[chainId as keyof typeof SOMNIA_CHAINS]
  if (!chain) return 0

  try {
    // For now, return a reasonable price
    // You can implement real price fetching later
    if (chainId === 5031) {
      return 0.01 // SOMI price placeholder
    } else if (chainId === 50312) {
      return 3.65 // STT price placeholder
    }
    return 0
  } catch (error) {
    console.error('Error fetching native token price:', error)
    return 0
  }
}

// Get Somnia token balances including native token and ERC20 tokens
export async function getSomniaTokenBalances(address: string, chainId: number): Promise<TokenBalance[]> {
  const chain = SOMNIA_CHAINS[chainId as keyof typeof SOMNIA_CHAINS]
  if (!chain) {
    console.log('Chain not supported for token balances')
    return []
  }

  console.log(`Getting Somnia token balances for ${address} on chain ${chainId}`)
  
  try {
    const balances: TokenBalance[] = []
    
    // Get native token balance (STT for testnet, SOMI for mainnet)
    const nativeBalanceResponse = await fetch(chain.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1
      })
    })
    
    const nativeBalanceData = await nativeBalanceResponse.json()
    const nativeBalance = nativeBalanceData.result
    
    if (nativeBalance) {
      const balanceInEther = parseInt(nativeBalance, 16) / Math.pow(10, 18)
      const tokenPrice = await getNativeTokenPrice(chainId)
      const usdValue = balanceInEther * tokenPrice
      
      balances.push({
        contractAddress: '0x0000000000000000000000000000000000000000',
        tokenSymbol: chain.nativeCurrency,
        tokenName: chain.nativeCurrency === 'STT' ? 'Somnia Testnet Token' : 'Somnia',
        tokenDecimal: '18',
        balance: balanceInEther.toString(),
        usdValue: usdValue,
        chainId: chainId,
        chainName: chain.name,
        logoUrl: undefined
      })
    }
    
    // Add known Somnia ERC20 tokens (excluding native token)
    if (chainId === 50312) { // Somnia Testnet
      // USDT token
      const usdtBalance = await getERC20Balance(address, '0xda4fde38be7a2b959bf46e032ecfa21e64019b76', chain.rpcUrl, 'USDT', 'Tether USD', 18)
      if (usdtBalance && parseFloat(usdtBalance.balance) > 0) {
        balances.push(usdtBalance)
      }
      
      // SomniaExchange Token
      const somniaExchangeBalance = await getERC20Balance(address, '0xf2f773753cebefaf9b68b841d80c083b18c69311', chain.rpcUrl, 'SOMNIAEXCHANGE', 'SomniaExchange Token', 18)
      if (somniaExchangeBalance && parseFloat(somniaExchangeBalance.balance) > 0) {
        balances.push(somniaExchangeBalance)
      }
      
      // Ping Token
      const pingBalance = await getERC20Balance(address, '0x33e7fab0a8a5da1a923180989bd617c9c2d1c493', chain.rpcUrl, 'PING', 'Ping Token', 18)
      if (pingBalance && parseFloat(pingBalance.balance) > 0) {
        balances.push(pingBalance)
      }
      
      // Pong Token
      const pongBalance = await getERC20Balance(address, '0x9beaa0016c22b646ac311ab171270b0ecf23098f', chain.rpcUrl, 'PONG', 'Pong Token', 18)
      if (pongBalance && parseFloat(pongBalance.balance) > 0) {
        balances.push(pongBalance)
      }
    } else if (chainId === 5031) { // Somnia Mainnet
      // SomniaExchange Token
      const somniaExchangeBalance = await getERC20Balance(address, '0xf2f773753cebefaf9b68b841d80c083b18c69311', chain.rpcUrl, 'SOMNIAEXCHANGE', 'SomniaExchange Token', 18)
      if (somniaExchangeBalance && parseFloat(somniaExchangeBalance.balance) > 0) {
        balances.push(somniaExchangeBalance)
      }
      
      // Ping Token
      const pingBalance = await getERC20Balance(address, '0x33e7fab0a8a5da1a923180989bd617c9c2d1c493', chain.rpcUrl, 'PING', 'Ping Token', 18)
      if (pingBalance && parseFloat(pingBalance.balance) > 0) {
        balances.push(pingBalance)
      }
      
      // Pong Token
      const pongBalance = await getERC20Balance(address, '0x9beaa0016c22b646ac311ab171270b0ecf23098f', chain.rpcUrl, 'PONG', 'Pong Token', 18)
      if (pongBalance && parseFloat(pongBalance.balance) > 0) {
        balances.push(pongBalance)
      }
    }
    
    console.log(`Found ${balances.length} token balances`)
    return balances
    
  } catch (error) {
    console.error('Error fetching Somnia token balances:', error)
    return []
  }
}

// Helper function to get ERC20 token balance
async function getERC20Balance(
  address: string, 
  tokenAddress: string, 
  rpcUrl: string, 
  symbol: string, 
  name: string, 
  decimals: number
): Promise<TokenBalance | null> {
  try {
    // Get token balance
    const balanceResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: tokenAddress,
          data: `0x70a08231${address.slice(2).padStart(64, '0')}` // balanceOf(address)
        }, 'latest'],
        id: 1
      })
    })
    
    const balanceData = await balanceResponse.json()
    const balance = balanceData.result
    
    if (balance && balance !== '0x') {
      const balanceInTokens = parseInt(balance, 16) / Math.pow(10, decimals)
      
      // Get token price (simplified - you can implement proper price fetching)
      let tokenPrice = 0
      if (symbol === 'WSTT') {
        tokenPrice = 3.65 // STT price
      } else if (symbol === 'USDT') {
        tokenPrice = 1.0 // USDT price
      }
      
      return {
        contractAddress: tokenAddress,
        tokenSymbol: symbol,
        tokenName: name,
        tokenDecimal: decimals.toString(),
        balance: balanceInTokens.toString(),
        usdValue: balanceInTokens * tokenPrice,
        chainId: 50312, // Will be updated based on actual chain
        chainName: 'Somnia Testnet',
        logoUrl: undefined
      }
    }
    
    return null
  } catch (error) {
    console.error(`Error fetching ${symbol} balance:`, error)
    return null
  }
}
