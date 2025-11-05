import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy tokens first
  console.log("\n1. Deploying tokens...");
  
  // Deploy WSTT
  const WSTT = await hre.ethers.getContractFactory("WSTT");
  const wstt = await WSTT.deploy();
  await wstt.waitForDeployment();
  const wsttAddress = await wstt.getAddress();
  console.log("WSTT deployed to:", wsttAddress);

  // Deploy USDT (contract name is TestnetUSD)
  const USDT = await hre.ethers.getContractFactory("TestnetUSD");
  const usdt = await USDT.deploy();
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("USDT deployed to:", usdtAddress);

  // Deploy Factory
  console.log("\n2. Deploying XontraFactory...");
  const XontraFactory = await hre.ethers.getContractFactory("XontraFactory");
  const factory = await XontraFactory.deploy(deployer.address);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("Factory deployed to:", factoryAddress);
  
  // Get the INIT_CODE_PAIR_HASH from factory
  const initCodePairHash = await factory.INIT_CODE_PAIR_HASH();
  console.log("Init code pair hash:", initCodePairHash);

  // Deploy Router
  console.log("\n3. Deploying XontraRouter...");
  const XontraRouter = await hre.ethers.getContractFactory("XontraRouter");
  const router = await XontraRouter.deploy(factoryAddress, wsttAddress);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("Router deployed to:", routerAddress);

  // Get network info
  const networkName = hre.network.name;
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;

  // Load existing deployments
  const deploymentsPath = path.join(__dirname, "../deployments/deployed-tokens.json");
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));

  // Update deployments
  const deploymentKey = networkName === "somniaMainnet" ? "somniaMainnet" : "somniaTestnet";
  
  if (!deployments[deploymentKey]) {
    deployments[deploymentKey] = { 
      chainId: parseInt(chainId), 
      factory: "", 
      router: "", 
      initCodePairHash: "",
      tokens: {} 
    };
  }

  deployments[deploymentKey].factory = factoryAddress;
  deployments[deploymentKey].router = routerAddress;
  deployments[deploymentKey].initCodePairHash = initCodePairHash;
  deployments[deploymentKey].tokens = {
    WSTT: wsttAddress,
    USDT: usdtAddress,
  };

  // Save deployments
  fs.writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));

  console.log("\n✅ Deployment Summary:");
  console.log("Network:", networkName);
  console.log("Chain ID:", chainId);
  console.log("Factory:", factoryAddress);
  console.log("Router:", routerAddress);
  console.log("Init Code Pair Hash:", initCodePairHash);
  console.log("WSTT:", wsttAddress);
  console.log("USDT:", usdtAddress);
  console.log("\nDeployed addresses saved to:", deploymentsPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

