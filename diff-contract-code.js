import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { exit } from 'process';

dotenv.config();
const { ETHERSCAN_API_KEY } = process.env;

if (!ETHERSCAN_API_KEY) {
  console.log("Please export ETHERSCAN_API_KEY");
  exit(1);
}

if (process.argv.length < 4) {
  console.log(`Usage: ${path.basename(process.argv[1])} <address1> <address2>`);
  exit(1);
}


exit(1);
// 0xAEf566ca7E84d1E736f999765a804687f39D9094
const mkSourceCodeUrl = (address) => {
  return `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${ETHERSCAN_API_KEY}`
}

const response = await fetch();

const data = await response.json();
const str = data.result[0].SourceCode;
const sourceObj = JSON.parse(str.slice(1,str.length - 1)).sources;

let dir = fs.mkdtempSync("temp-");

for (let fileName in sourceObj) {
  if (sourceObj.hasOwnProperty(fileName)) {
    fs.mkdirSync(path.join(dir, path.dirname(fileName)), { recursive: true });
    fs.writeFile(path.join(dir, fileName), sourceObj[fileName].content, err => {
      if (err) {
        console.error(err);
      }
    });
  }
}

console.log(`Files in ${dir}`);

