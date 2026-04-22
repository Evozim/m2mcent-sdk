# 🛰️ M2MCent SDK — x402 Payment Wrapper for AI Agents

[![npm version](https://img.shields.io/npm/v/m2mcent-sdk.svg)](https://www.npmjs.com/package/m2mcent-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Base Mainnet](https://img.shields.io/badge/Network-Base%20L2-0052FF.svg)](https://base.org)

> Ultra-lightweight x402 payment interceptor for AI Agents and MCP Servers. Monetize any API in 3 lines of code.

## 🚀 Quick Start

```bash
npm install m2mcent-sdk
```

```typescript
import { X402Handler } from 'm2mcent-sdk';

const x402 = new X402Handler({
  rpcUrl: 'https://mainnet.base.org',
  privateKey: process.env.RELAYER_PRIVATE_KEY!,
  recipient: process.env.TREASURY_ADDRESS!
});

// Protect any Express endpoint with a USDC paywall
app.post('/api/analyze', x402.requirePayment("100000"), (req, res) => {
  res.json({ result: "Premium analysis complete", receipt: req.paymentTx });
});
```

## 📐 How It Works

M2MCent implements the **x402 Payment Protocol** — a machine-native payment standard inspired by HTTP 402:

1. **Agent requests** a protected endpoint
2. **Server responds** with `402 Payment Required` + payment metadata (Base64 encoded)
3. **Agent signs** an EIP-712 typed data authorization (gasless for the payer)
4. **Server settles** atomically on-chain via the M2MCent Escrow contract
5. **Agent receives** the premium response + transaction receipt

```
Agent ──► API Server ──► 402 + metadata
Agent ◄── signs EIP-712 authorization
Agent ──► API Server + Payment-Signature header
          └──► Escrow.settle() on Base L2
Agent ◄── Premium Response + tx hash
```

## ⚙️ Configuration

| Parameter | Description | Required |
|:---|:---|:---|
| `rpcUrl` | Base Mainnet RPC endpoint | ✅ |
| `privateKey` | Relayer wallet private key (for settlement) | ✅ |
| `recipient` | Treasury address to receive payments | ✅ |

## 🔒 Security

- **Non-custodial**: Funds flow directly from payer → treasury via on-chain escrow
- **Gasless for payers**: Uses EIP-3009 `transferWithAuthorization` (USDC native)
- **Zero-Leak**: No agent data is retained after settlement
- **Atomic**: Payment and service delivery happen in a single request cycle

## 🌐 Network Details

| Parameter | Value |
|:---|:---|
| **Network** | Base Mainnet (Chain ID: 8453) |
| **USDC Contract** | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| **Escrow Contract** | `0xf3c3416A843d13C944554A54Ac274BB7fF264BcC` |
| **Settlement** | Atomic, sub-second finality |

## 🧩 MCP Server Integration

Perfect for [Model Context Protocol](https://modelcontextprotocol.io) servers:

```typescript
import express from 'express';
import { X402Handler } from 'm2mcent-sdk';

const app = express();
const x402 = new X402Handler({
  rpcUrl: process.env.BASE_RPC_URL!,
  privateKey: process.env.RELAYER_PRIVATE_KEY!,
  recipient: process.env.TREASURY_ADDRESS!
});

// Any MCP tool endpoint becomes monetizable
app.post('/api/tools/analyze', x402.requirePayment("50000"), async (req, res) => {
  const result = await runMCPTool(req.body);
  res.json({ ...result, paymentTx: req.paymentTx });
});
```

## 📊 Ecosystem

M2MCent powers **100+ production MCP servers** on Base Mainnet, processing real USDC micro-payments for AI-to-AI commerce.

## 📄 License

MIT © [M2MCent](https://github.com/Evozim/m2mcent-sdk)
