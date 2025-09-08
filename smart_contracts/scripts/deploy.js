const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const ConcertFactory = await ethers.getContractFactory("ConcertFactory");
    const factory = await ConcertFactory.deploy();
    await factory.waitForDeployment();

    console.log("ConcertFactory deployed at:", factory.target);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
