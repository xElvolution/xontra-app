import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code, contractName } = await request.json()

    if (!code || !contractName) {
      return NextResponse.json(
        { error: 'Missing code or contractName' },
        { status: 400 }
      )
    }

    // Dynamically import solc to avoid webpack issues
    const solc = await import('solc')
    
    // Extract Solidity version from pragma statement
    const pragmaMatch = code.match(/pragma\s+solidity\s+([^;]+);/i)
    let solidityVersion = '0.8.20' // Default version
    
    if (pragmaMatch) {
      const versionString = pragmaMatch[1].trim()
      // Handle version ranges like ^0.8.20, >=0.8.0 <0.9.0, etc.
      if (versionString.includes('^')) {
        const version = versionString.replace('^', '')
        solidityVersion = version
      } else if (versionString.includes('>=')) {
        const version = versionString.match(/>=(\d+\.\d+\.\d+)/)?.[1]
        if (version) solidityVersion = version
      } else {
        // Extract version number
        const version = versionString.match(/(\d+\.\d+\.\d+)/)?.[1]
        if (version) solidityVersion = version
      }
    }

    // Prepare input for solc compiler
    const input = {
      language: 'Solidity',
      sources: {
        [`${contractName}.sol`]: {
          content: code
        }
      },
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode']
          }
        }
      }
    }

    // Compile the contract
    const output = JSON.parse(solc.default.compile(JSON.stringify(input)))

    // Check for compilation errors
    if (output.errors) {
      const errors = output.errors.filter((err: any) => 
        err.severity === 'error'
      )
      if (errors.length > 0) {
        const errorMessages = errors.map((err: any) => err.formattedMessage || err.message).join('\n')
        return NextResponse.json(
          { 
            error: 'Compilation failed',
            details: errorMessages
          },
          { status: 400 }
        )
      }
    }

    // Get the compiled contract
    const contracts = output.contracts?.[`${contractName}.sol`]
    if (!contracts || !contracts[contractName]) {
      return NextResponse.json(
        { 
          error: `Contract "${contractName}" not found in the compiled output. Please check the contract name matches exactly.`
        },
        { status: 400 }
      )
    }

    const compiledContract = contracts[contractName]
    const bytecode = compiledContract.evm?.bytecode?.object

    if (!bytecode) {
      return NextResponse.json(
        { 
          error: 'No bytecode generated. The contract may not be compilable or may have errors.'
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      bytecode: bytecode.startsWith('0x') ? bytecode : '0x' + bytecode,
      abi: compiledContract.abi || []
    })
  } catch (error: any) {
    console.error('Compilation error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Compilation failed',
        details: error.stack
      },
      { status: 500 }
    )
  }
}

