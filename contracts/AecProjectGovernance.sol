// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AecProjectGovernance
 * @dev نظام حوكمة التمويل التشاركي - صندوق النسر العربي السيادي A.E.C.
 * يثبت ملكية الصندوق لنسبة 60% وحق الإدارة المطلق وحظر التفريط
 */
contract AecProjectGovernance {

    enum ProjectStatus { EVALUATION, ACTIVE, UNDER_AUDIT, TAKEOVER, TERMINATED }

    struct Partnership {
        bytes32 projectId;
        address operatorPartner;
        uint256 totalFundingYER;
        uint256 fundSharePermille; // 600 تعادل 60% نصيب الأسد لصندوق A.E.C
        uint256 operatorSharePermille; // 400 تعادل 40% للشريك التشغيلي
        uint256 votingPowerFund; // 60% قوة تصويتية قطعية
        ProjectStatus status;
        bool misconductFlag;
    }

    address public fundGovernor;
    mapping(bytes32 => Partnership) public partnerships;

    event ProjectFunded(bytes32 indexed projectId, address indexed operator, uint256 fundingAmount);
    event ManagementTakeoverTriggered(bytes32 indexed projectId, string reason);
    event OperatorDividendsFrozen(bytes32 indexed projectId, uint256 frozenAmount);

    modifier onlyGovernor() {
        require(msg.sender == fundGovernor, "AEC Governance: Governor access required");
        _;
    }

    constructor() {
        fundGovernor = msg.sender;
    }

    // 1. تسجيل شراكة تمويلية جديدة بنسبة 60% ثابته وموثقة للصندوق
    function initiateFundingProject(
        bytes32 _projectId,
        address _operator,
        uint256 _amountYER
    ) external onlyGovernor {
        require(partnerships[_projectId].totalFundingYER == 0, "AEC Gov: Project already exists");

        partnerships[_projectId] = Partnership({
            projectId: _projectId,
            operatorPartner: _operator,
            totalFundingYER: _amountYER,
            fundSharePermille: 600, // 60% القطعية
            operatorSharePermille: 400,
            votingPowerFund: 60,
            status: ProjectStatus.ACTIVE,
            misconductFlag: false
        });

        emit ProjectFunded(_projectId, _operator, _amountYER);
    }

    // 2. إنفاذ بند العزل السريع وإقصاء الشريك التشغيلي فوراً عند رصد سوء الإدارة
    function enforceManagementTakeover(bytes32 _projectId, string memory _evidenceReason) external onlyGovernor {
        Partnership storage project = partnerships[_projectId];
        require(project.status == ProjectStatus.ACTIVE || project.status == ProjectStatus.UNDER_AUDIT, "AEC Gov: Project inoperable");

        project.status = ProjectStatus.TAKEOVER;
        project.misconductFlag = true;
        project.operatorSharePermille = 0; // تجميد ومصادرة عوائد الشريك التفريطية تعويضاً للخسائر

        emit ManagementTakeoverTriggered(_projectId, _evidenceReason);
    }
}
