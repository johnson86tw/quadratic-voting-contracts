// SPDX-License-Identifier: GPL-3.0
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.2;

import {IMACI} from "maci-contracts/contracts/IMACI.sol";
import {Params} from "maci-contracts/contracts/Params.sol";
import {Hasher} from "maci-contracts/contracts/crypto/Hasher.sol";
import {Verifier} from "maci-contracts/contracts/crypto/Verifier.sol";
import {SnarkCommon} from "maci-contracts/contracts/crypto/SnarkCommon.sol";
import {SnarkConstants} from "maci-contracts/contracts/crypto/SnarkConstants.sol";
import {DomainObjs, IPubKey, IMessage} from "maci-contracts/contracts/DomainObjs.sol";
import {AccQueue, AccQueueQuinaryMaci} from "maci-contracts/contracts/trees/AccQueue.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {VkRegistry} from "maci-contracts/contracts/VkRegistry.sol";
import {EmptyBallotRoots} from "maci-contracts/contracts/trees/EmptyBallotRoots.sol";
import {PollDeploymentParams, MessageAqFactory} from "maci-contracts/contracts/Poll.sol";
import {Donation} from "./Donation.sol";

/**
 * @dev As same as the PollFactory contract,
 * just change the Poll contract to the Donation contract.
 */
contract DonationFactory is
    Params,
    IPubKey,
    IMessage,
    Ownable,
    Hasher,
    PollDeploymentParams
{
    MessageAqFactory public messageAqFactory;

    function setMessageAqFactory(MessageAqFactory _messageAqFactory)
        public
        onlyOwner
    {
        messageAqFactory = _messageAqFactory;
    }

    /*
     * Deploy a new Poll contract and AccQueue contract for messages.
     */
    function deploy(
        uint256 _duration,
        MaxValues memory _maxValues,
        TreeDepths memory _treeDepths,
        BatchSizes memory _batchSizes,
        PubKey memory _coordinatorPubKey,
        VkRegistry _vkRegistry,
        IMACI _maci,
        address _pollOwner
    ) public onlyOwner returns (Donation) {
        uint256 treeArity = 5;

        // Validate _maxValues
        // NOTE: these checks may not be necessary. Removing them will save
        // 0.28 Kb of bytecode.

        // maxVoteOptions must be less than 2 ** 50 due to circuit limitations;
        // it will be packed as a 50-bit value along with other values as one
        // of the inputs (aka packedVal)

        require(
            _maxValues.maxMessages <=
                treeArity**uint256(_treeDepths.messageTreeDepth) &&
                _maxValues.maxMessages >= _batchSizes.messageBatchSize &&
                _maxValues.maxMessages % _batchSizes.messageBatchSize == 0 &&
                _maxValues.maxVoteOptions <=
                treeArity**uint256(_treeDepths.voteOptionTreeDepth) &&
                _maxValues.maxVoteOptions < (2**50),
            "PollFactory: invalid _maxValues"
        );

        AccQueue messageAq = messageAqFactory.deploy(
            _treeDepths.messageTreeSubDepth
        );

        ExtContracts memory extContracts;

        // TODO: remove _vkRegistry; only PollProcessorAndTallyer needs it
        extContracts.vkRegistry = _vkRegistry;
        extContracts.maci = _maci;
        extContracts.messageAq = messageAq;

        Donation poll = new Donation(
            _duration,
            _maxValues,
            _treeDepths,
            _batchSizes,
            _coordinatorPubKey,
            extContracts
        );

        // Make the Poll contract own the messageAq contract, so only it can
        // run enqueue/merge
        messageAq.transferOwnership(address(poll));

        // TODO: should this be _maci.owner() instead?
        poll.transferOwnership(_pollOwner);

        return poll;
    }
}
