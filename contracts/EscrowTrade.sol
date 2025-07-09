// contracts/EscrowTrade.sol - FINAL VERSION

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EscrowTrade {

    struct TradeDetails {
        string item;
        uint256 units;
        uint256 pricePerUnit;
    }

    enum State { AWAITING_SELLER_CONFIRMATION, AWAITING_DELIVERY, COMPLETE, DISPUTED, AWAITING_PHASE_2 }

    address public buyer;
    address public seller;
    uint256 public amount;
    State public currentState;
    TradeDetails public details;
    address public chiefArbitrator;

    mapping(address => bool) public isVoter;
    mapping(address => bool) public hasVoted;
    uint256 public voterCount;
    uint256 public votesForBuyer;
    uint256 public votesForSeller;

    constructor(
        address _buyer,
        address _seller,
        TradeDetails memory _details,
        address[] memory _voters,
        address _chiefArbitrator
    ) payable {
        uint256 calculatedAmount = _details.units * _details.pricePerUnit;
        require(msg.value == calculatedAmount, "Payment must match units * price");
        require(_voters.length > 0, "At least one voter is required");

        buyer = _buyer;
        seller = _seller;
        amount = msg.value;
        details = _details;
        chiefArbitrator = _chiefArbitrator;
        currentState = State.AWAITING_SELLER_CONFIRMATION;

        for (uint i = 0; i < _voters.length; i++) {
            if (!isVoter[_voters[i]]) {
                isVoter[_voters[i]] = true;
                voterCount++;
            }
        }
    }

    receive() external payable {}

    modifier onlyBuyer() { require(msg.sender == buyer, "Only buyer"); _; }
    modifier onlySeller() { require(msg.sender == seller, "Only seller"); _; }
    modifier onlyChiefArbitrator() { require(msg.sender == chiefArbitrator, "Only chief arbitrator"); _; }

    event TradeConfirmedBySeller(address indexed seller);
    event DeliveryConfirmed(address indexed buyer);
    event DisputeRaised(address indexed buyer);
    event Voted(address indexed voter, bool votedForBuyer);
    event DisputeResolved(address indexed winner, bool refundedBuyer);
    event DisputeEscalatedToPhase2();

    function confirmTradeDetails() external onlySeller {
        require(currentState == State.AWAITING_SELLER_CONFIRMATION, "Not awaiting seller confirmation");
        currentState = State.AWAITING_DELIVERY;
        emit TradeConfirmedBySeller(seller);
    }

    function confirmDelivery() external onlyBuyer {
        require(currentState == State.AWAITING_DELIVERY, "Not awaiting delivery");
        currentState = State.COMPLETE;
        payable(seller).transfer(amount);
        emit DeliveryConfirmed(buyer);
    }

    function raiseDispute() external onlyBuyer {
        require(currentState == State.AWAITING_DELIVERY, "Not in delivery state");
        currentState = State.DISPUTED;
        emit DisputeRaised(buyer);
    }

    function castVote(bool _voteForBuyer) external {
        require(currentState == State.DISPUTED, "No active dispute");
        require(isVoter[msg.sender], "Not a voter");
        require(!hasVoted[msg.sender], "Already voted");

        hasVoted[msg.sender] = true;
        if (_voteForBuyer) { votesForBuyer++; } else { votesForSeller++; }
        emit Voted(msg.sender, _voteForBuyer);
    }

    function tallyVotesAndResolve() external {
        require(currentState == State.DISPUTED, "No active dispute");
        uint256 totalVotes = votesForBuyer + votesForSeller;
        require(totalVotes > 0, "No votes cast");

        uint256 percentForBuyer = (votesForBuyer * 100) / totalVotes;
        uint256 percentForSeller = 100 - percentForBuyer;
        uint256 difference = (percentForBuyer > percentForSeller) ? (percentForBuyer - percentForSeller) : (percentForSeller - percentForBuyer);
        
        if (difference <= 10) {
            currentState = State.AWAITING_PHASE_2;
            emit DisputeEscalatedToPhase2();
        } else {
            currentState = State.COMPLETE;
            if (votesForBuyer > votesForSeller) {
                payable(buyer).transfer(amount);
                emit DisputeResolved(buyer, true);
            } else {
                payable(seller).transfer(amount);
                emit DisputeResolved(seller, false);
            }
        }
    }

    function resolvePhase2Dispute(bool _refundBuyer) external onlyChiefArbitrator {
        require(currentState == State.AWAITING_PHASE_2, "Not in Phase 2");
        currentState = State.COMPLETE;

        if (_refundBuyer) {
            payable(buyer).transfer(amount);
            emit DisputeResolved(buyer, true);
        } else {
            payable(seller).transfer(amount);
            emit DisputeResolved(seller, false);
        }
    }

    // --- THIS FUNCTION IS CRITICAL FOR THE FRONTEND ---
    function getTradeDetails() public view returns (
        address,
        address,
        uint256,
        State,
        TradeDetails memory,
        uint256,
        uint256,
        address
    ) {
        return (
            buyer,
            seller,
            amount,
            currentState,
            details,
            votesForBuyer,
            votesForSeller,
            chiefArbitrator
        );
    }
}