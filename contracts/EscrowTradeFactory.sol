// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./EscrowTrade.sol"; // Import the EscrowTrade contract

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

    function createTrade(address _seller, address _arbitrator) external payable returns (address newEscrowAddress) {
        require(msg.value > 0, "Amount must be greater than zero");

        EscrowTrade newEscrow = new EscrowTrade(msg.sender, _seller, msg.value, _arbitrator);

        emit TradeCreated(msg.sender, _seller, msg.value, address(newEscrow), nextTradeId);
        nextTradeId++;

        return address(newEscrow);
    }
}