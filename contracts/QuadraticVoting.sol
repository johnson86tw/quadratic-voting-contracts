// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.7.2;

import {ConstantInitialVoiceCreditProxy} from "./initialVoiceCreditProxy/ConstantInitialVoiceCreditProxy.sol";
import {FreeForAllGatekeeper} from "./signUpGatekeepers/FreeForAllGatekeeper.sol";

contract QuadraticVoting is
    ConstantInitialVoiceCreditProxy,
    FreeForAllGatekeeper
{
    constructor() ConstantInitialVoiceCreditProxy(100) {}
}
