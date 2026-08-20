# AEC-Sovereign-Fund: Zero-Interest Finance & Authorized YER Minting Vault

This repository contains the software and asset tokenization engines of **صندوق النسر العربي السيادي A.E.C. 🦅**, the eighth macro-financial node of the **Arabian Eagle Ecosystem (A.E.C.)** orchestrated by **Mayass Ali**.

## 🧭 Architectural Mapping & Cross-Repo Clearing
*   **Authorized Minting Layer**: Implements a strict, single-initialization token vault asset mint cap of **100,000,000 YER** structured utilizing standard BigInt 10-decimal sub-unit fixed arithmetic to eliminate currency decimal floating manipulation exploits.
*   **Zero-Interest Financing Engine**: Eradicates dynamically compounding compounding rates. Disbursed capital values map identically to incoming batch collections.
*   **Central Cross-Repo Link**: Operates as a liquidity extensions system chained automatically to the central macroeconomic clearing engines of `BIGISH-YER`.

## 🛠 Repository Directory Structure
*   `contracts/AecSovereignFund.sol`: Production smart contracts managing minting limits, multi-party policy approvals, and tokenized real-world asset security parameters.
*   `server/server.js`: Rest API entrypoint managing transaction distribution flows and AMM conversion functions.
