// SPDX-License-Identifier: GPL-3.0
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import {MACI} from "maci-contracts/contracts/MACI.sol";
import {PollFactory} from "maci-contracts/contracts/Poll.sol";
import {Poll} from "maci-contracts/contracts/Poll.sol";
import {SignUpGatekeeper} from "maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol";
import {InitialVoiceCreditProxy} from "maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";

contract Hackathon is MACI {
    using SafeERC20 for ERC20;
    ERC20 public nativeToken;

    mapping(uint256 => address) recipients;

    constructor(
        ERC20 _nativeToken,
        PollFactory _pollFactory,
        SignUpGatekeeper _signUpGatekeeper,
        InitialVoiceCreditProxy _initialVoiceCreditProxy
    ) MACI(_pollFactory, _signUpGatekeeper, _initialVoiceCreditProxy) {
        nativeToken = _nativeToken;
    }

    function setRecipient(uint256 _optionIndex, address _recipient) public {
        recipients[_optionIndex] = _recipient;
    }

    // TODO: should be fixed to specific poll
    function poolSize() public view returns (uint256) {
        return nativeToken.balanceOf(address(this));
    }

    // TODO: can't get the total votes from maci v1
    function totalVotes(uint256 pollId) public view returns (uint256) {
        // return maci.polls[pollId].totalVotes;
        return 500;
    }

    function claimPrize(
        uint256 _pollId,
        uint256 _voteOptionIndex,
        uint256 _votes,
        uint256[][] memory _tallyResultProof,
        uint256 _spentVoiceCreditsHash,
        uint256 _perVOSpentVoiceCreditsHash,
        uint256 _tallyCommitment
    ) public {
        Poll poll = getPoll(_pollId);

        bool resultVerified = poll.verifyTallyResult(
            _voteOptionIndex,
            _votes,
            _tallyResultProof,
            _spentVoiceCreditsHash,
            _perVOSpentVoiceCreditsHash,
            _tallyCommitment
        );
        require(resultVerified, "Hackathon: Incorrect tally result");

        uint256 amount = getAllocatedAmount(_pollId, _votes);
        nativeToken.safeTransfer(recipients[_voteOptionIndex], amount);
    }

    // TODO: Exclude options with <5% of the votes
    function getAllocatedAmount(uint256 _pollId, uint256 _votes)
        public
        view
        returns (uint256)
    {
        return (poolSize() * _votes) / totalVotes(_pollId);
    }
}
