#!/usr/bin/env node

import web3 from "web3";

if (process.argv.length < 3) {
  console.log(`Usage: ${process.argv[1]} <address>` );
  process.exit(1);
}

const address  = process.argv[2];

console.log(web3.utils.toChecksumAddress(address));