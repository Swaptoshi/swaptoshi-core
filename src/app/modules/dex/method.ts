import { BaseMethod, MethodContext } from 'lisk-sdk';
import { PoolStore } from './stores/pool';
import { methodSwapContext } from './stores/context';
import { Uint24String } from './stores/library/int';
import { PositionManagerStore } from './stores/position_manager';
import { Quoter } from './stores/library/lens';
import { NonfungiblePositionManager, SwapRouter, SwaptoshiPool } from './stores/factory';

export class DexMethod extends BaseMethod {
	public async createPool(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
		tokenA: Buffer,
		tokenASymbol: string,
		tokenADecimal: number,
		tokenB: Buffer,
		tokenBSymbol: string,
		tokenBDecimal: number,
		fee: Uint24String,
	): Promise<SwaptoshiPool> {
		const poolStore = this.stores.get(PoolStore);
		const _context = methodSwapContext(context, senderAddress, timestamp);
		return poolStore.createPool(
			_context,
			tokenA,
			tokenASymbol,
			tokenADecimal,
			tokenB,
			tokenBSymbol,
			tokenBDecimal,
			fee,
		);
	}

	public async getPool(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
		tokenA: Buffer,
		tokenB: Buffer,
		fee: Uint24String,
	): Promise<SwaptoshiPool> {
		const poolStore = this.stores.get(PoolStore);
		const _context = methodSwapContext(context, senderAddress, timestamp);
		return poolStore.getMutablePool(_context, tokenA, tokenB, fee);
	}

	public async getPositionManager(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
		poolAddress: Buffer,
	): Promise<NonfungiblePositionManager> {
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const _context = methodSwapContext(context, senderAddress, timestamp);
		return positionManagerStore.getMutablePositionManager(_context, poolAddress);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async getRouter(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
	): Promise<SwapRouter> {
		const poolStore = this.stores.get(PoolStore);
		const _context = methodSwapContext(context, senderAddress, timestamp);
		return poolStore.getMutableRouter(_context);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async getQuoter(
		context: MethodContext,
		senderAddress: Buffer,
		timestamp: number,
	): Promise<Quoter> {
		const _context = methodSwapContext(context, senderAddress, timestamp);
		return new Quoter(_context, this.stores);
	}
}
