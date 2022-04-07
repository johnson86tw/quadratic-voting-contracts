// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.2;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {InitialVoiceCreditProxy} from "maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";
import {SignUpGatekeeper} from "maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol";
import {MACI} from "maci-contracts/contracts/MACI.sol";

contract VotersAndCredits is
    InitialVoiceCreditProxy,
    SignUpGatekeeper,
    Ownable
{
    uint256 public voterBalance = 50;
    uint256 public judgeBalance = 100;

    mapping(address => bool) public voters;
    mapping(address => bool) public judges;

    event VoterAdded(address indexed _voter);
    event VoterRemoved(address indexed _voter);

    function isVoter(address _voter) public view returns (bool) {
        return voters[_voter];
    }

    function isJudge(address _judge) public view returns (bool) {
        return judges[_judge];
    }

    function addVoter(address _voter) external onlyOwner {
        require(
            _voter != address(0),
            "VotersAndCredits: Voter address is zero"
        );
        require(!voters[_voter], "VotersAndCredits: Voter already verified");
        voters[_voter] = true;
        emit VoterAdded(_voter);
    }

    function removeVoter(address _voter) external onlyOwner {
        require(
            voters[_voter],
            "VotersAndCredits: Voter is not in the registry"
        );
        delete voters[_voter];
        emit VoterRemoved(_voter);
    }

    function addJudge(address _judge) external onlyOwner {
        require(
            _judge != address(0),
            "VotersAndCredits: Voter address is zero"
        );
        require(!judges[_judge], "VotersAndCredits: Voter is already a judge");
        judges[_judge] = true;
    }

    function setMaciInstance(MACI _maci) public override {}

    function register(address _voter, bytes memory) public view override {
        require(
            isVoter(_voter),
            "VotersAndCredits: Voter has not been verified"
        );
    }

    function getVoiceCredits(address _voter, bytes memory)
        public
        view
        override
        returns (uint256)
    {
        if (isJudge(_voter)) {
            return judgeBalance;
        } else {
            return voterBalance;
        }
    }
}
