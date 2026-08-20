/**
 * 📝 عقد ذكي صارم لتعدين وإدارة رأس مال رمز YER السيادي
 * إجمالي المعروض: 100,000,000 رمز (مئة مليون رمز YER)
 * الحسابات تعتمد على BigInt (10 خانات عشرية) بدون فواصل عائمة منعا للربا
 */

const YER_DECIMALS = 10n ** 10n;

class YERTokenContract {
    constructor() {
        // تعدين 100 مليون رمز YER وضخها في محفظة رأس مال الصندوق السيادي
        this.totalSupply = 100000000n * YER_DECIMALS; 
        this.balances = {
            'AEC_SOVEREIGN_RESERVE': this.totalSupply
        };
        this.owner = 'AEC_SOVEREIGN_RESERVE';
    }

    // التحقق من الرصيد بمقياس الأرقام الصحيحة الصارم
    balanceOf(account) {
        return this.balances[account] || 0n;
    }

    // آلية تحويل وضخ قروض رأس المال لحسابات المستفيدين لحفظ حقوق المنصة
    transferLoan(from, to, amount) {
        const transferAmount = BigInt(amount);
        if (transferAmount <= 0n) throw new Error("قيمة التمويل يجب أن تكون أكبر من صفر.");
        
        const senderBalance = this.balanceOf(from);
        if (senderBalance < transferAmount) throw new Error("عذراً، رصيد رأس مال الصندوق لا يكفي لتغطية هذا التمويل.");

        this.balances[from] = senderBalance - transferAmount;
        this.balances[to] = this.balanceOf(to) + transferAmount;

        return {
            success: true,
            txId: `TX-YER-${Date.now()}`,
            mintedSupply: this.totalSupply.toString()
        };
    }
}

module.exports = YERTokenContract;
