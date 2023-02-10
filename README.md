# Tools to use with block explorers

## Installation

```bash
$ npm install
```

## Usage
### `diff-contract-code.js`

This tool will download the verified smart contract code deployed at a particular address and do a file-by-file diff.

#### Configuration

Environment variable is `ETHERSCAN_API_KEY` required.
Can also be used with other block explorers by setting the `ETHERSCAN_API_DOMAIN` environment variable.

eg. `export ETHERSCAN_API_DOMAIN=api.polygonscan.com`

#### Usage

```bash
$ node diff-contract-code.js 0x19890cf5c9a0b8d2f71eb71347d126b6f7d78b76 0x83597765904e28e3a360c17cb1f5635cbcbfdd63
```

**Output**

```
Address 1: 0x19890cf5c9a0b8d2f71eb71347d126b6f7d78b76
Address 2: 0x83597765904e28e3a360c17cb1f5635cbcbfdd63

* At first address but not second
  - @equilibria/emptyset-batcher/batcher/Batcher.sol
  - @equilibria/root/control/unstructured/UOwnable.sol

* At second address but not first
  - @equilibria/emptyset-batcher/interfaces/IEmptySetReserve.sol

* Diffs follow
...
diff --git a/temp-A5Qgkb/contracts/interfaces/IParamProvider.sol b/temp-mPCUS4/contracts/interfaces/IParamProvider.sol
index 23430d3..8d6c2f7 100644
--- a/temp-A5Qgkb/contracts/interfaces/IParamProvider.sol
+++ b/temp-mPCUS4/contracts/interfaces/IParamProvider.sol
@@ -20,10 +20,7 @@ interface IParamProvider {
        uint256 version
    );

    error [-ParamProviderInvalidMakerFee();-]
[-    error ParamProviderInvalidTakerFee();-]
[-    error ParamProviderInvalidPositionFee();-]
[-    error ParamProviderInvalidFundingFee();-]{+ParamProviderInvalidParamValue();+}

    function maintenance() external view returns (UFixed18);
    function updateMaintenance(UFixed18 newMaintenance) external;
...
```

