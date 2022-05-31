// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.2;

import {InitialVoiceCreditProxy} from "maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";
import {Whitelist} from "./voterRegistry/Whitelist.sol";

/**
 * @dev This contract used Whitelist as the sign-up gatekeeper.
 */
contract QuadraticVoting2 is InitialVoiceCreditProxy, Whitelist {
    uint256 public voiceCreditBalance = 99;

    constructor(bytes32 _merkleRoot, uint256 _voiceCreditBalance)
        Whitelist(_merkleRoot)
    {
        voiceCreditBalance = _voiceCreditBalance;
    }

    function getVoiceCredits(address, bytes memory)
        public
        view
        override
        returns (uint256)
    {
        return voiceCreditBalance;
    }
}
