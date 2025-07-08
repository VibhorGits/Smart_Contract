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

    // We need to reference the struct definition from the other contract

    constructor() {
        nextTradeId = 1;
    }

    // The function now accepts the trade details struct
    function createTrade(
        address _seller,
        EscrowTrade.TradeDetails memory _details,
        address[] memory _voters,
        address _chiefArbitrator
    ) external payable returns (address newEscrowAddress) {
        
        EscrowTrade newEscrow = new EscrowTrade{value: msg.value}(
            msg.sender,
            _seller,
            _details,
            _voters,
            _chiefArbitrator
        );

        emit TradeCreated(msg.sender, _seller, msg.value, address(newEscrow), nextTradeId);
        nextTradeId++;

        return address(newEscrow);
    }
}