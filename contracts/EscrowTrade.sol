// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EscrowTrade {
    enum State {AWAITING_DELIVERY, COMPLETE, DISPUTED }

    address public buyer;
    address public seller;
    uint256 public amount;
    State public currentState;
    address public arbitrator; // DAO or multisig address

    constructor(address _buyer, address _seller, uint256 _amount, address _arbitrator) payable {
        buyer = _buyer;
        seller = _seller;
        amount = _amount; // Amount is passed from the factory, not msg.value directly here
        currentState = State.AWAITING_DELIVERY;
        arbitrator = _arbitrator;
    }

    receive() external payable {
        // This function will be called if ETH is sent to the contract address
        // without calling a specific function.
        // It's crucial if the factory forwards funds to this new contract instance.
    }


    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer can call this");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this");
        _;
    }

    event DeliveryConfirmed(address indexed buyer, address indexed seller, uint256 amount);

    function confirmDelivery() external onlyBuyer {
        require(currentState == State.AWAITING_DELIVERY, "Not awaiting delivery");
        currentState = State.COMPLETE;
        payable(seller).transfer(amount);
        emit DeliveryConfirmed(buyer, seller, amount);
    }

    event DisputeRaised(address indexed buyer, address indexed seller, uint256 amount);

    function raiseDispute() external onlyBuyer {
        require(currentState == State.AWAITING_DELIVERY, "Not disputable");
        currentState = State.DISPUTED;
        emit DisputeRaised(buyer, seller, amount);
    }

    event DisputeResolved(address indexed winner, uint256 amount, bool refundedBuyer);

    function resolveDispute(bool refundBuyer) external {
        require(msg.sender == arbitrator, "Only arbitrator");
        require(currentState == State.DISPUTED, "No active dispute");

        if (refundBuyer) {
            payable(buyer).transfer(amount); // Refund buyer
            emit DisputeResolved(buyer, amount, true);
        } else {
            payable(seller).transfer(amount); // Release to seller
            emit DisputeResolved(seller, amount, false);
        }
        currentState = State.COMPLETE;
    }

    function getTradeDetails() public view returns (address, address, uint256, State) {
        return (buyer, seller, amount, currentState);
    }
}