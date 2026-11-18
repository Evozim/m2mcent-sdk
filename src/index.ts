import { ethers } from 'ethers';

export interface X402Config {
    rpcUrl: string;
    privateKey: string;
    recipient: string;
}

/**
 * 🛰️ M2M-Wrapper: El Interceptor de Pagos x402
 * Diseñado para ser inyectado en cualquier API en 3 líneas de código.
 */
export class X402Handler {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private escrowAddress = "0x5d47070A36A37DAf417e64FF27a1e5B3F1c84efa";
    private usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

    constructor(config: X402Config) {
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl || "https://mainnet.base.org", 8453, { staticNetwork: true });
        this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    }

    /**
     * Middleware universal para Express / Next.js (x402 V2)
     * @param amountRaw Cantidad en USDC (6 decimales, ej. "10000" = $0.01)
     */
    requirePayment(amountRaw: string) {
        return async (req: any, res: any, next: any) => {
            const sigHeader = req.headers['payment-signature'] || req.headers['x-payment-signature'] || req.headers['payment'];

            if (!sigHeader) {
                const reqHost = (typeof req.get === 'function' && req.get('host')) || 'api.m2mcent.com';
                const fullUrl = `${req.protocol || 'https'}://${reqHost}${req.originalUrl || req.url || '/'}`;
                const recipientAddr = req.app?.get('recipient') || "0x8aaBAB75bE8825d0f5D514a9a5cBa04B7bF84920";
                const challenge = {
                    x402Version: 2,
                    accepts: [
                        {
                            scheme: "exact",
                            network: "eip155:8453",
                            asset: this.usdcAddress,
                            amount: String(amountRaw),
                            maxAmountRequired: String(amountRaw),
                            payTo: this.escrowAddress,
                            escrow: this.escrowAddress,
                            treasury: recipientAddr,
                            request: fullUrl,
                            maxTimeoutSeconds: 300,
                            extra: { name: "USD Coin", version: "2", recipient: recipientAddr }
                        }
                    ],
                    resource: { url: fullUrl, mimeType: "application/json" }
                };
                return res.status(402).header('Payment-Required', Buffer.from(JSON.stringify(challenge)).toString('base64')).json({
                    error: "Payment Required via x402",
                    ...challenge
                });
            }

            try {
                let rawJson = Buffer.from(String(sigHeader), 'base64').toString('utf8');
                if (!rawJson.startsWith('{')) rawJson = Buffer.from(String(sigHeader), 'base64url').toString('utf8');
                const parsed = JSON.parse(rawJson);
                const evmPayload = parsed.payload?.payload || parsed.payload || parsed;
                const auth = evmPayload.authorization || evmPayload;
                const signature = parsed.signature || evmPayload.signature || parsed.sig;
                const { from, validAfter, validBefore, nonce } = auth;
                const now = Math.floor(Date.now() / 1000);
                if (Number(validAfter || 0) > now) throw new Error("Authorization validAfter is in the future");
                if (Number(validBefore || 0) <= now) throw new Error("Authorization validBefore has expired");

                const escrow = new ethers.Contract(this.escrowAddress, [
                    "function settlePaymentWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external"
                ], this.wallet);

                const sig = ethers.Signature.from(signature);
                const tx = await escrow.settlePaymentWithAuthorization(from, this.wallet.address, BigInt(amountRaw), Number(validAfter || 0), Number(validBefore), nonce, sig.v, sig.r, sig.s);
                req.paymentTx = tx.hash;
                next();
            } catch (err: any) {
                res.status(402).json({ error: "Payment verification failed", details: err.message });
            }
        };
    }
}
