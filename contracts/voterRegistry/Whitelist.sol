// SPDX-License-Identifier: GPL-3.0
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.2;

import "@openzeppelin/contracts/cryptography/MerkleProof.sol";

contract Whitelist {
    bytes32 public merkleRoot;

    constructor(bytes32 _merkleRoot) {
        merkleRoot = _merkleRoot;
    }

    function isWhitelisted(address _user, bytes32[] calldata _merkleProof)
        public
        view
        returns (bool)
    {
        bytes32 leaf = keccak256(abi.encodePacked(_user));
        require(
            MerkleProof.verify(_merkleProof, merkleRoot, leaf),
            "Whitelist: Incorrect proof or address isn't whitelisted"
        );
        return true;
    }
}
