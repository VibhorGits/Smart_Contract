// contracts/EscrowTrade.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EscrowTrade {
    enum State { AWAITING_DELIVERY, COMPLETE, DISPUTED, AWAITING_PHASE_2 } // Added new state for Phase 2

    address public buyer;
    address public seller;
    uint256 public amount;
    State public currentState;

    // --- PHASE 2: NEW ADDRESS FOR THE CHIEF ARBITRATOR ---
    address public chiefArbitrator;

    // --- Phase 1 VOTING VARIABLES ---
    mapping(address => bool) public isVoter;
    mapping(address => bool) public hasVoted;
    uint256 public voterCount;
    uint256 public votesForBuyer;  // Count of votes to refund the buyer
    uint256 public votesForSeller; // Count of votes to release to the seller

    // The constructor now accepts an array of voter addresses instead of a single arbitrator
    constructor(address _buyer, address _seller, uint256 _amount, address[] memory _voters, address _chiefArbitrator) payable {
        require(_voters.length > 0, "At least one voter is required");
        require(_chiefArbitrator != address(0), "Chief arbitrator address cannot be zero");
        
        buyer = _buyer;
        seller = _seller;
        amount = _amount;
        chiefArbitrator = _chiefArbitrator; // Set the Phase 2 arbitrator
        currentState = State.AWAITING_DELIVERY;

        // Register all the addresses from the _voters array as eligible voters
        for (uint i = 0; i < _voters.length; i++) {
            address voter = _voters[i];
            if (!isVoter[voter]) {
                isVoter[voter] = true;
                voterCount++;
            }
        }
    }

    receive() external payable {}

    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer can call this");
        _;
    }

    // --- PHASE 2: NEW MODIFIER FOR THE CHIEF ARBITRATOR ---
    modifier onlyChiefArbitrator() {
        require(msg.sender == chiefArbitrator, "Only the chief arbitrator can call this");
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

    // --- NEW VOTING FUNCTION ---
    event Voted(address indexed voter, bool votedForBuyer);

    function castVote(bool _voteForBuyer) external {
        require(currentState == State.DISPUTED, "No active dispute to vote on");
        require(isVoter[msg.sender], "You are not an authorized voter for this trade");
        require(!hasVoted[msg.sender], "You have already voted");

        hasVoted[msg.sender] = true;

        if (_voteForBuyer) {
            votesForBuyer++;
        } else {
            votesForSeller++;
        }

        emit Voted(msg.sender, _voteForBuyer);
    }

    // --- REFACTORED DISPUTE RESOLUTION FUNCTION ---
    event DisputeResolved(address indexed winner, uint256 amount, bool refundedBuyer);
    event DisputeEscalatedToPhase2(uint256 votesForBuyer, uint256 votesForSeller);

    function tallyVotesAndResolve() external {
        require(currentState == State.DISPUTED, "No active dispute to resolve");

        uint256 totalVotes = votesForBuyer + votesForSeller;
        require(totalVotes > 0, "No votes have been cast yet");

        uint256 percentForBuyer = (votesForBuyer * 100) / totalVotes;
        uint256 percentForSeller = (votesForSeller * 100) / totalVotes;

        // Check if the vote margin is too close (within +/- 5%, so a total difference of 10%)
        uint256 difference = (percentForBuyer > percentForSeller) ? (percentForBuyer - percentForSeller) : (percentForSeller - percentForBuyer);
        
        if (difference <= 5) {
            // Margin is too close, escalate to Phase 2
            currentState = State.AWAITING_PHASE_2;
            emit DisputeEscalatedToPhase2(votesForBuyer, votesForSeller);
            // NOTE: In a real implementation, you'd trigger your Phase 2 mechanism here.
        } else {
            // We have a clear winner
            currentState = State.COMPLETE;
            if (votesForBuyer > votesForSeller) {
                // Refund the buyer
                payable(buyer).transfer(amount);
                emit DisputeResolved(buyer, amount, true);
            } else {
                // Release funds to the seller
                payable(seller).transfer(amount);
                emit DisputeResolved(seller, amount, false);
            }
        }
    }

    // --- PHASE 2: NEW FUNCTION TO RESOLVE THE DISPUTE ---
    function resolvePhase2Dispute(bool _refundBuyer) external onlyChiefArbitrator {
        require(currentState == State.AWAITING_PHASE_2, "Contract is not awaiting Phase 2 resolution");
        currentState = State.COMPLETE;

        if (_refundBuyer) {
            // Refund the buyer
            payable(buyer).transfer(amount);
            emit DisputeResolved(buyer, amount, true);
        } else {
            // Release funds to the seller
            payable(seller).transfer(amount);
            emit DisputeResolved(seller, amount, false);
        }
    }

    function getTradeDetails() public view returns (address, address, uint256, State, uint256, uint256) {
        return (buyer, seller, amount, currentState, votesForBuyer, votesForSeller);
    }
}