// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.2;

import {MACI} from "maci-contracts/contracts/MACI.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleVoteOption is Ownable {
    MACI public maci;

    event Option(
        uint256 indexed pollId,
        uint256 indexed index,
        string metadata
    );

    constructor(MACI _maci) {
        maci = _maci;
    }

    function setOption(
        uint256 _pollId,
        uint256 _optionIndex,
        string calldata _metadata
    ) public onlyOwner {
        emit Option(_pollId, _optionIndex, _metadata);
    }
}
