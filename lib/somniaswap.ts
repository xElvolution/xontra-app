import { ethers } from 'ethers'
import { SUPPORTED_CHAINS } from './chains'

// Somnia Exchange Contract Addresses
const SOMNIA_DEX_ADDRESSES: Record<number, { router: string; factory: string }> = {
  5031: { // Somnia Mainnet
    router: '0xCdE9aFDca1AdAb5b5C6E4F9e16c9802C88Dc7e1A', // Router V02
    factory: '0x6C4853C97b981Aa848C2b56F160a73a46b5DCCD4' // Factory
  },
  50312: { // Somnia Testnet
    router: '0xb98c15a0dC1e271132e341250703c7e94c059e8D', // Somnia Exchange Router V02
    factory: '0x31015A978c5815EdE29D0F969a17e116BC1866B1' // Somnia Exchange Factory
  }
}

// Token configurations for Somnia chains
const CHAIN_TOKENS: Record<number, Record<string, { address: string; symbol: string; decimals: number; name: string }>> = {
  5031: { // Somnia Mainnet
    somi: {
      address: '0x0000000000000000000000000000000000000000', // Native token (ETH equivalent)
      symbol: 'SOMI',
      decimals: 18,
      name: 'Somnia'
    },
    wsomi: {
      address: '0x0000000000000000000000000000000000000000', // Need actual WSOMI address
      symbol: 'WSOMI',
      decimals: 18,
      name: 'Wrapped Somnia'
    },
    usdc: {
      address: '0x28bec7e30e6faee657a03e19bf1128aad7632a00', // USDC on Somnia Mainnet
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin'
    },
    somniaexchange: {
      address: '0xf2f773753cebefaf9b68b841d80c083b18c69311', // SomniaExchange Token
      symbol: 'SOMNIAEXCHANGE',
      decimals: 18,
      name: 'SomniaExchange Token'
    },
    ping: {
      address: '0x33e7fab0a8a5da1a923180989bd617c9c2d1c493', // Ping Token
      symbol: 'PING',
      decimals: 18,
      name: 'Ping Token'
    },
    pong: {
      address: '0x9beaa0016c22b646ac311ab171270b0ecf23098f', // Pong Token
      symbol: 'PONG',
      decimals: 18,
      name: 'Pong Token'
    }
  },
  50312: { // Somnia Testnet
    stt: {
      address: '0x0000000000000000000000000000000000000000', // Native token (ETH equivalent)
      symbol: 'STT',
      decimals: 18,
      name: 'Somnia Test Token'
    },
    wstt: {
      address: '0xF22eF0085f6511f70b01a68F360dCc56261F768a', // WSTT contract address
      symbol: 'WSTT',
      decimals: 18,
      name: 'Wrapped Somnia Test Token'
    },
    usdt: {
      address: '0xda4fde38be7a2b959bf46e032ecfa21e64019b76', // USDT on Somnia Testnet
      symbol: 'USDT',
      decimals: 18,
      name: 'Tether USD'
    },
    somniaexchange: {
      address: '0xf2f773753cebefaf9b68b841d80c083b18c69311', // SomniaExchange Token
      symbol: 'SOMNIAEXCHANGE',
      decimals: 18,
      name: 'SomniaExchange Token'
    },
    ping: {
      address: '0x33e7fab0a8a5da1a923180989bd617c9c2d1c493', // Ping Token
      symbol: 'PING',
      decimals: 18,
      name: 'Ping Token'
    },
    pong: {
      address: '0x9beaa0016c22b646ac311ab171270b0ecf23098f', // Pong Token
      symbol: 'PONG',
      decimals: 18,
      name: 'Pong Token'
    }
  }
}

// RPC URLs for Somnia chains
const CHAIN_RPCS: Record<number, string> = {
  5031: process.env.NEXT_PUBLIC_SOMNIA_RPC_URL || 'https://api.infra.mainnet.somnia.network/',
  50312: process.env.NEXT_PUBLIC_SOMNIA_TESTNET_RPC_URL || 'https://dream-rpc.somnia.network/'
}

// Known pairs for Somnia Testnet
const KNOWN_PAIRS: Record<number, Record<string, string>> = {
  50312: {
    'USDT-WSTT': '0xa9144dad8471d6ce111567b0f07aedca11f07dbc' // USDT-WSTT pair
  }
}

// Helper function to get pair address
function getPairAddress(tokenA: string, tokenB: string, chainId: number): string | null {
  const pairKey = `${tokenA}-${tokenB}`
  const reversePairKey = `${tokenB}-${tokenA}`
  
  if (KNOWN_PAIRS[chainId]) {
    return KNOWN_PAIRS[chainId][pairKey] || KNOWN_PAIRS[chainId][reversePairKey] || null
  }
  
  return null
}

export interface Token {
  address: string
  symbol: string
  decimals: number
  chainId: number
  name: string
}

export interface SwapQuote {
  fromToken: Token
  toToken: Token
  fromAmount: string
  toAmount: string
  gasEstimate: string
  priceImpact: string
  fee: string
  parsedCommand?: any // Store the parsed command for execution
}

export interface SwapTransaction {
  to: string
  data: string
  value: string
  gasLimit: string
  meta?: {
    title: string
    description: string
  }
  swapDetails?: {
    fromToken: string
    toToken: string
    fromAmount: string
    toAmount: string
    slippage: string
  }
}

// Get token price from CoinGecko API
async function getTokenPriceUSD(symbol: string): Promise<number> {
  try {
    // Map Somnia tokens to CoinGecko IDs if available
    const coinGeckoId = symbol.toLowerCase() === 'somi' ? 'somnia' : 
                       symbol.toLowerCase() === 'stt' ? 'somnia-test' : 
                       symbol.toLowerCase() === 'usdt' ? 'tether' :
                       symbol.toLowerCase()
    
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd`)
    const data = await response.json()
    return data[coinGeckoId]?.usd || 1
  } catch (error) {
    console.error(`Error getting ${symbol} price:`, error)
    return symbol === 'somi' ? 0.01 : 
           symbol === 'stt' ? 0.0001 : // STT is worth much less - around $0.0001
           symbol === 'usdt' ? 1.0 : 1
  }
}

export async function getSwapQuote(
  fromToken: string,
  toToken: string,
  amount: string,
  chainId: number
): Promise<SwapQuote> {
  try {
    const fromTokenInfo = getToken(fromToken, chainId)
    const toTokenInfo = getToken(toToken, chainId)
    const addresses = SOMNIA_DEX_ADDRESSES[chainId]
    
    if (!addresses) {
      throw new Error(`Somnia DEX not supported on chain ${chainId}`)
    }

    const provider = new ethers.providers.JsonRpcProvider(CHAIN_RPCS[chainId])
    const router = new ethers.Contract(
      addresses.router,
      [
        'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
        'function getAmountsIn(uint amountOut, address[] calldata path) external view returns (uint[] memory amounts)'
      ],
      provider
    )

    const amountIn = ethers.utils.parseUnits(amount, fromTokenInfo.decimals)
    
    // Determine the correct swap path based on token types
    let path: string[]
    const fromIsNative = fromTokenInfo.symbol === 'SOMI' || fromTokenInfo.symbol === 'STT'
    const toIsNative = toTokenInfo.symbol === 'SOMI' || toTokenInfo.symbol === 'STT'
    const fromIsWrapped = fromTokenInfo.symbol === 'WSOMI' || fromTokenInfo.symbol === 'WSTT'
    const toIsWrapped = toTokenInfo.symbol === 'WSOMI' || toTokenInfo.symbol === 'WSTT'
    const fromIsERC20 = fromTokenInfo.symbol === 'USDT'
    const toIsERC20 = toTokenInfo.symbol === 'USDT'
    
    if (fromIsNative && toIsERC20) {
      // STT → USDT: Use WSTT → USDT path (STT gets wrapped to WSTT first)
      const wrappedTokenAddress = chainId === 5031 ? 
        '0x0000000000000000000000000000000000000000' : // WSOMI address needed
        '0xF22eF0085f6511f70b01a68F360dCc56261F768a'  // WSTT address
      path = [wrappedTokenAddress, toTokenInfo.address]
    } else if (fromIsERC20 && toIsNative) {
      // USDT → STT: Use USDT → WSTT path (WSTT gets unwrapped to STT)
      const wrappedTokenAddress = chainId === 5031 ? 
        '0x0000000000000000000000000000000000000000' : // WSOMI address needed
        '0xF22eF0085f6511f70b01a68F360dCc56261F768a'  // WSTT address
      path = [fromTokenInfo.address, wrappedTokenAddress]
    } else {
      // Direct token to token swap (WSTT ↔ USDT)
      path = [fromTokenInfo.address, toTokenInfo.address]
    }
    
    // Get quote from contract
    const amounts = await router.getAmountsOut(amountIn, path)
    const toAmount = ethers.utils.formatUnits(amounts[amounts.length - 1], toTokenInfo.decimals)
    
    // Calculate price impact (simplified)
    const priceImpact = '0.1' // This should be calculated from reserves
    
    return {
      fromToken: fromTokenInfo,
      toToken: toTokenInfo,
      fromAmount: amount,
      toAmount: toAmount,
      gasEstimate: '150000',
      priceImpact: `${priceImpact}%`,
      fee: '0.3%'
    }
  } catch (error) {
    console.error('Error getting swap quote from contract:', error)
    throw error
  }
}

export async function executeSwap(
  fromToken: string,
  toToken: string,
  amount: string,
  slippage: number,
  chainId: number,
  userAddress: string
): Promise<SwapTransaction> {
  try {
    const fromTokenInfo = getToken(fromToken, chainId)
    const toTokenInfo = getToken(toToken, chainId)

    // Get quote for minimum output calculation
    const quote = await getSwapQuote(fromToken, toToken, amount, chainId)
    const expectedOutput = parseFloat(quote.toAmount)
    const minOutput = expectedOutput * (1 - slippage / 100)

    // Create provider for the specific chain
    const rpcUrl = CHAIN_RPCS[chainId]
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl)

    const addresses = SOMNIA_DEX_ADDRESSES[chainId]
    if (!addresses) {
      throw new Error(`Somnia DEX not supported on chain ${chainId}`)
    }

    // DEX is now deployed with real contracts

    // Convert amounts to proper decimals
    const amountIn = safeParseUnits(amount, fromTokenInfo.decimals)
    const amountOutMinimum = safeParseUnits(minOutput.toString(), toTokenInfo.decimals)
    
    // Prepare swap parameters for Somnia DEX
    const deadline = Math.floor(Date.now() / 1000) + 1200 // 20 minutes
    
    // For native token swaps (SOMI/STT), we need to handle ETH-like transactions
    const fromIsNative = fromTokenInfo.symbol === 'SOMI' || fromTokenInfo.symbol === 'STT'
    const toIsNative = toTokenInfo.symbol === 'SOMI' || toTokenInfo.symbol === 'STT'
    const fromIsWrapped = fromTokenInfo.symbol === 'WSOMI' || fromTokenInfo.symbol === 'WSTT'
    const toIsWrapped = toTokenInfo.symbol === 'WSOMI' || toTokenInfo.symbol === 'WSTT'
    const fromIsERC20 = fromTokenInfo.symbol === 'USDT'
    const toIsERC20 = toTokenInfo.symbol === 'USDT'
    
    let swapData: string
    
    if (fromIsNative && toIsWrapped) {
      // Native to wrapped: Just wrap the native token (STT → WSTT)
      // This should be a direct wrap operation, not a swap
      throw new Error('Use wrap function instead of swap for native to wrapped tokens')
    } else if (fromIsWrapped && toIsNative) {
      // Wrapped to native: Just unwrap the wrapped token (WSTT → STT)
      // This should be a direct unwrap operation, not a swap
      throw new Error('Use unwrap function instead of swap for wrapped to native tokens')
    } else if (fromIsNative && toIsERC20) {
      // Native to ERC20: Use swapExactETHForTokens with WSTT → USDT path
      // STT → USDT: Router handles STT → WSTT → USDT automatically
      const wrappedTokenAddress = chainId === 5031 ? 
        '0x0000000000000000000000000000000000000000' : // WSOMI address needed
        '0xF22eF0085f6511f70b01a68F360dCc56261F768a'  // WSTT address
      
      swapData = createSwapExactETHForTokensSupportingFeeOnTransferTokensData(
        [wrappedTokenAddress, toTokenInfo.address], // Path: WSTT → USDT
        amountOutMinimum,
        userAddress,
        deadline
      )
    } else if (fromIsERC20 && toIsNative) {
      // ERC20 to native: Use swapExactTokensForETH with USDT → WSTT path
      // USDT → STT: Router handles USDT → WSTT → STT automatically
      const wrappedTokenAddress = chainId === 5031 ? 
        '0x0000000000000000000000000000000000000000' : // WSOMI address needed
        '0xF22eF0085f6511f70b01a68F360dCc56261F768a'  // WSTT address
      
      swapData = createSwapExactTokensForETHSupportingFeeOnTransferTokensData(
        [fromTokenInfo.address, wrappedTokenAddress], // Path: USDT → WSTT
        amountIn,
        amountOutMinimum,
        userAddress,
        deadline
      )
    } else if (fromIsNative && toIsNative) {
      // Native to native (shouldn't happen, but handle gracefully)
      throw new Error('Cannot swap native token to native token directly')
    } else {
      // Token to token swap (WSTT ↔ USDT, etc.)
      // Check if we have a known pair for direct swap
      const pairAddress = getPairAddress(fromTokenInfo.symbol, toTokenInfo.symbol, chainId)
      
      if (pairAddress) {
        console.log(`Using known pair ${pairAddress} for ${fromTokenInfo.symbol}-${toTokenInfo.symbol}`)
      }
      
      swapData = createSwapExactTokensForTokensData(
        fromTokenInfo.address,
        toTokenInfo.address,
        amountIn,
        amountOutMinimum,
        userAddress,
        deadline
      )
    }
    
    // Estimate gas
    let estimatedGas = 120000
    try {
      const gasEstimate = await provider.estimateGas({
        to: addresses.router,
      data: swapData,
        value: fromTokenInfo.symbol === 'SOMI' || fromTokenInfo.symbol === 'STT' ? amountIn : 0
      })
      estimatedGas = gasEstimate.mul(120).div(100).toNumber() // Add 20% buffer
    } catch (error) {
      console.log('Gas estimation failed, using default:', error)
    }

    return {
      to: addresses.router,
      data: swapData,
      value: fromIsNative ? amountIn.toString() : '0', // Only send ETH value for native token swaps
      gasLimit: estimatedGas.toString(),
      meta: {
        title: `Swap ${amount} ${fromTokenInfo.symbol} to ${toTokenInfo.symbol}`,
        description: `Swap ${amount} ${fromTokenInfo.symbol} for approximately ${quote.toAmount} ${toTokenInfo.symbol}`
      },
      swapDetails: {
        fromToken: fromTokenInfo.symbol,
        toToken: toTokenInfo.symbol,
        fromAmount: amount,
        toAmount: quote.toAmount,
        slippage: `${slippage}%`
      }
    }
  } catch (error) {
    console.error('Error executing swap:', error)
    throw error
  }
}

export function getToken(symbol: string, chainId: number): Token {
  const chainTokens = CHAIN_TOKENS[chainId]
  if (!chainTokens) {
    throw new Error(`Chain ${chainId} not supported`)
  }

  const token = chainTokens[symbol.toLowerCase()]
  if (!token) {
    throw new Error(`Token ${symbol} not found on chain ${chainId}`)
  }

    return {
    ...token,
    chainId
  }
}

export function getSupportedTokens(chainId: number): Token[] {
  const chainTokens = CHAIN_TOKENS[chainId]
  if (!chainTokens) {
    return []
  }

  return Object.values(chainTokens).map(token => ({
    ...token,
    chainId
  }))
}

export function safeParseUnits(amount: string, decimals: number): ethers.BigNumber {
  const roundedAmount = Number(amount).toFixed(decimals)
  return ethers.utils.parseUnits(roundedAmount, decimals)
}

// Check if Somnia DEX is supported on a chain
export function isSomniaDEXSupported(chainId: number): boolean {
  return SOMNIA_DEX_ADDRESSES.hasOwnProperty(chainId)
}

// Check if Somnia DEX is deployed on a chain
export function isSomniaDEXDeployed(chainId: number): boolean {
  const addresses = SOMNIA_DEX_ADDRESSES[chainId]
  return addresses && addresses.router !== '0x0000000000000000000000000000000000000000'
}

// Helper function to create swap data for native to wrapped token swaps
function createSwapExactETHForTokensData(
  tokenOut: string,
  amountOutMin: ethers.BigNumber,
  to: string,
  deadline: number
): string {
  // Try multiple possible function signatures for Somnia DEX
  const possibleSignatures = [
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable',
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory)',
    'function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external payable returns (uint256[] memory amounts)'
  ]
  
  const path = ['0x0000000000000000000000000000000000000000', tokenOut] // Native -> Token
  
  // Try the first signature (most common)
  try {
    const iface = new ethers.utils.Interface([possibleSignatures[0]])
    return iface.encodeFunctionData('swapExactETHForTokens', [amountOutMin, path, to, deadline])
  } catch (error) {
    console.error('Error encoding swapExactETHForTokens:', error)
    // Fallback to a simple transfer if the DEX function fails
    throw new Error('Somnia DEX swapExactETHForTokens function not supported or invalid parameters')
  }
}

// Helper function to create swap data for native to ERC20 with multi-hop path
function createSwapExactETHForTokensSupportingFeeOnTransferTokensData(
  path: string[],
  amountOutMin: ethers.BigNumber,
  to: string,
  deadline: number
): string {
  const iface = new ethers.utils.Interface([
    'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable'
  ])
  
  return iface.encodeFunctionData('swapExactETHForTokensSupportingFeeOnTransferTokens', [amountOutMin, path, to, deadline])
}

// Helper function to create swap data for wrapped to native token swaps
function createSwapExactTokensForETHData(
  tokenIn: string,
  amountIn: ethers.BigNumber,
  amountOutMin: ethers.BigNumber,
  to: string,
  deadline: number
): string {
  const iface = new ethers.utils.Interface([
    'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
  ])
  
  const path = [tokenIn, '0x0000000000000000000000000000000000000000'] // Wrapped -> Native
  return iface.encodeFunctionData('swapExactTokensForETH', [amountIn, amountOutMin, path, to, deadline])
}

// Helper function to create swap data for ERC20 to native with multi-hop path
function createSwapExactTokensForETHSupportingFeeOnTransferTokensData(
  path: string[],
  amountIn: ethers.BigNumber,
  amountOutMin: ethers.BigNumber,
  to: string,
  deadline: number
): string {
  const iface = new ethers.utils.Interface([
    'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external'
  ])
  
  return iface.encodeFunctionData('swapExactTokensForETHSupportingFeeOnTransferTokens', [amountIn, amountOutMin, path, to, deadline])
}

// Helper function to create swap data for token to token swaps
function createSwapExactTokensForTokensData(
  tokenIn: string,
  tokenOut: string,
  amountIn: ethers.BigNumber,
  amountOutMin: ethers.BigNumber,
  to: string,
  deadline: number
): string {
  const iface = new ethers.utils.Interface([
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
  ])
  
  const path = [tokenIn, tokenOut]
  return iface.encodeFunctionData('swapExactTokensForTokens', [amountIn, amountOutMin, path, to, deadline])
}

// Simple swap data creator that tries multiple function signatures
function createSimpleSwapData(
  tokenIn: string,
  tokenOut: string,
  amountIn: ethers.BigNumber,
  amountOutMin: ethers.BigNumber,
  to: string,
  deadline: number
): string {
  // Try different possible function signatures for Somnia DEX
  const possibleFunctions = [
    // Standard Uniswap V2 functions
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
    'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    
    // Alternative signatures
    'function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external payable returns (uint256[] memory amounts)',
    'function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)',
    'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts)'
  ]
  
  const isNativeIn = tokenIn === '0x0000000000000000000000000000000000000000'
  const isNativeOut = tokenOut === '0x0000000000000000000000000000000000000000'
  
  let functionName = ''
  let functionSignature = ''
  
  if (isNativeIn && !isNativeOut) {
    functionName = 'swapExactETHForTokens'
    functionSignature = possibleFunctions[0] // Try standard signature first
  } else if (!isNativeIn && isNativeOut) {
    functionName = 'swapExactTokensForETH'
    functionSignature = possibleFunctions[1]
  } else {
    functionName = 'swapExactTokensForTokens'
    functionSignature = possibleFunctions[2]
  }
  
  try {
    const iface = new ethers.utils.Interface([functionSignature])
    const path = [tokenIn, tokenOut]
    
    if (isNativeIn && !isNativeOut) {
      return iface.encodeFunctionData(functionName, [amountOutMin, path, to, deadline])
    } else if (!isNativeIn && isNativeOut) {
      return iface.encodeFunctionData(functionName, [amountIn, amountOutMin, path, to, deadline])
    } else {
      return iface.encodeFunctionData(functionName, [amountIn, amountOutMin, path, to, deadline])
    }
  } catch (error) {
    console.error(`Error encoding ${functionName}:`, error)
    // Return a simple transfer as fallback
    throw new Error(`Somnia DEX ${functionName} function not supported. Please check the contract ABI.`)
  }
}