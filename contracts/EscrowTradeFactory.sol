// contracts/EscrowTradeFactory.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./EscrowTrade.sol"; 

contract EscrowTradeFactory {
    event TradeCreated(
        address indexed buyer,
        address indexed seller,
        uint256 amount,
        address indexed escrowContractAddress,
        uint256 tradeId
    );

    uint256 public nextTradeId;

    constructor() {
        nextTradeId = 1;
    }

    // The function now accepts an array of voter addresses
    function createTrade(address _seller, address[] memory _voters, address _chiefArbitrator) external payable returns (address newEscrowAddress) {
        require(msg.value > 0, "Amount must be greater than zero");

        // We pass the list of voters to the new EscrowTrade's constructor
        EscrowTrade newEscrow = new EscrowTrade{value: msg.value}(msg.sender, _seller, msg.value, _voters,_chiefArbitrator);

        emit TradeCreated(msg.sender, _seller, msg.value, address(newEscrow), nextTradeId);
        nextTradeId++;

        return address(newEscrow);
    }
}