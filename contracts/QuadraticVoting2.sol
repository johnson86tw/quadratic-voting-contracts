// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.2;

import {InitialVoiceCreditProxy} from "maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";
import {SignUpGatekeeper} from "maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol";
import {MACI} from "maci-contracts/contracts/MACI.sol";
import {Whitelist} from "./voterRegistry/Whitelist.sol";
import {SimpleVoteOption} from "./voteOption/SimpleVoteOption.sol";

/*
 * This is the most simple contract for implementing MACI
 */
contract QuadraticVoting2 is
    InitialVoiceCreditProxy,
    Whitelist,
    SimpleVoteOption
{
    uint256 public balance = 99;

    constructor(bytes32 _merkleRoot) Whitelist(_merkleRoot) {}

    /*
     * Constant initial voice credits
     */
    function getVoiceCredits(address, bytes memory)
        public
        view
        override
        returns (uint256)
    {
        return balance;
    }
}
