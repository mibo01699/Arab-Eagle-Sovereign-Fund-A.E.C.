/**
 * A.E.C. Sovereign Fund - Internal Risk & Default Notification System
 * Arabian Eagle Ecosystem (A.E.C.) - Asset Telemetry Handling
 * Main Developer: Mayass Ali (mibo01699)
 */

class FundNotificationSystem {
    constructor() {
        this.fundLogs = [];
    }

    /**
     * Trigger a secure credit warning or multi-agent notification
     * @param {string} type - Allocation type (LOAN_ISSUED, RISK_ALERT, COLLATERAL_HOLD)
     * @param {string} message - Telemetry description
     */
    emitWarning(type, message) {
        const timestamp = new Date().toISOString();
        const payload = {
            logId: "AEC-FUND-LOG-" + (Math.floor(Math.random() * 900000) + 100000),
            timestamp: timestamp,
            type: type.toUpperCase(),
            message: message
        };

        this.fundLogs.push(payload);
        console.log("[AEC FUND CORE LOG] [" + payload.type + "] -> " + message);
        return payload;
    }

    getFundHistory() {
        return this.fundLogs.slice(-15).reverse();
    }
}

module.exports = new FundNotificationSystem();
