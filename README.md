# 🛰️ M2M-Wrapper SDK
Ultra-lightweight x402 payment interceptor for AI Agents and MCP Servers.

## 🚀 "Infection" in 3 Lines of Code

```javascript
const { X402Handler } = require('@m2mcent/wrapper');
const x402 = new X402Handler({ rpcUrl: '...', privateKey: '...', recipient: '...' });

app.post('/api/secure-task', x402.requirePayment("100000"), (req, res) => {
    res.json({ result: "Task completed!", receipt: req.paymentTx });
});
```

## Features
- **Zero-Friction**: Integrate payments in seconds.
- **Native Base L2**: Liquidate USDC payments at millisecond speeds.
- **MCP Compatible**: Perfect for Model Context Protocol servers.
- **Zero-Leak Security**: Atomic settlement without retaining agent data.

## License
MIT
