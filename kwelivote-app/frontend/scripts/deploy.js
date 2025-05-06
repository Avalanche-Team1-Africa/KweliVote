// Deployment script for VoterDID contract
const hre = require("hardhat");

async function main() {
  console.log("Deploying VoterDID contract...");

  // Get the contract factory
  const VoterDID = await hre.ethers.getContractFactory("VoterDID");
  
  // Deploy the contract
  const voterDID = await VoterDID.deploy();
  
  // Wait for the deployment to complete
  await voterDID.deployed();
  
  console.log("VoterDID contract deployed to:", voterDID.address);
  console.log("Transaction hash:", voterDID.deployTransaction.hash);
  
  // Wait for 5 confirmations to ensure deployment is confirmed
  console.log("Waiting for confirmations...");
  await voterDID.deployTransaction.wait(5);
  console.log("Deployment confirmed!");
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });