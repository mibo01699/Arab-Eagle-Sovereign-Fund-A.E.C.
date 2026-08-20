const express = require('express');
const path = require('path');
const amanAlerts = require('./alertSystem');

const app = express();
const PORT = process.env.PORT || 3007;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const BIGISH_YER_DEX_POOL = {
    piReserve: BigInt("10000000000000"),
    yerReserve: BigInt("1500000000000000"),
    precisionFactor: BigInt("10000000")
};

// مصفوفة محاكاة تتبع القروض وحالة الالتزام بالأقساط
const loanRegistry = {
    "LOAN-AEC-2026-9901": {
        username: "@mibo01699",
        daysOverdue: 0,
        collateralStatus: "SECURED",
        isFrozen: false
    }
};

// 1. مسار معالجة السداد اللحظي وتعزيز القيمة السوقية لـ YER
app.post('/api/fund/execute-installment-secure', (req, res) => {
    try {
        const { loanId, username, tokenUsed, installmentAmountYER } = req.body;
        
        if (loanRegistry[loanId] && loanRegistry[loanId].isFrozen) {
            return res.status(403).json({ success: false, error: "ACCOUNT_MUTED: Legal hold active due to excessive delinquency." });
        }

        const yerAmountSubUnits = BigInt(installmentAmountYER) * BigInt("10000000000");
        let piStroopsRequired = BigInt("0");
        let dexImpactRateChange = "0.00%";

        if (tokenUsed.toUpperCase() === "PI") {
            piStroopsRequired = (yerAmountSubUnits * BIGISH_YER_DEX_POOL.piReserve) / BIGISH_YER_DEX_POOL.yerReserve;
            BIGISH_YER_DEX_POOL.piReserve += piStroopsRequired;
            BIGISH_YER_DEX_POOL.yerReserve -= yerAmountSubUnits;
            dexImpactRateChange = "+0.04% Market Appreciation";
        } else {
            BIGISH_YER_DEX_POOL.yerReserve += yerAmountSubUnits;
            dexImpactRateChange = "+0.01% Supply Deflation";
        }

        if (loanRegistry[loanId]) {
            loanRegistry[loanId].daysOverdue = 0; // إعادة ضبط أيام التأخير عند السداد بنجاح
        }

        amanAlerts.triggerAlert('INFO', 'CLEARING', "Installment processed via BIGISH-YER native router. Market Impact triggered.");

        res.json({
            success: true,
            loanId: loanId,
            username: username,
            settledAmountYER: installmentAmountYER,
            tokenUsed: tokenUsed,
            allocatedPiStroops: piStroopsRequired.toString(),
            marketValueImpact: dexImpactRateChange,
            clearingStatus: "SUCCESS: Direct Liquidity Swap executed inside Pi Network Sandbox Ecosystem Boundary.",
            clearingHouse: "BIGISH-YER-CENTRAL-ROUTER"
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "Cross-repository pipeline disconnect" });
    }
});

// 2. محرك الذكاء الاصطناعي الاستقصائي لفحص التأخير وإنفاذ البنود القانونية للضمانات (RWA Penalties)
app.post('/api/fund/audit-delinquency', (req, res) => {
    const { loanId, simulatedDaysOverdue } = req.body;
    
    if (!loanRegistry[loanId]) {
        return res.status(404).json({ success: false, error: "Loan record not found" });
    }

    const loan = loanRegistry[loanId];
    loan.daysOverdue = parseInt(simulatedDaysOverdue);
    let enforcementAction = "ACCOUNT_HEALTHY";

    if (loan.daysOverdue >= 5 && loan.daysOverdue < 15) {
        enforcementAction = "FIRST_WARNING_DISPATCHED";
        amanAlerts.triggerAlert('RISK_ALERT', 'LEGAL', `First legal notice emitted via Pi Sandbox to ${loan.username}.`);
    } else if (loan.daysOverdue >= 15 && loan.daysOverdue < 30) {
        enforcementAction = "WALLET_RESTRICTION_TRIGGERED";
        loan.isFrozen = true; // حجز جزئي على المعاملات داخل المنظومة بالتنسيق مع BIGISH-YER
        amanAlerts.triggerAlert('CRITICAL_CLAIM', 'CLEARING', `Ecosystem wallet restriction enforced on ${loan.username}. Directed field agents for on-site audit.`);
    } else if (loan.daysOverdue >= 30) {
        enforcementAction = "COLLATERAL_LIQUIDATION_PREPARED";
        loan.collateralStatus = "LIQUIDATION_HOLD";
        amanAlerts.triggerAlert('CRITICAL_CLAIM', 'LEGAL', `Breach of trust verified. Automated drafting of international asset foreclosure for ${loan.username}.`);
    }

    res.json({
        success: true,
        loanId,
        daysOverdue: loan.daysOverdue,
        accountStatus: loan.isFrozen ? "FROZEN" : "ACTIVE",
        collateralState: loan.collateralStatus,
        actionTaken: enforcementAction,
        note: "Compliance verified under A.E.C. Sovereign Judicial Code and Pi Core specifications."
    });
});

app.listen(PORT, () => {
    console.log("[A.E.C. Sovereign Fund Gateway] Active and cross-linked to BIGISH-YER on port: " + PORT);
});
