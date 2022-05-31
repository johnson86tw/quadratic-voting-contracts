// SPDX-License-Identifier: GPL-3.0
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.2;

import "@openzeppelin/contracts/cryptography/MerkleProof.sol";
import {SignUpGatekeeper2} from "./SignUpGatekeeper2.sol";

contract Whitelist is SignUpGatekeeper2 {
    bytes32 public merkleRoot;

    constructor(bytes32 _merkleRoot) {
        merkleRoot = _merkleRoot;
    }

    /**
     * @dev implement SignUpGatekeeper2 contract for MACI2
     */
    function register(address _voter, bytes32[] calldata _proof)
        public
        view
        override
        returns (bool)
    {
        bytes32 leaf = keccak256(abi.encodePacked(_voter));
        require(
            MerkleProof.verify(_proof, merkleRoot, leaf),
            "Whitelist: voter isn't whitelisted or incorrect proof"
        );
        return true;
    }
}
