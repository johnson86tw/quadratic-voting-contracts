// SPDX-License-Identifier: GPL-3.0
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.2;

import {PollFactory} from "maci-contracts/contracts/Poll.sol";
import {Poll} from "maci-contracts/contracts/Poll.sol";
import {SimpleVoteOption} from "../voteOption/SimpleVoteOption.sol";

contract Donation is Poll, SimpleVoteOption {
    mapping(address => uint256) donations;
    mapping(uint256 => address payable) recipients;
    uint256 public totalVotes;

    constructor(
        uint256 _duration,
        MaxValues memory _maxValues,
        TreeDepths memory _treeDepths,
        BatchSizes memory _batchSizes,
        PubKey memory _coordinatorPubKey,
        ExtContracts memory _extContracts
    )
        Poll(
            _duration,
            _maxValues,
            _treeDepths,
            _batchSizes,
            _coordinatorPubKey,
            _extContracts
        )
    {}

    // @todo only called from constructor
    function _setRecipient(uint256 _optionIndex, address payable _recipient)
        private
    {
        recipients[_optionIndex] = _recipient;
    }

    // @todo donate ether to this contract
    function donate() public payable {}

    // @todo withdraw ether from this contract
    function withdraw() public {}

    function transfer(
        uint256 _voteOptionIndex,
        uint256 _votes,
        uint256[][] memory _tallyResultProof,
        uint256 _spentVoiceCreditsHash,
        uint256 _perVOSpentVoiceCreditsHash,
        uint256 _tallyCommitment
    ) public payable {
        bool resultVerified = verifyTallyResult(
            _voteOptionIndex,
            _votes,
            _tallyResultProof,
            _spentVoiceCreditsHash,
            _perVOSpentVoiceCreditsHash,
            _tallyCommitment
        );
        require(resultVerified, "Hackathon: Incorrect tally result");

        uint256 amount = getAllocatedAmount(_votes);
        recipients[_voteOptionIndex].transfer(amount);
    }

    function getAllocatedAmount(uint256 _votes) public view returns (uint256) {
        return (address(this).balance * _votes) / totalVotes;
    }

    function publishMessageBatch(
        Message[] calldata _messages,
        PubKey[] calldata _encPubKeys
    ) external {
        uint256 batchSize = _messages.length;
        for (uint8 i = 0; i < batchSize; i++) {
            publishMessage(_messages[i], _encPubKeys[i]);
        }
    }
}
