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
    private escrowAddress = "0xf3c3416A843d13C944554A54Ac274BB7fF264BcC";

    constructor(config: X402Config) {
        this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
        this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    }

    /**
     * Middleware universal para Express / Next.js
     * @param amountRaw Cantidad en USDC (6 decimales)
     */
    requirePayment(amountRaw: string) {
        return async (req: any, res: any, next: any) => {
            const sigHeader = req.headers['payment-signature'];

            if (!sigHeader) {
                const metadata = {
                    network: "eip155:8453", // Base Mainnet
                    contract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
                    escrow: this.escrowAddress,
                    recipient: req.app?.get('recipient') || "0x8aaBAB75bE8825d0f5D514a9a5cBa04B7bF84920",
                    amountRaw: amountRaw
                };
                return res.status(402).header('Payment-Required', Buffer.from(JSON.stringify(metadata)).toString('base64')).json({ 
                    error: "Payment Required via x402", 
                    details: metadata 
                });
            }

            try {
                const { from, validAfter, validBefore, nonce, signature } = JSON.parse(Buffer.from(sigHeader, 'base64').toString());
                const escrow = new ethers.Contract(this.escrowAddress, [
                    "function settle(address from, address to, uint256 amount, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external"
                ], this.wallet);

                const sig = ethers.Signature.from(signature);
                const tx = await escrow.settle(from, this.wallet.address, amountRaw, validAfter, validBefore, nonce, sig.v, sig.r, sig.s);
                req.paymentTx = tx.hash;
                next();
            } catch (err: any) {
                res.status(402).json({ error: "Payment verification failed", details: err.message });
            }
        };
    }
}
