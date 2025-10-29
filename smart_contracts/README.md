compile:
npx hardhat compile

deploy locally:
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost

deploy on sepolia:
npx hardhat run scripts/deploy.js --network sepolia

Update factory address after deploying
files with factory address:
Deploy.jsx
Event.jsx
Tickets.jsx

run test:
npx hardhat test

run website:
npm run dev
