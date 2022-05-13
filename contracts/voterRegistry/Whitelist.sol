// SPDX-License-Identifier: GPL-3.0
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.2;

import "@openzeppelin/contracts/cryptography/MerkleProof.sol";
import {MACI} from "maci-contracts/contracts/MACI.sol";
import {SignUpGatekeeper} from "maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol";

contract Whitelist is SignUpGatekeeper {
    bytes32 public merkleRoot;

    constructor(bytes32 _merkleRoot) {
        merkleRoot = _merkleRoot;
    }

    function setMaciInstance(MACI _maci) public override {}

    /**
     * @dev implement SignUpGatekeeper contract for maci
     */
    function register(address _voter, bytes memory _data) public view override {
        bytes32[] memory merkleProof = bytesToBytes32Array(_data);
        bytes32 leaf = keccak256(abi.encodePacked(_voter));
        require(
            MerkleProof.verify(merkleProof, merkleRoot, leaf),
            "Whitelist: voter isn't whitelisted or incorrect proof"
        );
    }

    // refer to https://stackoverflow.com/questions/59243982/how-to-correct-convert-bytes-to-bytes32-and-then-convert-back
    function bytesToBytes32Array(bytes memory data)
        public
        pure
        returns (bytes32[] memory)
    {
        // Find 32 bytes segments nb
        uint256 dataNb = data.length / 32;
        // Create an array of dataNb elements
        bytes32[] memory dataList = new bytes32[](dataNb);
        // Start array index at 0
        uint256 index = 0;
        // Loop all 32 bytes segments
        for (uint256 i = 32; i <= data.length; i = i + 32) {
            bytes32 temp;
            // Get 32 bytes from data
            assembly {
                temp := mload(add(data, i))
            }
            // Add extracted 32 bytes to list
            dataList[index] = temp;
            index++;
        }
        // Return data list
        return (dataList);
    }
}
