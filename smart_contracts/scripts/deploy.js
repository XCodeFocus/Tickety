const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", deployer.address);

    const ConcertFactory = await ethers.getContractFactory("ConcertFactory");
    const factory = await ConcertFactory.deploy();
    await factory.waitForDeployment();

        const deployedAddress = factory.target || factory.address || null;
        console.log("ConcertFactory deployed at:", deployedAddress);

        // Try to update client config with the new factory address so frontend
        // uses the correct address without manual edit. We preserve the
        // existing METADATA_GATEWAY value in the config file.
        try {
            const configPath = path.resolve(__dirname, "..", "..", "client", "src", "config.js");
            let gateway = "https://senior-brown-chameleon.myfilebase.com/ipfs/";
            if (fs.existsSync(configPath)) {
                const orig = fs.readFileSync(configPath, "utf8");
                const m = orig.match(/METADATA_GATEWAY\s*=\s*["']([^"']+)["']/);
                if (m && m[1]) gateway = m[1];
            }

            const newContent = `// Centralized configuration for values that may change between deployments\n// This file is automatically updated by the deployment script.\n\nexport const FACTORY_ADDRESS = "${deployedAddress}";\n\n// Base gateway URL used to resolve ipfs:// URIs in the app. Keep trailing /.\nexport const METADATA_GATEWAY =\n  "${gateway}";\n\n// Export default for convenience\nexport default {\n  FACTORY_ADDRESS,\n  METADATA_GATEWAY,\n};\n`;

            fs.writeFileSync(configPath, newContent, "utf8");
            console.log(`Updated client config at ${configPath}`);
        } catch (e) {
            console.warn("Failed to update client config:", e?.message || e);
        }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
