// contracts/EscrowTrade.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EscrowTrade {

    // --- NEW: A struct to hold detailed information about the trade ---
    struct TradeDetails {
        string item;         // Description of the item being traded
        uint256 units;       // Number of units
        uint256 pricePerUnit; // Price for each unit
    }

    // --- NEW: Added AWAITING_SELLER_CONFIRMATION as the initial state ---
    enum State { AWAITING_SELLER_CONFIRMATION, AWAITING_DELIVERY, COMPLETE, DISPUTED, AWAITING_PHASE_2 }

    address public buyer;
    address public seller;
    uint256 public amount; // This will now be calculated from price * units
    State public currentState;
    TradeDetails public details;

    // Phase 2
    address public chiefArbitrator;

    // Phase 1
    mapping(address => bool) public isVoter;
    mapping(address => bool) public hasVoted;
    uint256 public voterCount;
    uint256 public votesForBuyer;
    uint256 public votesForSeller;

    // The constructor now takes the TradeDetails struct
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
        require(_chiefArbitrator != address(0), "Chief arbitrator is required");

        buyer = _buyer;
        seller = _seller;
        amount = msg.value;
        details = _details;
        chiefArbitrator = _chiefArbitrator;
        currentState = State.AWAITING_SELLER_CONFIRMATION; // Start in the new state

        for (uint i = 0; i < _voters.length; i++) {
            if (!isVoter[_voters[i]]) {
                isVoter[_voters[i]] = true;
                voterCount++;
            }
        }
    }

    receive() external payable {}

    // --- MODIFIERS ---
    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer can call this");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only seller can call this");
        _;
    }

    modifier onlyChiefArbitrator() {
        require(msg.sender == chiefArbitrator, "Only the chief arbitrator can call this");
        _;
    }

    // --- EVENTS ---
    event TradeConfirmedBySeller(address indexed seller);
    event DeliveryConfirmed(address indexed buyer, address indexed seller, uint256 amount);
    event DisputeRaised(address indexed buyer, address indexed seller, uint256 amount);
    event Voted(address indexed voter, bool votedForBuyer);
    event DisputeResolved(address indexed winner, uint256 amount, bool refundedBuyer);
    event DisputeEscalatedToPhase2(uint256 votesForBuyer, uint256 votesForSeller);


    // --- NEW: Seller Confirmation Function ---
    function confirmTradeDetails() external onlySeller {
        require(currentState == State.AWAITING_SELLER_CONFIRMATION, "Not awaiting seller confirmation");
        currentState = State.AWAITING_DELIVERY;
        emit TradeConfirmedBySeller(seller);
    }

    function confirmDelivery() external onlyBuyer {
        require(currentState == State.AWAITING_DELIVERY, "Not awaiting delivery");
        currentState = State.COMPLETE;
        payable(seller).transfer(amount);
        emit DeliveryConfirmed(buyer, seller, amount);
    }

    function raiseDispute() external onlyBuyer {
        require(currentState == State.AWAITING_DELIVERY, "Not disputable in this state");
        currentState = State.DISPUTED;
        emit DisputeRaised(buyer, seller, amount);
    }

    function castVote(bool _voteForBuyer) external {
        require(currentState == State.DISPUTED, "No active dispute");
        require(isVoter[msg.sender], "Not an authorized voter");
        require(!hasVoted[msg.sender], "You have already voted");

        hasVoted[msg.sender] = true;
        if (_voteForBuyer) {
            votesForBuyer++;
        } else {
            votesForSeller++;
        }
        emit Voted(msg.sender, _voteForBuyer);
    }

    function tallyVotesAndResolve() external {
        require(currentState == State.DISPUTED, "No active dispute");
        uint256 totalVotes = votesForBuyer + votesForSeller;
        require(totalVotes > 0, "No votes cast");

        uint256 difference = (votesForBuyer > votesForSeller)
            ? ((votesForBuyer * 100) / totalVotes) - ((votesForSeller * 100) / totalVotes)
            : ((votesForSeller * 100) / totalVotes) - ((votesForBuyer * 100) / totalVotes);
        
        if (difference <= 10) {
            currentState = State.AWAITING_PHASE_2;
            emit DisputeEscalatedToPhase2(votesForBuyer, votesForSeller);
        } else {
            currentState = State.COMPLETE;
            if (votesForBuyer > votesForSeller) {
                payable(buyer).transfer(amount);
                emit DisputeResolved(buyer, amount, true);
            } else {
                payable(seller).transfer(amount);
                emit DisputeResolved(seller, amount, false);
            }
        }
    }

    function resolvePhase2Dispute(bool _refundBuyer) external onlyChiefArbitrator {
        require(currentState == State.AWAITING_PHASE_2, "Not awaiting Phase 2 resolution");
        currentState = State.COMPLETE;

        if (_refundBuyer) {
            payable(buyer).transfer(amount);
            emit DisputeResolved(buyer, amount, true);
        } else {
            payable(seller).transfer(amount);
            emit DisputeResolved(seller, amount, false);
        }
    }

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
