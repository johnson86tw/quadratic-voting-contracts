// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.7.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("My awesome token", "mat") {
        _mint(msg.sender, initialSupply);
    }
}
