import fs from "fs";
import path from "path";

const buildDir = path.join(process.cwd(), "dist");
const indexFile = path.join(buildDir, "index.html");
const notFoundFile = path.join(buildDir, "404.html");

fs.copyFileSync(indexFile, notFoundFile);
console.log("404.html created");
