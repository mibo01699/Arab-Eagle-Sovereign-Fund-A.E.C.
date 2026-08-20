/**
 * 🦅 خادم الجسر الذكي الموحد والمكتمل 100% - صندوق الصقر العربي A.E.C
 * يقوم بإنهاء التضارب وربط مسارات الـ API بالعقود الذكية لـ Web3
 * يحمي رأس مال الـ 100 مليون رمز YER ويمنع الكسور العائمة منعاً باتاً
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

// استدعاء العقود والمحافظ الموحدة في المستودع
const YERTokenContract = require('./YERTokenContract'); 
const UnifiedIdentityRegistry = require('./UnifiedIdentityRegistry');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// --- تهيئة المحركات السيادية الحقيقية لمنع الازدواجية ---
const yerToken = new YERTokenContract(); // رأس المال المليوني (100,000,000 YER)
const identityRegistry = new UnifiedIdentityRegistry();

// مقاييس الحساب الصارمة لـ Web3 لمنع الفواصل
const YER_SCALE = 10n ** 10n;
const PI_SCALE = 10n ** 7n;
const SCALE_DIFF = 10n ** 3n;

// مجمع سيولة ثابت وموثق برمجياً
let clearingPool = {
    piReserve: 5000000n * PI_SCALE,
    yerReserve: 250000000n * YER_SCALE
};

// سجل أمان المنصة ضد الهدر (Locks Matrix)
let globalCreditRegistry = {};
let activeOperationLocks = new Set();

// ==========================================
// 1. مسار إصدار القروض مع الاحتياطات القانونية (Capital Protection Layer)
// ==========================================
app.post('/api/web3/finance/disburse-loan', (req, res) => {
    const { userId, requestedAmountYer, durationMonths } = req.body;

    if (activeOperationLocks.has(userId)) {
        return res.status(423).json({ error: "تم تفعيل قفل الأمان الذكي؛ طلبك قيد المعالجة لمنع الازدواج الخطر." });
    }
    activeOperationLocks.add(userId);

    try {
        const principalYer = BigInt(requestedAmountYer) * YER_SCALE;
        const months = BigInt(durationMonths);

        if (principalYer <= 0n || months <= 0n) throw new Error("المبالغ أو الفترات الزمنية المدخلة غير قانونية.");

        // ⚠️ الاحتياط الاقتصادي: حماية رأس المال من الهدر عبر فحص سقف السيولة في العقد الذكي
        const fundReserve = yerToken.balanceOf('AEC_SOVEREIGN_RESERVE');
        if (fundReserve < principalYer) throw new Error("طلب التمويل يتجاوز الحد المسموح به من الاحتياطي السيادي حالياً.");

        // احتساب الأقساط بدون فواضل عائمة وحفظ الفواضل في القسط الأول
        const baseInstallment = principalYer / months;
        const remainderInstallment = principalYer % months;
        const firstInstallment = baseInstallment + remainderInstallment;

        const loanId = `AEC-LOAN-${Date.now()}`;

        // تنفيذ القيد على العقد الذكي لـ YERTokenContract لتحويل الأموال للمستفيد
        const tx = yerToken.transferLoan('AEC_SOVEREIGN_RESERVE', userId, principalYer);

        // تسجيل البيانات بشكل صارم في المصفوفة المركزية للمنصة
        globalCreditRegistry[loanId] = {
            userId: userId,
            loanId: loanId,
            blockchainTxId: tx.txId,
            totalDebtYer: principalYer.toString(),
            remainingBalanceYer: principalYer.toString(),
            monthlyInstallmentYer: baseInstallment.toString(),
            firstInstallmentYer: firstInstallment.toString(),
            status: "ACTIVE"
        };

        activeOperationLocks.delete(userId);
        res.json({
            success: true,
            message: "تم توثيق القسط الحسن وإصدار التمويل برمجياً عبر العقد الذكي.",
            loanId: loanId,
            blockchainTxId: tx.txId,
            firstInstallmentInYer: firstInstallment.toString(),
            subsequentInstallmentsInYer: baseInstallment.toString()
        });

    } catch (error) {
        activeOperationLocks.delete(userId);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 2. مسار المقاصة وسداد الأقساط عبر الـ AMM (Pi/YER Clearer)
// ==========================================
app.post('/api/web3/finance/clear-installment', (req, res) => {
    const { userId, loanId, paymentMethod, rawAmount } = req.body;

    if (activeOperationLocks.has(userId)) {
        return res.status(423).json({ error: "العملية مغلقة لمنع السحب المتزامن." });
    }
    activeOperationLocks.add(userId);

    try {
        const loan = globalCreditRegistry[loanId];
        if (!loan || loan.status === "PAID") throw new Error("مستند الدين غير مدرج أو تم تسويته بالكامل.");

        let paymentCreditedInYer = 0n;
        const incomingAmount = BigInt(rawAmount);

        if (paymentMethod === 'YER') {
            paymentCreditedInYer = incomingAmount;
        } else if (paymentMethod === 'Pi') {
            // ربط تسعير الأقساط بدقة وبناءً على معادلة الـ AMM وبشروط فريق Pi المحدثة
            paymentCreditedInYer = (incomingAmount * (clearingPool.yerReserve / SCALE_DIFF)) / clearingPool.piReserve;
        } else {
            throw new Error("وسيلة الدفع لا تمتلك مسار مقاصة معتمد.");
        }

        let currentDebt = BigInt(loan.remainingBalanceYer);
        if (paymentCreditedInYer >= currentDebt) {
            paymentCreditedInYer = currentDebt;
            loan.remainingBalanceYer = "0";
            loan.status = "PAID";
        } else {
            currentDebt -= paymentCreditedInYer;
            loan.remainingBalanceYer = currentDebt.toString();
        }

        activeOperationLocks.delete(userId);
        res.json({
            success: true,
            message: "تمت تسوية القسط بنجاح وحماية الأصول السيادية من الهدر المالي.",
            loanId: loanId,
            remainingDebtYer: loan.remainingBalanceYer,
            status: loan.status
        });

    } catch (error) {
        activeOperationLocks.delete(userId);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🦅 تم دمج المقاصة والعقود الذكية 100% وإلغاء التضارب العشوائي في المنفذ: ${PORT}`);
});

module.exports = app;
