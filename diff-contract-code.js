import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { exit } from 'process';
import { spawnSync } from 'child_process';

dotenv.config();
const { ETHERSCAN_API_KEY, ETHERSCAN_API_DOMAIN } = process.env;

if (!ETHERSCAN_API_KEY) {
  console.log("Please export ETHERSCAN_API_KEY");
  exit(1);
}

let etherscanApiDomain = "api.etherscan.io";
//
if (ETHERSCAN_API_DOMAIN) {
  etherscanApiDomain = ETHERSCAN_API_DOMAIN;
}

if (process.argv.length < 4) {
  console.log(`Usage: ${path.basename(process.argv[1])} <address1> <address2> [<isWordLevelDiff = true> ]`);
  exit(1);
}
const address1 = process.argv[2];
const address2 = process.argv[3];

let wordLevelDiff = true;
const arg3 = process.argv[4]
if (process.argv.length >= 5 && arg3[0] == 'f') {
  wordLevelDiff = false;
}

const mkSourceCodeUrl = (address) => {
  return `https:///${etherscanApiDomain}/api?module=contract&action=getsourcecode&address=${address}&apikey=${ETHERSCAN_API_KEY}`
}

const mkDirAndWriteFile = (dir, fileName, content) => {
  fs.mkdirSync(path.join(dir, path.dirname(fileName)), { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), content);

}

// Returns directory and flag whether it is multiple files or not
const getSourceFilesFromAddress = async (address) => {
  const response = await fetch(mkSourceCodeUrl(address));

  const data = await response.json();
  if (data.status != "1") {
    console.log(`Could not retrieve source code from address ${address}`);
    exit(1);
  }

  const sourceCode = data.result[0].SourceCode;

  let dir = fs.mkdtempSync("temp-");
  let areMultipleFiles = false;

  let sourceObj;
  if (sourceCode.slice(0,2) == "{{") {
    try {
      sourceObj = JSON.parse(sourceCode.slice(1,sourceCode.length - 1)).sources;
      areMultipleFiles = true;
    } catch (e) {
      areMultipleFiles = false;
    }
  }



  if (areMultipleFiles) {
    for (let fileName in sourceObj) {
      if (sourceObj.hasOwnProperty(fileName)) {
        mkDirAndWriteFile(dir, fileName, sourceObj[fileName].content);
      }
    }
  } else { // Just one flattened source files
    mkDirAndWriteFile(dir, "Source.sol", sourceCode);
  }
  return { dir: dir, areMultipleFiles: areMultipleFiles };
}

const r1 = await getSourceFilesFromAddress(address1);
const r2 = await getSourceFilesFromAddress(address2);

const rmRf = (dir) => {
  fs.rmSync(dir, { recursive: true, force: true});
}


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

const files1 = getFilesRecursively(r1.dir);
const files2 = getFilesRecursively(r2.dir);

console.log(`Address 1: ${address1}`);
console.log(`Address 2: ${address2}`);

if (r1.areMultipleFiles && r2.areMultipleFiles) {
  console.log(`\n=== Files at first address but not second ===`);

  for (let i in files1) {
    let f = files1[i];
    if (!files2.includes(f)) {
      console.log(`  - ${f}`);
    }
  }

  console.log(`\n=== Files at second address but not first ===`);
  for (let i in files2) {
    let f = files2[i];
    if (!files1.includes(f)) {
      console.log(`  - ${f}`);
    }
  }
}

if (r1.areMultipleFiles == r2.areMultipleFiles) {
  console.log("\n=== Diffs follow ===")

  const diffFiles = (f1, f2) => {
    let args = ['diff', '--no-index', '--color'];
    if (wordLevelDiff) {
      args = args.concat(['--word-diff=plain']);
    }
    args = args.concat([f1, f2]);

    const result = spawnSync('git', args);
    if (result.status != 0) {
      console.log(result.stdout.toString());
    }

  }

  for (let i in files1) {
    let f = files1[i];
    if (files2.includes(f)) {
      diffFiles(`${r1.dir}/${f}`, `${r2.dir}/${f}`);
    }
  }
} else if (r1.areMultipleFiles) {
  console.log(`Error: Multiple files at address ${address1} and not ${address2}`);
} else if (r2.areMultipleFiles) {
  console.log(`Error: Multiple files at address ${address2} and not ${address1}`);

}

// Clean up
rmRf(r1.dir);
rmRf(r2.dir);

