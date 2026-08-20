// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AecSovereignFund
 * @dev Sovereign Fund Node - Arabian Eagle Ecosystem (A.E.C.)
 * Implements 100,000,000 YER Minting, Zero-Interest Finance and RWA Collateral
 */
contract AecSovereignFund {

    enum LoanStatus { NONE, ACTIVE, REPAID, DEFAULTED }

    struct Collateral {
        string assetType;
        string geoCoordinates;
        uint256 valueInUSD;
    }

    struct Loan {
        bytes32 loanId;
        address beneficiary;
        uint256 principalYER;
        uint256 remainingYER;
        uint256 nextDueDate;
        LoanStatus status;
        Collateral assetCollateral;
    }

    address public governor;
    uint256 public totalSupplyYER;
    uint256 public constant MINT_CAP = 100000000 * 10**10; // 100,000,000 YER with 10 decimal precision

    mapping(address => uint256) public balances;
    mapping(bytes32 => Loan) public loans;

    event TokensMinted(address indexed to, uint256 amount);
    event LoanIssued(bytes32 indexed loanId, address indexed borrower, uint256 amountYER);
    event PaymentReceived(bytes32 indexed loanId, uint256 amountYER);

    modifier onlyGovernor() {
        require(msg.sender == governor, "AEC Auth: Governor access required");
        _;
    }

    constructor() {
        governor = msg.sender;
        // Minting the authorized 100,000,000 YER directly to the secure fund ecosystem vault
        totalSupplyYER = MINT_CAP;
        balances[address(this)] = MINT_CAP;
        emit TokensMinted(address(this), MINT_CAP);
    }

    function issueZeroInterestLoan(
        bytes32 _loanId,
        address _borrower,
        uint256 _amountYER,
        string memory _assetType,
        string memory _geo,
        uint256 _valUSD
    ) external onlyGovernor {
        require(balances[address(this)] >= _amountYER, "AEC Fund: Insufficient vault liquidity");
        require(loans[_loanId].principalYER == 0, "AEC Fund: Loan record already exists");

        Collateral memory security = Collateral(_assetType, _geo, _valUSD);
        loans[_loanId] = Loan({
            loanId: _loanId,
            beneficiary: _borrower,
            principalYER: _amountYER,
            remainingYER: _amountYER,
            nextDueDate: block.timestamp + 30 days,
            status: LoanStatus.ACTIVE,
            assetCollateral: security
        });

        balances[address(this)] -= _amountYER;
        balances[_borrower] += _amountYER;

        emit LoanIssued(_loanId, _borrower, _amountYER);
    }

    function collectInstallment(bytes32 _loanId, uint256 _amountYER) external onlyGovernor {
        Loan storage activeLoan = loans[_loanId];
        require(activeLoan.status == LoanStatus.ACTIVE, "AEC Fund: Loan inactive");
        require(_amountYER <= activeLoan.remainingYER, "AEC Fund: Overpayment check triggered");

        balances[activeLoan.beneficiary] -= _amountYER;
        balances[address(this)] += _amountYER;
        activeLoan.remainingYER -= _amountYER;

        if (activeLoan.remainingYER == 0) {
            activeLoan.status = LoanStatus.REPAID;
        }

        emit PaymentReceived(_loanId, _amountYER);
    }
}
