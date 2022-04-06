// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.2;

import {SignUpGatekeeper} from "maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol";
import {MACI} from "maci-contracts/contracts/MACI.sol";

contract FreeForAllGatekeeper is SignUpGatekeeper {
    function setMaciInstance(MACI _maci) public override {}

    /*
     * Registers the user without any restrictions.
     */
    function register(address, bytes memory) public override {}
}
