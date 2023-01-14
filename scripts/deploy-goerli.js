const { ethers, run } = require("hardhat");
require("dotenv").config();

/**
 *  Make sure your environment variables are named PRIVATE_KEY and ETHERSCAN_API_KEY
 *  This script will automatically submit your contract for verification if ETHERSCAN_API_KEY is provided
 */

async function main() {
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const owner = new ethers.Wallet(PRIVATE_KEY);
  const provider = ethers.getDefaultProvider("goerli");
  const transactionCount = await owner.connect(provider).getTransactionCount();

  // gets the address of the token before it is deployed
  const futureAddress = ethers.utils.getContractAddress({
    from: owner.address,
    nonce: transactionCount + 1,
  });
  console.log("Future Address", futureAddress);

  const MyGovernor = await ethers.getContractFactory("MyGovernor");
  const governor = await MyGovernor.deploy(futureAddress);

  const MyToken = await ethers.getContractFactory("MyToken");
  const token = await MyToken.deploy(governor.address);

  console.log(
    `Governor deployed to ${governor.address}`,
    `Token deployed to ${token.address}`
  );

  // contract verification on goerli.etherscan.io
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Awaiting contract verification, this may take a while");
    // wait a little bit so that etherscan has access to bytecode
    await Sleep(60000);

    try {
      console.log("Verifying Governor contract");
      await run("verify:verify", {
        address: governor.address,
        constructorArguments: [token.address],
      });
    } catch (e) {
      if (e.message.toLowerCase().includes("already verified")) {
        console.log("Already verified!");
      } else {
        console.log(e);
      }
    }

    try {
      console.log("Verifying Token contract");
      await run("verify:verify", {
        address: token.address,
        constructorArguments: [governor.address],
      });
    } catch (e) {
      if (e.message.toLowerCase().includes("already verified")) {
        console.log("Already verified!");
      } else {
        console.log(e);
      }
    }
  }
}

function Sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
