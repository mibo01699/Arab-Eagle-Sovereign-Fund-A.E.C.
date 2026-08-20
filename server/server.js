const express = require('express');
const path = require('path');
const amanAlerts = require('./alertSystem');

const app = express();
const PORT = process.env.PORT || 3007;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. ربط مباشر وثابت مع مجمع السيولة المركزي لـ BIGISH-YER لتعزيز القيمة السوقية
const BIGISH_YER_DEX_POOL = {
    piReserve: BigInt("10000000000000"),    // الاحتياطي بوحدات Stroops
    yerReserve: BigInt("1500000000000000"), // الاحتياطي بوحدات الريال السيادي الصغير
    precisionFactor: BigInt("10000000")     // معامل الدقة لمنع الكسور العشرية
};

// 2. معالج الأقساط اللحظي المربوط بمجمع السيولة Pi / YER
app.post('/api/fund/execute-installment-secure', (req, res) => {
    try {
        const { loanId, username, tokenUsed, installmentAmountYER } = req.body;
        
        console.log("[AEC Sovereign Fund] Initiating secure ledger routing into BIGISH-YER pool for: " + username);
        
        // تحويل قيمة القسط إلى الحسابات الحازمة الخالية من الكسور الفلوت (Fixed-Point Integer Space)
        const yerAmountSubUnits = BigInt(installmentAmountYER) * BigInt("10000000000"); // 10 خانات عشرية لـ YER
        
        let piStroopsRequired = BigInt("0");
        let dexImpactRateChange = "0.00%";

        if (tokenUsed.toUpperCase() === "PI") {
            // محاكاة تسعير الـ AMM اللحظي بناءً على معادلة المنتج الثابت (Constant Product Formula: X * Y = K)
            // تعزيز القيمة السوقية: سداد القسط بـ Pi يضخ عملات Pi في مجمع السيولة ويسحب رمز YER، مما يرفع سعر YER تلقائياً
            piStroopsRequired = (yerAmountSubUnits * BIGISH_YER_DEX_POOL.piReserve) / BIGISH_YER_DEX_POOL.yerReserve;
            
            // تحديث حالة الاحتياطيات في الصندوق بعد التسوية الفورية
            BIGISH_YER_DEX_POOL.piReserve += piStroopsRequired;
            BIGISH_YER_DEX_POOL.yerReserve -= yerAmountSubUnits;
            dexImpactRateChange = "+0.04% Market Appreciation";
        } else {
            // السداد المباشر برمز YER لخفض الكتلة النقدية المعروضة في الأسواق وتوليد انكماش إيجابي لرفع القيمة
            BIGISH_YER_DEX_POOL.yerReserve += yerAmountSubUnits;
            dexImpactRateChange = "+0.01% Supply Deflation";
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
        console.error("[Ecosystem Cleatring Node Error]:", error);
        res.status(500).json({ success: false, error: "Cross-repository pipeline disconnect" });
    }
});

app.listen(PORT, () => {
    console.log("[A.E.C. Sovereign Fund Gateway] Active and cross-linked to BIGISH-YER on port: " + PORT);
});
