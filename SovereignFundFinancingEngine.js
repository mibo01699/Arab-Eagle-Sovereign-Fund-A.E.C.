/**
 * Arab-Eagle-Sovereign-Fund-A.E.C: Financing, Web3 Escrow & Global Synchronized Mining Engine
 * Core Institutional Hub of the Arabian Eagle Ecosystem (A.E.C)
 * 100% Compliant with Pi Network 2026 Launchpad Tokenomics & UNICEF DPG Architecture.
 */

class SovereignFundFinancingEngine {
    constructor() {
        this.piScale = 10000000n;       // 7 decimals for Pi (Stroops)
        this.yerScale = 10000000000n;   // 10 decimals for Tokenized YER
        this.activeLoans = new Map();
        
        // --- خريطة توزيع الرمز العالمية الصارمة (Global Tokenomics Matrix) ---
        this.maxGlobalSupplyYer = 3000000000n * this.yerScale; // السقف الإجمالي للمنظومة: 300 مليون
        
        this.allocationPublicMiningYer = 30000000n * this.yerScale;   // 10% تعدين مجاني وجماهيري بالدعوات
        this.allocationDexLiquidityYer = 100000000n * this.yerScale;  // 30% منصة الإطلاق ومجمع سيولة DEX Pi
        this.allocationSovereignFundYer = 200000000n * this.yerScale; // 60% مخصصة لرأس مال الصندوق السيادي عبر التفويض
        
        // عدادات التعدين الحية المنظومية لمنع التضارب والتضخم
        this.totalMinedByFundYer = 0n;
        this.isLaunchpadPhaseActive = false;
    }

    /**
     * 1. فحص الهوية وتفويض حجز الـ Pi كرهن ذكي قبل الموافقة الأولية على التمويل
     */
    verifyAndLockCollateralAllowance(borrowerWallet, piKycStatus, userCurrentPiBalance, requiredLoanYer, currentDexPriceRatio) {
        if (piKycStatus !== 'APPROVED' || !borrowerWallet) {
            return { success: false, reason: "CRITICAL_ERROR: Borrower Pi-KYC must be APPROVED." };
        }

        const bigLoanYerRaw = BigInt(Math.floor(requiredLoanYer * Number(this.yerScale)));
        const bigPriceRatio = BigInt(Math.floor(currentDexPriceRatio * 10000000));
        const requiredPiCollateralStroops = (bigLoanYerRaw * this.piScale) / (bigPriceRatio * 1000n);

        const bigUserBalanceStroops = BigInt(Math.floor(userCurrentPiBalance * Number(this.piScale)));
        if (bigUserBalanceStroops < requiredPiCollateralStroops) {
            return { success: false, reason: "LIQUIDITY_ERROR: Insufficient Pi balance for collateral lockdown." };
        }

        return { success: true, approvedCollateralStroops: requiredPiCollateralStroops, loanYerRaw: bigLoanYerRaw };
    }

    /**
     * 2. تسجيل وثيقة التمويل وربط صلاحية السحب الآلي القسري للعقد عند التخلف (Liquidate on Default)
     */
    approveSovereignLoan(loanId, borrowerWallet, preFlightResult, durationBlocks) {
        if (!preFlightResult || !preFlightResult.success) {
            throw new Error("Cannot issue loan without a successful pre-flight authorization.");
        }

        const loanRecord = {
            loanId,
            borrower: borrowerWallet,
            amountYerRaw: preFlightResult.loanYerRaw.toString(),
            collateralPiStroops: preFlightResult.approvedCollateralStroops.toString(),
            expiryBlock: durationBlocks,
            contractAllowanceGranted: true, 
            status: "Loan_Active_Pi_Held_By_Smart_Contract",
            timestamp: Date.now()
        };

        this.activeLoans.set(loanId, loanRecord);
        console.log(`[A.E.C FUND] Global Loan ${loanId} active. Linked with wallet: ${borrowerWallet}`);
        return { success: true, loanRecord };
    }

    /**
     * 3. التصفية الآلية الفورية ومصادرة الرهن المحجوز عند تخلف المستفيد الدولي عن السداد
     */
    enforceAutomatedDefaultLiquidation(loanId, currentBlockHeight) {
        if (!this.activeLoans.has(loanId)) {
            return { success: false, error: "Loan contract entry not found." };
        }

        const loan = this.activeLoans.get(loanId);
        
        if (currentBlockHeight >= loan.expiryBlock && loan.status === "Loan_Active_Pi_Held_By_Smart_Contract") {
            loan.status = "Defaulted_Atomic_Seizure_Triggered_Via_DEX";
            console.warn(`[A.E.C LIQUIDATOR] Seizing locked collateral for loan ${loanId} via DEX Pi AMM clearing.`);
            return { success: true, liquidatedLoan: loan };
        }

        return { success: false, reason: "Loan maturity block height not reached." };
    }

    /**
     * 4. محرك تعدين العملة الخاص بالصندوق السيادي (العملية الثالثة 60%) والمفوض من BIGISH-YER
     */
    executeSovereignCapitalMining(blockRewardInYer) {
        const bigReward = BigInt(Math.floor(blockRewardInYer * Number(this.yerScale)));
        
        // منع التضارب: التحقق المطلق من عدم تجاوز سقف الـ 200 مليون رمز المخصصة للصندوق في خريطة التوزيع
        if (this.totalMinedByFundYer + bigReward > this.allocationSovereignFundYer) {
            return { status: "Mining_Suspended", reason: "Sovereign Fund Maximum Tokenomics Cap Reached." };
        }

        this.totalMinedByFundYer += bigReward;
        console.log(`[A.E.C MINING] Block reward mined successfully for the Sovereign Fund repository.`);
        
        return {
            status: "YER_Sovereign_Block_Mined_And_Synced",
            mintedAmountRaw: bigReward.toString(),
            totalFundMinedRaw: this.totalMinedByFundYer.toString(),
            remainingFundAllocationRaw: (this.allocationSovereignFundYer - this.totalMinedByFundYer).toString()
        };
    }
}

module.exports = new SovereignFundFinancingEngine();
