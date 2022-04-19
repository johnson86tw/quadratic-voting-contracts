// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.2;

import {InitialVoiceCreditProxy} from "maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";
import {SignUpGatekeeper} from "maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol";
import {MACI} from "maci-contracts/contracts/MACI.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/*
 * Idea: Let owner set voice credit balance before each round of poll.
 */
contract AdjustableVoiceCredit is
    Ownable,
    InitialVoiceCreditProxy,
    SignUpGatekeeper
{
    uint256 public budget = 100;

    function setMaciInstance(MACI _maci) public override {}

    /*
     * Registers the user without any restrictions.
     */
    function register(address, bytes memory) public override {}

    function getVoiceCredits(address, bytes memory)
        public
        view
        override
        returns (uint256)
    {
        return budget;
    }

    /*
     * BUG: How to restrict owner to adjusting budget in the voting period?
     */
    function setBudget(uint256 _budget) public onlyOwner {
        // TODO: only before deploying poll
        budget = _budget;
    }
}
