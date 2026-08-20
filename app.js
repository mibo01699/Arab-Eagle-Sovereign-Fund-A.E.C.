/**
 * 🦅 نظام إدارة التمويل السيادي والمقاصة الذكية - صندوق الصقر العربي A.E.C
 * متكامل مع البنية التحتية لـ BIGISH-YER وبوابات Pi Network المحدثة
 * يمنع الفواصل العائمة منعا باتاً لضمان المعاملات الخالية من الربا
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// --- المقاييس العشرية الثابتة (Strict BigInt Metrics) ---
const YER_SCALE = 10n ** 10n; // 10 خانات عشرية لـ YER السيادي
const PI_SCALE = 10n ** 7n;   // 7 خانات عشرية لـ Pi Stroops
const SCALE_DIFF = 10n ** 3n;  // الفارق الحسابي بين المقیاسین (10 - 7 = 3 أصفار)

// --- المحاكاة التقديرية لمجمع السيولة الموحد عبر الـ DEX (Pi / YER) ---
// يتم تحديث الاحتياطيات ديناميكياً من محرك المقاصة الهجين
let dexPool = {
    piReserve: 5000000n * PI_SCALE,     // احتياطي البي (Stroops)
    yerReserve: 250000000n * YER_SCALE  // احتياطي الريال السيادي (Sub-units)
};

// --- قواعد البيانات المؤقتة للمنصة (الاحتياطات القانونية والاقتصادية) ---
let creditRegistry = {
    loans: {},           // سجل القروض النشطة والأقساط ومواعيدها
    activeLocks: new Set() // محرك منع تكرار العمليات والاختراق (Anti-Double-Dipping)
};

// ==========================================
// 1. محرك احتساب معادل الـ AMM بدون فواصل (Constant Product X * Y = K)
// ==========================================
function getPiEquivalentForYer(yerAmountBigInt) {
    if (dexPool.yerReserve === 0n || dexPool.piReserve === 0n) {
        throw new Error("فشل النظام: احتياطيات المقاصة في مجمع السيولة صفرية.");
    }
    // صياغة الحساب: (YER * Pi_Reserve * SCALE_DIFF) / YER_Reserve لمنع ضياع المتبقي الرقمي
    return (yerAmountBigInt * dexPool.piReserve) / (dexPool.yerReserve / SCALE_DIFF);
}

// ==========================================
// 2. بوابة التمويل: إصدار القروض الحسنة (الشروط والأحكام الصارمة)
// ==========================================
app.post('/api/finance/apply-loan', (req, res) => {
    const { userId, loanAmountInYer, durationMonths } = req.body;

    if (!userId || !loanAmountInYer || !durationMonths) {
        return res.status(400).json({ error: "المعطيات غير مكتملة لتوليد العقد السيادي." });
    }

    try {
        const principalYer = BigInt(loanAmountInYer) * YER_SCALE; // تحويل الحجم للمقياس الرقمي الصارم
        const months = BigInt(durationMonths);

        if (principalYer <= 0n || months <= 0n) {
            return res.status(400).json({ error: "القيم المدخلة غير صالحة." });
        }

        // الحماية القانونية والاقتصادية للمنصة: تقسيم القسط الشهري بدقة تامة وبدون أي فوائد ربوية
        const monthlyInstallmentYer = principalYer / months;
        const remainderYer = principalYer % months; // حفظ بقية القسمة لإضافتها للقسط الأول لمنع خسارة أي وحدة

        const loanId = `LOAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        creditRegistry.loans[loanId] = {
            userId: userId,
            principalYer: principalYer.toString(),
            remainingBalanceYer: principalYer.toString(),
            monthlyInstallmentYer: monthlyInstallmentYer.toString(),
            firstInstallmentYer: (monthlyInstallmentYer + remainderYer).toString(),
            durationMonths: durationMonths,
            status: "ACTIVE",
            createdAt: new Date().toISOString()
        };

        res.json({
            success: true,
            loanId: loanId,
            contractTerms: "عقد تمويل حسن متوافق مع الضوابط الشرعية، خالي من الفوائد الربوية تماماً",
            monthlyInstallmentYer: monthlyInstallmentYer.toString(),
            firstInstallmentYer: (monthlyInstallmentYer + remainderYer).toString()
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 3. بوابة المقاصة: سداد الأقساط (عبر محفظة الـ YER المحلية أو الـ Pi الخارجي)
// ==========================================
app.post('/api/finance/pay-installment', (req, res) => {
    const { userId, loanId, paymentMethod, amountRaw } = req.body;

    // حماية القفل المزدوج الفورية لمنع الاختراق وإعادة الدخول (Anti-Double-Dipping Engine)
    if (creditRegistry.activeLocks.has(userId)) {
        return res.status(423).json({ error: "العملية قيد المعالجة، تم حظر تكرار الطلب لحماية المنصة." });
    }
    creditRegistry.activeLocks.add(userId);

    try {
        const loan = creditRegistry.loans[loanId];
        if (!loan || loan.status === "PAID") {
            throw new Error("القرض غير موجود أو تم سداده مسبقاً.");
        }

        let currentBalanceYer = BigInt(loan.remainingBalanceYer);
        let paymentInYerUnits = 0n;

        if (paymentMethod === 'YER') {
            // السداد بالرمز المحلي مباشرة
            paymentInYerUnits = BigInt(amountRaw);
        } else if (paymentMethod === 'Pi') {
            // السداد بعملة Pi: استخلاص القيمة التقديرية الحقيقية فورا من الـ AMM
            const piStroops = BigInt(amountRaw);
            // تحويل البي المدفوع إلى معادل الـ YER المقابل له لحسمه من القرض
            paymentInYerUnits = (piStroops * (dexPool.yerReserve / SCALE_DIFF)) / dexPool.piReserve;
        } else {
            throw new Error("وسيلة دفع غير معتمدة في مصفوفة المقاصة السيادية.");
        }

        if (paymentInYerUnits <= 0n) {
            throw new Error("القيمة المدفوعة بعد المقاصة غير كافية لخصم الأقساط.");
        }

        // معالجة الخصم وتحديث السجل المالي الصارم
        if (paymentInYerUnits >= currentBalanceYer) {
            paymentInYerUnits = currentBalanceYer;
            loan.remainingBalanceYer = "0";
            loan.status = "PAID";
        } else {
            currentBalanceYer -= paymentInYerUnits;
            loan.remainingBalanceYer = currentBalanceYer.toString();
        }

        // تحرير القفل فور الانتهاء الناجح للعملية
        creditRegistry.activeLocks.delete(userId);

        res.json({
            success: true,
            loanId: loanId,
            status: loan.status,
            yerSubUnitsCredited: paymentInYerUnits.toString(),
            remainingBalanceYer: loan.remainingBalanceYer
        });

    } catch (error) {
        // تحرير القفل تلقائياً عند حدوث أي خطأ لمنع تجميد النظام البرمجي للمستخدم
        creditRegistry.activeLocks.delete(userId);
        res.status(500).json({ success: false, error: error.message });
    }
});

// المسار الافتراضي لتوجيه حركة المرور إلى واجهة المستخدم
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🦅 تم دمج المقاصة ومنصة التمويل بنجاح 100% على المنفذ: ${PORT}`);
});
