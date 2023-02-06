import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { exit } from 'process';
import { spawnSync } from 'child_process';

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
const address1 = process.argv[2];
const address2 = process.argv[3];


// 0xAEf566ca7E84d1E736f999765a804687f39D9094
const mkSourceCodeUrl = (address) => {
  return `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${ETHERSCAN_API_KEY}`
}

const getSourceFilesFromAddress = async (address) => {
  const response = await fetch(mkSourceCodeUrl(address));

  const data = await response.json();
  if (data.status != "1") {
    console.log(`Could not retrieve source code from address ${address}`);
    exit(1);
  }

  const str = data.result[0].SourceCode;
  const sourceObj = JSON.parse(str.slice(1,str.length - 1)).sources;

  let dir = fs.mkdtempSync("temp-");

  for (let fileName in sourceObj) {
    if (sourceObj.hasOwnProperty(fileName)) {
      fs.mkdirSync(path.join(dir, path.dirname(fileName)), { recursive: true });
      fs.writeFileSync(path.join(dir, fileName), sourceObj[fileName].content);
    }
  }
  return dir;
}

const dir1 = await getSourceFilesFromAddress(address1);
const dir2 = await getSourceFilesFromAddress(address2);

const sliceOffFirstDirectory = (f) => {
  return f.split("/").slice(1).join("/");
}

const getFilesRecursively = (dir) => {
  let files = [];
  fs.readdirSync(dir, { withFileTypes: true}).map(f => {
    if (f.isDirectory()) {
      files = files.concat(getFilesRecursively(path.join(dir, f.name)));
    } else {
      files.push(sliceOffFirstDirectory(path.join(dir,f.name)));
    }
  });
  return files;
};


const files1 = getFilesRecursively(dir1);
const files2 = getFilesRecursively(dir2);

console.log(`Address 1: ${address1}`);
console.log(`Address 2: ${address2}`);
console.log(`\n* At first address but not second`);

for (let i in files1) {
  let f = files1[i];
  if (!files2.includes(f)) {
    console.log(`  - ${f}`);
  }
}

console.log(`\n* At second address but not first`);
for (let i in files2) {
  let f = files2[i];
  if (!files1.includes(f)) {
    console.log(`  - ${f}`);
  }
}

console.log("\n* Diffs follow")

const diffFiles = (f1, f2) => {
  const result = spawnSync('git', ['diff', '--no-index', '--word-diff=plain', '--color', f1, f2]);
  if (result.status != 0) {
    console.log(result.stdout.toString());
  }

}

for (let i in files1) {
  let f = files1[i];
  if (files2.includes(f)) {
    diffFiles(`${dir1}/${f}`, `${dir2}/${f}`);
  }
}

const rmRf = (dir) => {
  fs.rmSync(dir, { recursive: true, force: true});
}

rmRf(dir1);
rmRf(dir2);

