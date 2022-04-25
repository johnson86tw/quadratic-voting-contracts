// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.2;

import {InitialVoiceCreditProxy} from "maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";
import {SignUpGatekeeper} from "maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol";
import {MACI} from "maci-contracts/contracts/MACI.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

/*
 * Idea: Let specific ERC20 token be capable of converting to a number of voice credits.
 */
contract TradableVoiceCredit is InitialVoiceCreditProxy, SignUpGatekeeper {
    using SafeERC20 for ERC20;

    // MACI allows 2 ** 32 voice credits max
    uint256 private constant MAX_VOICE_CREDITS = 10**9;

    // the token which can be converted into the voice credit
    ERC20 public nativeToken;

    // for example, we can converted 1 ETH to 1 voice credit if voice credit factor is 10^18
    uint256 public voiceCreditFactor;

    // the address to collect token that raised from voice credit.
    address public target;

    // the amount that voice credit buyer can get
    mapping(address => uint256) private voiceCreditBalance;

    constructor(
        ERC20 _nativeToken,
        uint256 _voiceCreditFactor,
        address _target
    ) {
        nativeToken = _nativeToken;
        voiceCreditFactor = _voiceCreditFactor;
        target = _target;
    }

    function setMaciInstance(MACI _maci) public override {}

    /*
     * Registers the user without any restrictions.
     */
    function register(address, bytes memory) public override {}

    /**
     * @dev Tradable voice credits
     * BUG: In this case,  because user’s voice credit balance is reset
     * to the number of voiceCreditBalance for every new poll.
     * If we want to bind an ERC20 token to voice credit,
     * we can only use poll id 0 and should deploy another maci contract
     * for the next poll. Otherwise, voters can get voice credit in poll id 1
     * as the number in the last poll but without any payment.
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

    function buyVoiceCredit(uint256 _amount) public {
        require(
            _amount <= MAX_VOICE_CREDITS * voiceCreditFactor,
            "TradableVoiceCredit: amount is too large"
        );
        require(
            _amount % voiceCreditFactor == 0,
            "TradableVoiceCredit: amount should be divisible by voice credit factor"
        );
        nativeToken.safeTransferFrom(msg.sender, target, _amount);
        voiceCreditBalance[msg.sender] = _amount / voiceCreditFactor;
    }
}
