// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.2;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SignUpGatekeeper} from "maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol";
import {MACI} from "maci-contracts/contracts/MACI.sol";

/*
 * This is the most simple contract for implementing MACI
 */
contract SimpleVoterRegistry is SignUpGatekeeper, Ownable {
    mapping(address => bool) private voters;

    event VoterAdded(address indexed _voter);
    event VoterRemoved(address indexed _voter);

    function setMaciInstance(MACI _maci) public override {}

    function isVerified(address _voter) public view returns (bool) {
        return voters[_voter];
    }

    /**
     * @dev implement SignUpGatekeeper contract for maci
     */
    function register(address _voter, bytes memory) public view override {
        require(
            isVerified(_voter),
            "SimpleVoterRegistry: Voter has not been verified"
        );
    }

    /**
     * @dev Add verified voter to the registry.
     */
    function addUser(address _voter) external onlyOwner {
        require(
            _voter != address(0),
            "SimpleVoterRegistry: Voter address is zero"
        );
        require(!voters[_voter], "SimpleVoterRegistry: Voter already verified");
        voters[_voter] = true;
        emit VoterAdded(_voter);
    }

    /**
     * @dev Remove voter from the registry.
     */
    function removeUser(address _voter) external onlyOwner {
        require(
            voters[_voter],
            "SimpleVoterRegistry: Voter is not in the registry"
        );
        delete voters[_voter];
        emit VoterRemoved(_voter);
    }
}
