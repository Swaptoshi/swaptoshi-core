/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { DEXPool } from '../../../../../../../src/app/modules/dex/stores/factory';
import { Uint256String, Uint160String, Int256, Int256String, Uint256, Int24String, Uint128String } from '../../../../../../../src/app/modules/dex/stores/library/int';
import { MutableSwapContext } from '../../../../../../../src/app/modules/dex/types';
import { PoolStore } from '../../../../../../../src/app/modules/dex/stores/pool';
import { DexModule } from '../../../../../../../src/app/modules/dex/module';
import { PoolAddress } from '../../../../../../../src/app/modules/dex/stores/library/periphery';

export const mockedSwapCallback = jest.fn();
export const mockedMintCallback = jest.fn();
export const mockedFlashCallback = jest.fn();

export class TestCallee {
	public constructor(context: MutableSwapContext, module: DexModule) {
		this.module = module;
		this.context = context;
	}

	public async swapExact0For1(pool: DEXPool, amount0In: Uint256String, recipient: Buffer, sqrtPriceLimitX96: Uint160String) {
		await pool.swap(recipient, true, Int256.from(amount0In).toString(), sqrtPriceLimitX96, pool.address.toString('hex'), this._swapCallback.bind(this));
	}

	public async swap0ForExact1(pool: DEXPool, amount1Out: Uint256String, recipient: Buffer, sqrtPriceLimitX96: Uint160String) {
		await pool.swap(recipient, true, Int256.from(amount1Out).mul(-1).toString(), sqrtPriceLimitX96, pool.address.toString('hex'), this._swapCallback.bind(this));
	}

	public async swapExact1For0(pool: DEXPool, amount1In: Uint256String, recipient: Buffer, sqrtPriceLimitX96: Uint160String) {
		await pool.swap(recipient, false, Int256.from(amount1In).toString(), sqrtPriceLimitX96, pool.address.toString('hex'), this._swapCallback.bind(this));
	}

	public async swap1ForExact0(pool: DEXPool, amount0Out: Uint256String, recipient: Buffer, sqrtPriceLimitX96: Uint160String) {
		await pool.swap(recipient, false, Int256.from(amount0Out).mul(-1).toString(), sqrtPriceLimitX96, pool.address.toString('hex'), this._swapCallback.bind(this));
	}

	public async swapToLowerSqrtPrice(pool: DEXPool, sqrtPriceX96: Uint160String, recipient: Buffer) {
		await pool.swap(recipient, true, Int256.MAX, sqrtPriceX96, pool.address.toString('hex'), this._swapCallback.bind(this));
	}

	public async swapToHigherSqrtPrice(pool: DEXPool, sqrtPriceX96: Uint160String, recipient: Buffer) {
		await pool.swap(recipient, false, Int256.MAX, sqrtPriceX96, pool.address.toString('hex'), this._swapCallback.bind(this));
	}

	public async mint(pool: DEXPool, recipient: Buffer, tickLower: Int24String, tickUpper: Int24String, amount: Uint128String) {
		return pool.mint(recipient, tickLower, tickUpper, amount, pool.address.toString('hex'), this._mintCallback.bind(this));
	}

	public async flash(pool: DEXPool, recipient: Buffer, amount0: Uint256String, amount1: Uint256String, pay0: Uint256String, pay1: Uint256String) {
		const data = JSON.stringify({
			pool: pool.address.toString('hex'),
			pay0,
			pay1,
		});
		await pool.flash(recipient, amount0, amount1, data, this._flashCallback.bind(this));
	}

	private async _swapCallback(amount0Delta: Int256String, amount1Delta: Int256String, data: string) {
		mockedSwapCallback(amount0Delta, amount1Delta);

		const poolStore = this.module.stores.get(PoolStore);
		const { token0, token1, fee } = PoolAddress.decodePoolAddress(Buffer.from(data, 'hex'));
		const pool = await poolStore.getMutablePool(this.context, token0, token1, fee);

		if (Int256.from(amount0Delta).gt(0)) {
			await this.module._tokenMethod!.transfer(this.context.context, this.context.senderAddress, pool.address, pool.token0, Uint256.from(amount0Delta).toBigInt());
		} else if (Int256.from(amount1Delta).gt(0)) {
			await this.module._tokenMethod!.transfer(this.context.context, this.context.senderAddress, pool.address, pool.token1, Uint256.from(amount1Delta).toBigInt());
		} else if (!(amount0Delta === '0' && amount1Delta === '0')) throw new Error('assertion failed');
	}

	private async _mintCallback(amount0Owed: Uint256String, amount1Owed: Uint256String, data: string) {
		mockedMintCallback(amount0Owed, amount1Owed);

		const poolStore = this.module.stores.get(PoolStore);
		const { token0, token1, fee } = PoolAddress.decodePoolAddress(Buffer.from(data, 'hex'));
		const pool = await poolStore.getMutablePool(this.context, token0, token1, fee);

		if (Uint256.from(amount0Owed).gt(0)) {
			await this.module._tokenMethod!.transfer(this.context.context, this.context.senderAddress, pool.address, pool.token0, Uint256.from(amount0Owed).toBigInt());
		}
		if (Uint256.from(amount1Owed).gt(0)) {
			await this.module._tokenMethod!.transfer(this.context.context, this.context.senderAddress, pool.address, pool.token1, Uint256.from(amount1Owed).toBigInt());
		}
	}

	private async _flashCallback(fee0: Uint256String, fee1: Uint256String, data: string) {
		mockedFlashCallback(fee0, fee1);
		const payload: Record<string, string> = JSON.parse(data);

		const poolStore = this.module.stores.get(PoolStore);
		const { token0, token1, fee } = PoolAddress.decodePoolAddress(Buffer.from(payload.pool, 'hex'));
		const pool = await poolStore.getMutablePool(this.context, token0, token1, fee);

		if (Uint256.from(payload.pay0).gt(0)) {
			await this.module._tokenMethod!.transfer(this.context.context, this.context.senderAddress, pool.address, pool.token0, Uint256.from(payload.pay0).toBigInt());
		}
		if (Uint256.from(payload.pay1).gt(0)) {
			await this.module._tokenMethod!.transfer(this.context.context, this.context.senderAddress, pool.address, pool.token1, Uint256.from(payload.pay1).toBigInt());
		}
	}

	context: MutableSwapContext;
	module: DexModule;
}
