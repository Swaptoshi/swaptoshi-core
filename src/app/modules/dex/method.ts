/* eslint-disable import/no-cycle */
import { Modules, StateMachine } from 'klayr-sdk';
import { PoolStore } from './stores/pool';
import { immutableMethodSwapContext, methodSwapContext } from './stores/context';
import { Uint24String } from './stores/library/int';
import { PositionManagerStore } from './stores/position_manager';
import { Quoter } from './stores/library/lens';
import { NonfungiblePositionManager, SwapRouter, DEXPool } from './stores/factory';
import { PoolAddress } from './stores/library/periphery';
import { DexGovernableConfig } from './config';

export class DexMethod extends Modules.BaseMethod {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async getConfig(context: StateMachine.ImmutableMethodContext) {
		const configStore = this.stores.get(DexGovernableConfig);
		const config = await configStore.getConfig(context);
		return config;
	}

	public async createPool(
		context: StateMachine.MethodContext,
		senderAddress: Buffer,
		timestamp: number,
		tokenA: Buffer,
		tokenASymbol: string,
		tokenADecimal: number,
		tokenB: Buffer,
		tokenBSymbol: string,
		tokenBDecimal: number,
		fee: Uint24String,
	): Promise<DEXPool> {
		const poolStore = this.stores.get(PoolStore);
		const _context = methodSwapContext(context, senderAddress, timestamp);
		return poolStore.createPool(_context, tokenA, tokenASymbol, tokenADecimal, tokenB, tokenBSymbol, tokenBDecimal, fee);
	}

	public async getPoolInstance(context: StateMachine.MethodContext, senderAddress: Buffer, timestamp: number, tokenA: Buffer, tokenB: Buffer, fee: Uint24String): Promise<DEXPool> {
		const poolStore = this.stores.get(PoolStore);
		const _context = methodSwapContext(context, senderAddress, timestamp);
		return poolStore.getMutablePool(_context, tokenA, tokenB, fee);
	}

	public async poolExists(context: StateMachine.ImmutableMethodContext, tokenA: Buffer, tokenB: Buffer, fee: Uint24String): Promise<boolean> {
		const poolStore = this.stores.get(PoolStore);
		const poolAddress = PoolAddress.computeAddress(PoolAddress.getPoolKey(tokenA, tokenB, fee));
		return poolStore.has(context, poolAddress);
	}

	public async getPositionManagerInstance(context: StateMachine.MethodContext, senderAddress: Buffer, timestamp: number, poolAddress: Buffer): Promise<NonfungiblePositionManager> {
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const _context = methodSwapContext(context, senderAddress, timestamp);
		return positionManagerStore.getMutablePositionManager(_context, poolAddress);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async getRouterInstance(context: StateMachine.MethodContext, senderAddress: Buffer, timestamp: number): Promise<SwapRouter> {
		const poolStore = this.stores.get(PoolStore);
		const _context = methodSwapContext(context, senderAddress, timestamp);
		return poolStore.getMutableRouter(_context);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async getQuoterInstance(context: StateMachine.ImmutableMethodContext, senderAddress: Buffer, timestamp: number): Promise<Quoter> {
		const _context = immutableMethodSwapContext(context, senderAddress, timestamp);
		return new Quoter(_context, this.stores);
	}
}
