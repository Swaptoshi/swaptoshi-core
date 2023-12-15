/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-param-reassign */
/* eslint-disable no-constant-condition */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-nested-ternary */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NamedRegistry } from 'lisk-sdk';
import {
	Uint256String,
	Uint24String,
	Uint160String,
	Int24String,
	Int256String,
	Int256,
	Uint256,
	Uint160,
	Int128String,
	Uint128String,
	Int16String,
	Int24,
} from '../int';
import {
	ImmutableSwapContext,
	QuoteExactInputSingleParams,
	QuoteExactOutputSingleParams,
	SwaptoshiPoolData,
} from '../../../types';
import { PoolStore } from '../../pool';

import * as Path from '../periphery/path';
import * as PoolTicksCounter from '../periphery/pool_ticks_counter';
import * as TickMath from '../core/tick_math';
import { SwaptoshiPool } from '../../factory';
import { TickBitmapStore } from '../../tick_bitmap';
import { decodePriceSqrt } from '../../../utils';
import { TokenSymbolStore } from '../../token_symbol';

interface SwapPayload {
	amountOutCached?: Uint256String;
	path: string;
	tickBefore: Int24String;
}

interface PopulatedTick {
	tick: Int24String;
	liquidityNet: Int128String;
	liquidityGross: Uint128String;
}

export class Quoter {
	public constructor(context: ImmutableSwapContext, stores: NamedRegistry) {
		this.immutableContext = context;
		this.poolStore = stores.get(PoolStore);
		this.tickBitmapStore = stores.get(TickBitmapStore);
		this.tokenSymbolStore = stores.get(TokenSymbolStore);
	}

	public async getPopulatedTicksInWord(
		tokenA: Buffer,
		tokenB: Buffer,
		fee: Int24String,
		tickBitmapIndex: Int16String,
	): Promise<PopulatedTick[]> {
		const pool = await this.poolStore!.getImmutablePool(
			this.immutableContext!,
			tokenA,
			tokenB,
			fee,
		);
		const bitmap = Uint256.from(await pool.getTickBitmap(tickBitmapIndex));
		let numberOfPopulatedTicks = Uint256.from(0);
		for (let i = 0; i < 256; i += 1) {
			if (bitmap.and(Uint256.from(1).shl(i)).gt(0))
				numberOfPopulatedTicks = numberOfPopulatedTicks.add(1);
		}

		const populatedTicks = new Array<PopulatedTick>(numberOfPopulatedTicks.toNumber());
		const { tickSpacing } = pool;
		for (let i = 0; i < 256; i += 1) {
			if (bitmap.and(Uint256.from(1).shl(i)).gt(0)) {
				const populatedTick = Int24.from(tickBitmapIndex).shl(8).add(i).mul(tickSpacing);
				const { liquidityGross, liquidityNet } = await pool.getTick(populatedTick.toString());
				numberOfPopulatedTicks = numberOfPopulatedTicks.sub(1);
				populatedTicks[numberOfPopulatedTicks.toNumber()] = {
					tick: populatedTick.toString(),
					liquidityNet,
					liquidityGross,
				} as PopulatedTick;
			}
		}

		return populatedTicks;
	}

	public async quoteExactInputSingle(
		params: QuoteExactInputSingleParams,
	): Promise<{ amountOut: string; sqrtPriceX96After: string; initializedTicksCrossed: string }> {
		const zeroForOne =
			Buffer.from(params.tokenIn, 'hex').compare(Buffer.from(params.tokenOut, 'hex')) < 0;
		const pool = await this.poolStore!.getImmutablePool(
			this.immutableContext!,
			Buffer.from(params.tokenIn, 'hex'),
			Buffer.from(params.tokenOut, 'hex'),
			params.fee,
		);

		try {
			await pool
				.createEmulator()
				.swap(
					this.senderAddress,
					zeroForOne,
					params.amountIn,
					params.sqrtPriceLimitX96 === '0'
						? zeroForOne
							? Uint160.from(TickMath.MIN_SQRT_RATIO).add(1).toString()
							: Uint160.from(TickMath.MAX_SQRT_RATIO).sub(1).toString()
						: params.sqrtPriceLimitX96,
					this._createPayload(params.tokenIn, params.tokenOut, params.fee, pool.slot0.tick),
					this._swapCallback.bind(this),
				);
		} catch (err: unknown) {
			const result = await this._handleRevert((err as { message: string }).message, pool);
			return {
				...result,
				amountOut: result.amount,
			};
		}

		throw new Error('Did not throw properly');
	}

	public async quoteExactInput(
		path: Buffer,
		amountIn: Uint256String,
	): Promise<{
		amountOut: string;
		sqrtPriceX96AfterList: string[];
		initializedTicksCrossedList: string[];
	}> {
		let _path = path;

		const numPools = parseInt(Path.numPools(_path), 10);
		const sqrtPriceX96AfterList = new Array(numPools);
		const initializedTicksCrossedList = new Array(numPools);

		let i = Uint256.from(0);
		while (true) {
			const [tokenIn, tokenOut, fee] = Path.decodeFirstPool(_path);

			const { amountOut, sqrtPriceX96After, initializedTicksCrossed } =
				await this.quoteExactInputSingle({
					tokenIn: tokenIn.toString('hex'),
					tokenOut: tokenOut.toString('hex'),
					fee,
					amountIn,
					sqrtPriceLimitX96: '0',
				});

			sqrtPriceX96AfterList[i.toNumber()] = sqrtPriceX96After;
			initializedTicksCrossedList[i.toNumber()] = initializedTicksCrossed;
			amountIn = amountOut;
			i = i.add(1);

			if (Path.hasMultiplePools(_path)) {
				_path = Path.skipToken(_path);
			} else {
				return { amountOut: amountIn, sqrtPriceX96AfterList, initializedTicksCrossedList };
			}
		}
	}

	public async quoteExactOutputSingle(
		params: QuoteExactOutputSingleParams,
	): Promise<{ amountIn: string; sqrtPriceX96After: string; initializedTicksCrossed: string }> {
		const zeroForOne =
			Buffer.from(params.tokenIn, 'hex').compare(Buffer.from(params.tokenOut, 'hex')) < 0;
		const pool = await this.poolStore!.getImmutablePool(
			this.immutableContext!,
			Buffer.from(params.tokenIn, 'hex'),
			Buffer.from(params.tokenOut, 'hex'),
			params.fee,
		);

		let amountOutCached: Uint256String | undefined;
		if (params.sqrtPriceLimitX96 === '0') amountOutCached = params.amount;

		try {
			await pool
				.createEmulator()
				.swap(
					Buffer.alloc(0),
					zeroForOne,
					Int256.from(params.amount).mul(-1).toString(),
					params.sqrtPriceLimitX96 === '0'
						? zeroForOne
							? Uint160.from(TickMath.MIN_SQRT_RATIO).add(1).toString()
							: Uint160.from(TickMath.MAX_SQRT_RATIO).sub(1).toString()
						: params.sqrtPriceLimitX96,
					this._createPayload(
						params.tokenOut,
						params.tokenIn,
						params.fee,
						pool.slot0.tick,
						amountOutCached,
					),
					this._swapCallback.bind(this),
				);
		} catch (err: unknown) {
			const result = await this._handleRevert((err as { message: string }).message, pool);
			return {
				...result,
				amountIn: result.amount,
			};
		}

		throw new Error('Did not throw properly');
	}

	public async quoteExactOutput(
		path: Buffer,
		amountOut: Uint256String,
	): Promise<{
		amountIn: string;
		sqrtPriceX96AfterList: string[];
		initializedTicksCrossedList: string[];
	}> {
		let _path = path;

		const numPools = parseInt(Path.numPools(_path), 10);
		const sqrtPriceX96AfterList = new Array(numPools);
		const initializedTicksCrossedList = new Array(numPools);

		let i = Uint256.from(0);
		while (true) {
			const [tokenOut, tokenIn, fee] = Path.decodeFirstPool(_path);

			const { amountIn, sqrtPriceX96After, initializedTicksCrossed } =
				await this.quoteExactOutputSingle({
					tokenIn: tokenIn.toString('hex'),
					tokenOut: tokenOut.toString('hex'),
					fee,
					amount: amountOut,
					sqrtPriceLimitX96: '0',
				});

			sqrtPriceX96AfterList[i.toNumber()] = sqrtPriceX96After;
			initializedTicksCrossedList[i.toNumber()] = initializedTicksCrossed;
			amountOut = amountIn;
			i = i.add(1);

			if (Path.hasMultiplePools(_path)) {
				_path = Path.skipToken(_path);
			} else {
				return { amountIn: amountOut, sqrtPriceX96AfterList, initializedTicksCrossedList };
			}
		}
	}

	public async quotePrice(path: Buffer): Promise<{ price: number; pair: string }> {
		let price = 1;
		let _path = path;
		let baseToken = '';
		while (true) {
			const [tokenIn, tokenOut, fee] = Path.decodeFirstPool(_path);
			const { token0, slot0 } = await this.poolStore!.getImmutablePool(
				this.immutableContext!,
				tokenIn,
				tokenOut,
				fee,
			);
			const tokenInInfo = await this.tokenSymbolStore!.get(
				this.immutableContext!.context,
				this.tokenSymbolStore!.getKey(tokenIn),
			);
			const tokenOutInfo = await this.tokenSymbolStore!.get(
				this.immutableContext!.context,
				this.tokenSymbolStore!.getKey(tokenOut),
			);
			if (!baseToken) baseToken = tokenInInfo.symbol;

			const decodedPrice = parseFloat(
				decodePriceSqrt(
					slot0.sqrtPriceX96,
					tokenInInfo.decimal,
					tokenOutInfo.decimal,
					tokenIn.compare(token0) !== 0,
				),
			);
			price *= decodedPrice;

			if (Path.hasMultiplePools(_path)) {
				_path = Path.skipToken(_path);
			} else {
				return { price, pair: `${baseToken}/${tokenOutInfo.symbol}` };
			}
		}
	}

	private _createPayload(
		tokenIn: string,
		tokenOut: string,
		fee: Uint24String,
		tickBefore: Int24String,
		amountOutCached?: Uint256String,
	) {
		const feeBuff = Buffer.allocUnsafe(3);
		feeBuff.writeUIntBE(parseInt(fee, 10), 0, 3);
		return JSON.stringify({
			path: Buffer.concat([
				Buffer.from(tokenIn, 'hex'),
				feeBuff,
				Buffer.from(tokenOut, 'hex'),
			]).toString('hex'),
			amountOutCached,
			tickBefore,
		});
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	private async _swapCallback(
		amount0Delta: Int256String,
		amount1Delta: Int256String,
		_data: string,
		pool?: SwaptoshiPoolData,
	) {
		if (pool === undefined) throw new Error('no pool supplied');

		const payload = JSON.parse(_data) as SwapPayload;
		if (Int256.from(amount0Delta).lte(0) && Int256.from(amount1Delta).lte(0))
			throw new Error('swaps entirely within 0-liquidity regions are not supported');
		const [tokenIn, tokenOut] = Path.decodeFirstPool(Buffer.from(payload.path, 'hex'));

		const [isExactInput, amountToPay, amountReceived] = Int256.from(amount0Delta).gt(0)
			? [
					tokenIn.compare(tokenOut) < 0,
					Uint256.from(0).add(amount0Delta).toString(),
					Uint256.from(0).sub(amount1Delta).toString(),
			  ]
			: [
					tokenOut.compare(tokenIn) < 0,
					Uint256.from(amount1Delta).toString(),
					Uint256.from(0).sub(amount0Delta).toString(),
			  ];

		const { sqrtPriceX96: sqrtPriceX96After, tick: tickAfter } = pool.slot0;

		if (isExactInput) {
			const data = {
				amount: amountReceived,
				sqrtPriceX96After,
				tickAfter,
				tickBefore: payload.tickBefore,
			};
			throw new Error(JSON.stringify(data));
		} else {
			if (payload.amountOutCached !== undefined && amountReceived !== payload.amountOutCached)
				throw new Error('full output amount must be received');
			const data = {
				amount: amountToPay,
				sqrtPriceX96After,
				tickAfter,
				tickBefore: payload.tickBefore,
			};
			throw new Error(JSON.stringify(data));
		}
	}

	private _parseRevertReason(
		jsonData: string,
	): [
		amount: Uint256String,
		sqrtPriceX96After: Uint160String,
		tickAfter: Int24String,
		tickBefore: Int24String,
	] {
		try {
			const data = JSON.parse(jsonData);

			const { amount } = data;
			const { sqrtPriceX96After } = data;
			const { tickAfter } = data;
			const { tickBefore } = data;

			return [
				amount.toString(),
				sqrtPriceX96After.toString(),
				tickAfter.toString(),
				tickBefore.toString(),
			];
		} catch (err: unknown) {
			throw new Error(jsonData);
		}
	}

	private async _handleRevert(
		reason: string,
		pool: SwaptoshiPool,
	): Promise<{ amount: string; sqrtPriceX96After: string; initializedTicksCrossed: string }> {
		const [amount, sqrtPriceX96After, _tickAfter, _tickBefore] = this._parseRevertReason(reason);

		const tickBefore = _tickBefore;
		const tickAfter = _tickAfter;

		const initializedTicksCrossed = await PoolTicksCounter.countInitializedTicksCrossed(
			this.tickBitmapStore!,
			this.immutableContext!.context,
			pool,
			tickBefore,
			tickAfter,
		);
		return { amount, sqrtPriceX96After, initializedTicksCrossed };
	}

	private readonly senderAddress: Buffer = Buffer.alloc(0);

	private readonly immutableContext: ImmutableSwapContext | undefined;
	private readonly poolStore: PoolStore | undefined;
	private readonly tickBitmapStore: TickBitmapStore | undefined;
	private readonly tokenSymbolStore: TokenSymbolStore | undefined;
}
