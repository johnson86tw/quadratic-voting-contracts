// SPDX-License-Identifier: MIT
pragma solidity ^0.7.2;

abstract contract SignUpGatekeeper2 {
    function register(address _user, bytes32[] calldata _data)
        public
        virtual
        returns (bool)
    {}
}
