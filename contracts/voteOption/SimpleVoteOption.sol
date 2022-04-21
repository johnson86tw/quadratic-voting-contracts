// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.2;

import {MACI} from "maci-contracts/contracts/MACI.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleVoteOption is Ownable {
    MACI public maci;
    uint256 public pollId;

    event Option(uint256 indexed index, string content);

    constructor(MACI _maci, uint256 _pollId) {
        maci = _maci;
        pollId = _pollId;
    }

    function setOption(uint256 _optionIndex, string calldata _content)
        public
        onlyOwner
    {
        emit Option(_optionIndex, _content);
    }
}
