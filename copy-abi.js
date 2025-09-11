const fs = require("fs");

const factorySrc = "./smart_contracts/artifacts/contracts/ConcertFactory.sol/ConcertFactory.json";
const factoryDest = "./client/src/contract/ConcertFactoryABI.json";

const concertSrc = "./smart_contracts/artifacts/contracts/Concert.sol/concert.json";
const concertDest = "./client/src/contract/ConcertABI.json";

// 確保目標資料夾存在
fs.mkdirSync("./client/src/contract", { recursive: true });

fs.copyFileSync(factorySrc, factoryDest);
fs.copyFileSync(concertSrc, concertDest);

console.log("ABI copied!");