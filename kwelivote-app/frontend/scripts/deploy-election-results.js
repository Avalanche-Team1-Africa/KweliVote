// Deployment script for ElectionResults contract
const hre = require("hardhat");

async function main() {
  console.log("Deploying ElectionResults contract...");

  // Get the contract factory
  const ElectionResults = await hre.ethers.getContractFactory("ElectionResults");
  
  // Deploy the contract
  const electionResults = await ElectionResults.deploy();
  
  // Wait for the deployment to complete
  await electionResults.deployed();
  
  console.log("ElectionResults contract deployed to:", electionResults.address);
  console.log("Transaction hash:", electionResults.deployTransaction.hash);
  
  // Wait for 5 confirmations to ensure deployment is confirmed
  console.log("Waiting for confirmations...");
  await electionResults.deployTransaction.wait(5);
  console.log("Deployment confirmed!");
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
