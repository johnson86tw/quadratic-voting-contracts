// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.2;

import {InitialVoiceCreditProxy} from "maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";
import {SignUpGatekeeper} from "maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol";
import {MACI} from "maci-contracts/contracts/MACI.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/*
 * Idea: Let owner set voice credit voiceCreditBalance before each round of poll.
 */
contract AdjustableVoiceCredit is
    Ownable,
    InitialVoiceCreditProxy,
    SignUpGatekeeper
{
    uint256 public voiceCreditBalance = 100;

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
        return voiceCreditBalance;
    }

    /*
     * Adjustable voice credits
     * BUG: In this case, because user’s voice credit balance is reset
     * to the number of voiceCreditBalance for every new poll.
     * If the owner want to change voice credit balance, the owner
     * should deploy another maci contract for the next poll. Otherwise,
     * voters can get voice credit in poll id 1 as the number in the last poll.
     */
    function setVoiceCreditBalance(uint256 _voiceCreditBalance, MACI _maci)
        public
        onlyOwner
    {
        require(
            address(_maci.initialVoiceCreditProxy()) == address(this),
            "AdjustableVoiceCredit: Incorrect MACI contract"
        );
        require(
            _maci.isInitialised() == false,
            "AdjustableVoiceCredit: Initailzed MACI cannot change voiceCreditBalance"
        );
        voiceCreditBalance = _voiceCreditBalance;
    }
}
