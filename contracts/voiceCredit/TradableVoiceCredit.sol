// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.2;

import {InitialVoiceCreditProxy} from "maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";
import {SignUpGatekeeper} from "maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol";
import {MACI} from "maci-contracts/contracts/MACI.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/*
 * Idea: Let specific ERC20 token be capable of converting to a number of voice credits.
 */
contract TradableVoiceCredit is InitialVoiceCreditProxy, SignUpGatekeeper {
    uint256 public voiceCreditFactor = 10**18;

    // the token which can be converted to voice credit
    ERC20 public nativeToken;

    // the address to collect token that raised from voice credit.
    address public target;

    // the amount that voice credit buyer can get
    mapping(address => uint256) private voiceCreditBalance;

    constructor(ERC20 _nativeToken, address _target) {
        nativeToken = _nativeToken;
        target = _target;
    }

    function setMaciInstance(MACI _maci) public override {}

    /*
     * Registers the user without any restrictions.
     */
    function register(address, bytes memory) public override {}

    /*
     * Tradable voice credits
     * BUG: Because user’s voice credit balance is reset
     * to this number for every new poll. If we want to bind ERC20
     * token to voice credit, we can only use poll id 0 and should deploy
     * another maci contracts for next poll. Otherwise, voter can get
     * voice credit in poll id 1 without any payment.
     */
    function getVoiceCredits(address _voter, bytes memory)
        public
        view
        override
        returns (uint256)
    {
        require(
            voiceCreditBalance[_voter] > 0,
            "QuadraticVoting: voter do not have any voice credit"
        );
        // TODO: add a constraint to only let the first poll process
        return voiceCreditBalance[_voter];
    }

    /*
     * TODO: The limit on voice credits is 2 ^ 32 which is hardcoded into the MessageValidator
     * circuit, so voiceCreditBalance should less equal than 4294967296.
     */
    function buyVoiceCredit(uint256 _amount) public {
        nativeToken.transfer(target, _amount);
        voiceCreditBalance[msg.sender] = _amount / voiceCreditFactor;
    }
}
