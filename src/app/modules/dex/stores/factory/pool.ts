/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable import/no-cycle */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { NamedRegistry, TokenMethod, cryptography, utils } from 'lisk-sdk';
import {
	PositionInfo,
	Slot0,
	SwaptoshiPoolData,
	DexModuleConfig,
	ImmutableSwapContext,
	MutableSwapContext,
	MutableContext,
	ImmutableContext,
	TickInfo,
} from '../../types';
import {
	Tick,
	Oracle,
	TickMath,
	SqrtPriceMath,
	LiquidityMath,
	Position,
	TickBitmap,
	SwapMath,
	FullMath,
	FixedPoint128,
} from '../library/core';
import {
	Uint128String,
	Int24String,
	Int128String,
	Uint8String,
	Uint32String,
	Int56String,
	Uint160String,
	Int256String,
	Uint256String,
	Uint24String,
	Uint16String,
	Int24,
	Uint32,
	Int56,
	Uint160,
	Uint16,
	Int256,
	Int128,
	Uint128,
	Uint256,
	Uint8,
	Int16String,
} from '../library/int';
import { PoolAddress } from '../library/periphery';
import { PoolStore, defaultSlot0 } from '../pool';
import { IncreaseObservationCardinalityNextEvent } from '../../events/increase_observation_cardinality_next';
import { PoolInitializedEvent } from '../../events/pool_initialized';
import { MintEvent } from '../../events/mint';
import { CollectEvent } from '../../events/collect';
import { BurnEvent } from '../../events/burn';
import { SwapEvent } from '../../events/swap';
import { FlashEvent } from '../../events/flash';
import { CollectProtocolEvent } from '../../events/collect_protocol';
import { TickInfoStore } from '../tick_info';
import { PositionInfoStore } from '../position_info';
import { ObservationStore } from '../observation';
import { TickBitmapStore } from '../tick_bitmap';

interface ModifyPositionParams {
	owner: Buffer;
	tickLower: Int24String;
	tickUpper: Int24String;
	liquidityDelta: Int128String;
}

interface SwapCache {
	feeProtocol: Uint8String;
	liquidityStart: Uint128String;
	blockTimestamp: Uint32String;
	tickCumulative: Int56String;
	secondsPerLiquidityCumulativeX128: Uint160String;
	computedLatestObservation: boolean;
}

interface SwapState {
	amountSpecifiedRemaining: Int256String;
	amountCalculated: Int256String;
	sqrtPriceX96: Uint160String;
	tick: Int24String;
	feeGrowthGlobalX128: Uint256String;
	protocolFee: Uint128String;
	liquidity: Uint128String;
}

interface StepComputations {
	sqrtPriceStartX96: Uint160String;
	tickNext: Int24String;
	initialized: boolean;
	sqrtPriceNextX96: Uint160String;
	amountIn: Uint256String;
	amountOut: Uint256String;
	feeAmount: Uint256String;
}

const defaultStepComputations: StepComputations = Object.freeze({
	sqrtPriceStartX96: '0',
	tickNext: '0',
	initialized: false,
	sqrtPriceNextX96: '0',
	amountIn: '0',
	amountOut: '0',
	feeAmount: '0',
});

export class SwaptoshiPool implements SwaptoshiPoolData {
	public constructor(
		pool: SwaptoshiPoolData,
		stores: NamedRegistry,
		events: NamedRegistry,
		config: DexModuleConfig,
		simulation = false,
	) {
		Object.assign(this, utils.objects.cloneDeep(pool));
		this.address = PoolAddress.computeAddress(
			PoolAddress.getPoolKey(pool.token0, pool.token1, pool.fee),
		);
		this.lisk32 = cryptography.address.getLisk32AddressFromAddress(this.address);
		this.collectionId = PoolAddress.computePoolId(this.address);

		this.stores = stores;
		this.events = events;
		this.config = config;

		this.setConfig(config);

		this.poolStore = this.stores.get(PoolStore);
		this.tickInfoStore = this.stores.get(TickInfoStore);
		this.positionInfoStore = this.stores.get(PositionInfoStore);
		this.observationStore = this.stores.get(ObservationStore);
		this.tickBitmapStore = this.stores.get(TickBitmapStore);

		this.simulation = simulation;
	}

	public createEmulator(): SwaptoshiPool {
		const emulatedPool = new SwaptoshiPool(
			this.toJSON(),
			this.stores!,
			this.events!,
			this.config!,
			true,
		);
		if (this.mutableContext) {
			emulatedPool.addMutableDependencies(this.mutableContext, this.tokenMethod!);
		} else if (this.immutableContext) {
			emulatedPool.addImmutableDependencies(this.immutableContext, this.tokenMethod!);
		}
		return emulatedPool;
	}

	public setSender(senderAddress: Buffer) {
		if (this.mutableContext) {
			this.mutableContext.senderAddress = senderAddress;
		} else if (this.immutableContext) {
			this.immutableContext.senderAddress = senderAddress;
		}
	}

	public setConfig(config: DexModuleConfig) {
		this.feeProtocol = config.feeProtocol ?? 0;

		this.feeProtocolPool = config.feeProtocolPool
			? cryptography.address.getAddressFromLisk32Address(
					config.feeProtocolPool,
					config.feeProtocolPool.substring(0, 3),
			  )
			: undefined;

		this._validateFeeProtocol();
	}

	public addImmutableDependencies(context: ImmutableSwapContext, tokenMethod: TokenMethod) {
		if (this.mutableDependencyReady || this.immutableDependencyReady) {
			throw new Error('this instance dependencies already been configured');
		}
		this.immutableContext = context;
		this.tokenMethod = tokenMethod;
		this.immutableDependencyReady = true;
	}

	public addMutableDependencies(context: MutableSwapContext, tokenMethod: TokenMethod) {
		if (this.mutableDependencyReady || this.immutableDependencyReady) {
			throw new Error('this instance dependencies already been configured');
		}
		this.mutableContext = context;
		this.immutableContext = context;
		this.tokenMethod = tokenMethod;
		this.mutableDependencyReady = true;
		this.immutableDependencyReady = true;
	}

	public async snapshotCumulativesInside(
		tickLower: Int24String,
		tickUpper: Int24String,
	): Promise<
		[
			tickCumulativeInside: Int56String,
			secondsPerLiquidityInsideX128: Uint160String,
			secondsInside: Uint32String,
		]
	> {
		this._checkImmutableDependencies();
		this._checkTicks(tickLower, tickUpper);

		const lower = await this.tickInfoStore!.getOrDefault(
			this.immutableContext!.context,
			this.tickInfoStore!.getKey(this.address, tickLower),
		);
		const upper = await this.tickInfoStore!.getOrDefault(
			this.immutableContext!.context,
			this.tickInfoStore!.getKey(this.address, tickUpper),
		);

		const tickCumulativeLower = Int56.from(lower.tickCumulativeOutside);
		const secondsPerLiquidityOutsideLowerX128 = Uint160.from(lower.secondsPerLiquidityOutsideX128);
		const secondsOutsideLower = Uint32.from(lower.secondsOutside);
		const initializedLower = lower.initialized;

		if (!initializedLower) throw new Error('lower not initialized');

		const tickCumulativeUpper = Int56.from(upper.tickCumulativeOutside);
		const secondsPerLiquidityOutsideUpperX128 = Uint160.from(upper.secondsPerLiquidityOutsideX128);
		const secondsOutsideUpper = Uint32.from(upper.secondsOutside);
		const initializedUpper = upper.initialized;

		if (!initializedUpper) throw new Error('upper not initialized');

		const _slot0 = this.slot0;

		if (Int24.from(_slot0.tick).lt(tickLower)) {
			return [
				tickCumulativeLower.sub(tickCumulativeUpper).toString(),
				secondsPerLiquidityOutsideLowerX128.sub(secondsPerLiquidityOutsideUpperX128).toString(),
				secondsOutsideLower.sub(secondsOutsideUpper).toString(),
			];
		}
		if (Int24.from(_slot0.tick).lt(tickUpper)) {
			const time = this.immutableContext!.timestamp;
			const [tickCumulative, secondsPerLiquidityCumulativeX128] = await Oracle.observeSingle(
				this.observationStore!,
				this.immutableContext!.context,
				this.address,
				time,
				'0',
				_slot0.tick,
				_slot0.observationIndex,
				this.liquidity,
				_slot0.observationCardinality,
			);
			return [
				Int56.from(tickCumulative).sub(tickCumulativeLower).sub(tickCumulativeUpper).toString(),
				Uint160.from(secondsPerLiquidityCumulativeX128)
					.sub(secondsPerLiquidityOutsideLowerX128)
					.sub(secondsPerLiquidityOutsideUpperX128)
					.toString(),
				Uint32.from(time).sub(secondsOutsideLower).sub(secondsOutsideUpper).toString(),
			];
		}
		return [
			tickCumulativeUpper.sub(tickCumulativeLower).toString(),
			secondsPerLiquidityOutsideUpperX128.sub(secondsPerLiquidityOutsideLowerX128).toString(),
			secondsOutsideUpper.sub(secondsOutsideLower).toString(),
		];
	}

	public async observe(
		secondsAgos: Uint32String[],
	): Promise<{ tickCumulatives: string[]; secondsPerLiquidityCumulativeX128s: string[] }> {
		this._checkImmutableDependencies();

		return Oracle.observe(
			this.observationStore!,
			this.immutableContext!.context,
			this.address,
			this.immutableContext!.timestamp,
			secondsAgos,
			this.slot0.tick,
			this.slot0.observationIndex,
			this.liquidity,
			this.slot0.observationCardinality,
		);
	}

	public async increaseObservationCardinalityNext(observationCardinalityNext: Uint16String) {
		this._checkMutableDependencies();

		const observationCardinalityNextOld: Uint16 = Uint16.from(
			this.slot0.observationCardinalityNext,
		);
		const observationCardinalityNextNew: Uint16 = Uint16.from(
			await Oracle.grow(
				this.observationStore!,
				this.mutableContext!.context,
				this.address,
				observationCardinalityNextOld.toString(),
				observationCardinalityNext,
				this.simulation,
			),
		);
		this.slot0.observationCardinalityNext = observationCardinalityNextNew.toString();
		if (!observationCardinalityNextOld.eq(observationCardinalityNextNew)) {
			const events = this.events!.get(IncreaseObservationCardinalityNextEvent);
			events.add(
				this.mutableContext!.context,
				{
					observationCardinalityNextOld: observationCardinalityNextOld.toString(),
					observationCardinalityNextNew: observationCardinalityNextNew.toString(),
				},
				[this.address],
			);
		}

		if (!this.simulation) {
			await this._saveStore();
		}
	}

	public async initialize(sqrtPriceX96: Uint160String) {
		this._checkMutableDependencies();
		if (!Uint160.from(this.slot0.sqrtPriceX96).eq(0)) throw new Error('AI');

		const tick = TickMath.getTickAtSqrtRatio(sqrtPriceX96);

		const [cardinality, cardinalityNext] = await Oracle.initialize(
			this.observationStore!,
			this.mutableContext!.context,
			this.address,
			this.mutableContext!.timestamp,
			this.simulation,
		);

		this.slot0 = {
			sqrtPriceX96,
			tick,
			observationIndex: '0',
			observationCardinality: cardinality,
			observationCardinalityNext: cardinalityNext,
		};

		if (!this.simulation) {
			const events = this.events!.get(PoolInitializedEvent);
			events.add(this.mutableContext!.context, { sqrtPriceX96, tick }, [this.address]);

			await this._saveStore();
		}
	}

	public async mint(
		recipient: Buffer,
		tickLower: Int24String,
		tickUpper: Int24String,
		amount: Uint128String,
		data: string,
		callback: (
			amount0: string,
			amount1: string,
			data: string,
			pool?: SwaptoshiPoolData,
		) => Promise<void>,
	): Promise<[amount0: string, amount1: string]> {
		this._checkMutableDependencies();
		if (Uint128.from(amount).lte(0)) throw new Error('amount must be positive');

		const tickLowerBefore = await this.tickInfoStore!.getOrDefault(
			this.mutableContext!.context,
			this.tickInfoStore!.getKey(this.address, tickLower),
		);
		const tickUpperBefore = await this.tickInfoStore!.getOrDefault(
			this.mutableContext!.context,
			this.tickInfoStore!.getKey(this.address, tickUpper),
		);

		const [_, amount0Int, amount1Int, tickLowerAfter, tickUpperAfter] = await this._modifyPosition({
			owner: recipient,
			tickLower,
			tickUpper,
			liquidityDelta: Int128.from(Uint128.from(amount).toString()).toString(),
		});

		const amount0 = Uint256.from(amount0Int);
		const amount1 = Uint256.from(amount1Int);

		let balance0Before: Uint256 = Uint256.from(0);
		let balance1Before: Uint256 = Uint256.from(0);

		if (amount0.gt(0)) balance0Before = Uint256.from(await this._getBalance0());
		if (amount1.gt(0)) balance1Before = Uint256.from(await this._getBalance1());

		await callback(amount0.toString(), amount1.toString(), data, this.toJSON());

		if (!this.simulation) {
			if (amount0.gt(0) && balance0Before.add(amount0).gt(await this._getBalance0()))
				throw new Error('M0');
			if (amount1.gt(0) && balance1Before.add(amount1).gt(await this._getBalance1()))
				throw new Error('M1');

			const events = this.events!.get(MintEvent);
			events.add(
				this.mutableContext!.context,
				{
					senderAddress: this.mutableContext!.senderAddress,
					recipientAddress: recipient,
					tickLower,
					tickUpper,
					lowerLiquidityNetBefore: tickLowerBefore.liquidityNet,
					lowerLiquidityNet: tickLowerAfter.liquidityNet,
					upperLiquidityNetBefore: tickUpperBefore.liquidityNet,
					upperLiquidityNet: tickUpperAfter.liquidityNet,
				},
				[this.address, recipient],
			);

			await this._saveStore();
		}

		return [amount0.toString(), amount1.toString()];
	}

	public async collect(
		recipient: Buffer,
		tickLower: Int24String,
		tickUpper: Int24String,
		amount0Requested: Uint128String,
		amount1Requested: Uint128String,
	): Promise<[amount0: string, amount1: string]> {
		this._checkMutableDependencies();

		const position = await Position.get(
			this.positionInfoStore!,
			this.mutableContext!.context,
			this.address,
			this.mutableContext!.senderAddress,
			tickLower,
			tickUpper,
		);

		const amount0 = Uint128.from(amount0Requested).gt(position.tokensOwed0)
			? Uint128.from(position.tokensOwed0)
			: Uint128.from(amount0Requested);
		const amount1 = Uint128.from(amount1Requested).gt(position.tokensOwed1)
			? Uint128.from(position.tokensOwed1)
			: Uint128.from(amount1Requested);

		if (amount0.gt(0)) {
			position.tokensOwed0 = Uint128.from(position.tokensOwed0).sub(amount0).toString();

			if (!this.simulation) {
				await this.tokenMethod!.transfer(
					this.mutableContext!.context,
					this.address,
					recipient,
					this.token0,
					amount0.toBigInt(),
				);
			}
		}
		if (amount1.gt(0)) {
			position.tokensOwed1 = Uint128.from(position.tokensOwed1).sub(amount1).toString();

			if (!this.simulation) {
				await this.tokenMethod!.transfer(
					this.mutableContext!.context,
					this.address,
					recipient,
					this.token1,
					amount1.toBigInt(),
				);
			}
		}

		if (!this.simulation) {
			await Position.set(
				this.positionInfoStore!,
				this.mutableContext!.context,
				this.address,
				this.mutableContext!.senderAddress,
				tickLower,
				tickUpper,
				position,
			);

			const events = this.events!.get(CollectEvent);
			events.add(
				this.mutableContext!.context,
				{
					senderAddress: this.mutableContext!.senderAddress,
					recipientAddress: recipient,
					tickLower,
					tickUpper,
					amount0: amount0.toString(),
					amount1: amount1.toString(),
				},
				[this.address, recipient],
			);

			await this._saveStore();
		}

		return [amount0.toString(), amount1.toString()];
	}

	public async burn(
		tickLower: Int24String,
		tickUpper: Int24String,
		amount: Uint128String,
	): Promise<[amount0: string, amount1: string]> {
		this._checkMutableDependencies();

		const tickLowerBefore = await this.tickInfoStore!.getOrDefault(
			this.mutableContext!.context,
			this.tickInfoStore!.getKey(this.address, tickLower),
		);
		const tickUpperBefore = await this.tickInfoStore!.getOrDefault(
			this.mutableContext!.context,
			this.tickInfoStore!.getKey(this.address, tickUpper),
		);

		const [position, amount0Int, amount1Int, tickLowerAfter, tickUpperAfter] =
			await this._modifyPosition({
				owner: this.mutableContext!.senderAddress,
				tickLower,
				tickUpper,
				liquidityDelta: Int128.from(Int256.from(amount).mul(-1)).toString(),
			});

		const amount0 = Uint256.from(0).sub(amount0Int);
		const amount1 = Uint256.from(0).sub(amount1Int);

		if (!this.simulation) {
			if (amount0.gt(0) || amount1.gt(0)) {
				position.tokensOwed0 = Uint128.from(position.tokensOwed0)
					.add(Uint128.from(amount0))
					.toString();
				position.tokensOwed1 = Uint128.from(position.tokensOwed1)
					.add(Uint128.from(amount1))
					.toString();
			}

			const events = this.events!.get(BurnEvent);
			events.add(
				this.mutableContext!.context,
				{
					senderAddress: this.mutableContext!.senderAddress,
					tickLower,
					tickUpper,
					lowerLiquidityNetBefore: tickLowerBefore.liquidityNet,
					lowerLiquidityNet: tickLowerAfter.liquidityNet,
					upperLiquidityNetBefore: tickUpperBefore.liquidityNet,
					upperLiquidityNet: tickUpperAfter.liquidityNet,
				},
				[this.address, this.mutableContext!.senderAddress],
			);

			await Position.set(
				this.positionInfoStore!,
				this.mutableContext!.context,
				this.address,
				this.mutableContext!.senderAddress,
				tickLower,
				tickUpper,
				position,
			);
			await this._saveStore();
		}

		return [amount0.toString(), amount1.toString()];
	}

	public async swap(
		recipient: Buffer,
		zeroForOne: boolean,
		amountSpecified: Int256String,
		sqrtPriceLimitX96: Uint160String,
		data: string,
		callback: (
			amount0: string,
			amount1: string,
			data: string,
			pool?: SwaptoshiPoolData,
		) => Promise<void>,
	): Promise<[amount0: string, amount1: string]> {
		let context: MutableContext | ImmutableContext;
		let timestamp: string;

		if (this.simulation) {
			this._checkImmutableDependencies();
			context = this.immutableContext!.context;
			timestamp = this.immutableContext!.timestamp;
		} else {
			this._checkMutableDependencies();
			context = this.mutableContext!.context;
			timestamp = this.mutableContext!.timestamp;
		}

		let amount0: Int256;
		let amount1: Int256;

		if (Int256.from(amountSpecified).eq(0)) throw new Error('AS');

		const slot0Start = this.slot0;

		const slot0Before = utils.objects.cloneDeep(this.slot0) as Slot0;
		const liquidityBefore = this.liquidity;
		const feeGrowthGlobal0X128Before = this.feeGrowthGlobal0X128;
		const feeGrowthGlobal1X128Before = this.feeGrowthGlobal1X128;

		if (
			zeroForOne
				? Uint160.from(sqrtPriceLimitX96).gte(slot0Start.sqrtPriceX96) ||
				  Uint160.from(sqrtPriceLimitX96).lte(TickMath.MIN_SQRT_RATIO)
				: Uint160.from(sqrtPriceLimitX96).lte(slot0Start.sqrtPriceX96) ||
				  Uint160.from(sqrtPriceLimitX96).gte(TickMath.MAX_SQRT_RATIO)
		) {
			throw new Error('SPL');
		}

		const cache: SwapCache = {
			liquidityStart: this.liquidity,
			blockTimestamp: timestamp,
			feeProtocol: zeroForOne
				? Uint8.from(this.feeProtocol).mod(16).toString()
				: Uint8.from(this.feeProtocol).shr(4).toString(),
			secondsPerLiquidityCumulativeX128: '0',
			tickCumulative: '0',
			computedLatestObservation: false,
		};

		const exactInput = Int256.from(amountSpecified).gt(0);

		const state: SwapState = {
			amountSpecifiedRemaining: amountSpecified,
			amountCalculated: '0',
			sqrtPriceX96: slot0Start.sqrtPriceX96,
			tick: slot0Start.tick,
			feeGrowthGlobalX128: zeroForOne ? this.feeGrowthGlobal0X128 : this.feeGrowthGlobal1X128,
			protocolFee: '0',
			liquidity: cache.liquidityStart,
		};

		while (
			!Int256.from(state.amountSpecifiedRemaining).eq(0) &&
			!Uint160.from(state.sqrtPriceX96).eq(sqrtPriceLimitX96)
		) {
			const step: StepComputations = { ...defaultStepComputations };

			const [tickNext, initialized] = await TickBitmap.nextInitializedTickWithinOneWord(
				this.tickBitmapStore!,
				context,
				this.address,
				state.tick,
				this.tickSpacing,
				zeroForOne,
			);
			step.sqrtPriceStartX96 = state.sqrtPriceX96;
			step.tickNext = tickNext;
			step.initialized = initialized;

			if (Int24.from(step.tickNext).lt(TickMath.MIN_TICK)) {
				step.tickNext = TickMath.MIN_TICK;
			} else if (Int24.from(step.tickNext).gt(TickMath.MAX_TICK)) {
				step.tickNext = TickMath.MAX_TICK;
			}

			step.sqrtPriceNextX96 = TickMath.getSqrtRatioAtTick(step.tickNext);

			const [sqrtPriceX96, amountIn, amountOut, feeAmount] = SwapMath.computeSwapStep(
				state.sqrtPriceX96,
				(
					zeroForOne
						? Uint160.from(step.sqrtPriceNextX96).lt(sqrtPriceLimitX96)
						: Uint160.from(step.sqrtPriceNextX96).gt(sqrtPriceLimitX96)
				)
					? sqrtPriceLimitX96
					: step.sqrtPriceNextX96,
				state.liquidity,
				state.amountSpecifiedRemaining,
				this.fee,
			);
			state.sqrtPriceX96 = sqrtPriceX96;
			step.amountIn = amountIn;
			step.amountOut = amountOut;
			step.feeAmount = feeAmount;

			if (exactInput) {
				state.amountSpecifiedRemaining = Int256.from(state.amountSpecifiedRemaining)
					.sub(Int256.from(step.amountIn).add(step.feeAmount))
					.toString();
				state.amountCalculated = Int256.from(state.amountCalculated)
					.sub(Int256.from(step.amountOut))
					.toString();
			} else {
				state.amountSpecifiedRemaining = Int256.from(state.amountSpecifiedRemaining)
					.add(Int256.from(step.amountOut))
					.toString();
				state.amountCalculated = Int256.from(state.amountCalculated)
					.add(Int256.from(step.amountIn).add(step.feeAmount))
					.toString();
			}

			if (Uint8.from(cache.feeProtocol).gt(0)) {
				const delta = Uint256.from(step.feeAmount).div(cache.feeProtocol);
				step.feeAmount = Uint256.from(step.feeAmount).sub(delta).toString();
				state.protocolFee = Uint128.from(state.protocolFee).add(Uint128.from(delta)).toString();
			}

			if (Uint128.from(state.liquidity).gt(0)) {
				state.feeGrowthGlobalX128 = Uint256.from(state.feeGrowthGlobalX128)
					.add(FullMath.mulDiv(step.feeAmount, FixedPoint128.Q128, state.liquidity))
					.toString();
			}

			if (state.sqrtPriceX96 === step.sqrtPriceNextX96) {
				if (step.initialized) {
					if (!cache.computedLatestObservation) {
						const [tickCumulative, secondsPerLiquidityCumulativeX128] = await Oracle.observeSingle(
							this.observationStore!,
							context,
							this.address,
							cache.blockTimestamp,
							'0',
							slot0Start.tick,
							slot0Start.observationIndex,
							cache.liquidityStart,
							slot0Start.observationCardinality,
						);
						cache.tickCumulative = tickCumulative;
						cache.secondsPerLiquidityCumulativeX128 = secondsPerLiquidityCumulativeX128;
						cache.computedLatestObservation = true;
					}
					let liquidityNet: Int128 = Int128.from(
						await Tick.cross(
							this.tickInfoStore!,
							context as MutableContext,
							this.address,
							step.tickNext,
							zeroForOne ? state.feeGrowthGlobalX128 : this.feeGrowthGlobal0X128,
							zeroForOne ? this.feeGrowthGlobal1X128 : state.feeGrowthGlobalX128,
							cache.secondsPerLiquidityCumulativeX128,
							cache.tickCumulative,
							cache.blockTimestamp,
							this.simulation,
						),
					);
					if (zeroForOne) liquidityNet = liquidityNet.mul(-1);
					state.liquidity = LiquidityMath.addDelta(state.liquidity, liquidityNet.toString());
				}

				state.tick = zeroForOne ? Int24.from(step.tickNext).sub(1).toString() : step.tickNext;
			} else if (state.sqrtPriceX96 !== step.sqrtPriceStartX96) {
				state.tick = TickMath.getTickAtSqrtRatio(state.sqrtPriceX96);
			}
		}

		if (state.tick !== slot0Start.tick) {
			const [observationIndex, observationCardinality] = await Oracle.write(
				this.observationStore!,
				context as MutableContext,
				this.address,
				slot0Start.observationIndex,
				cache.blockTimestamp,
				slot0Start.tick,
				cache.liquidityStart,
				slot0Start.observationCardinality,
				slot0Start.observationCardinalityNext,
				this.simulation,
			);
			this.slot0.sqrtPriceX96 = state.sqrtPriceX96;
			this.slot0.tick = state.tick;
			this.slot0.observationIndex = observationIndex;
			this.slot0.observationCardinality = observationCardinality;
		} else {
			this.slot0.sqrtPriceX96 = state.sqrtPriceX96;
		}

		if (cache.liquidityStart !== state.liquidity) this.liquidity = state.liquidity;

		if (zeroForOne) {
			this.feeGrowthGlobal0X128 = state.feeGrowthGlobalX128;
			if (!this.simulation && Uint128.from(state.protocolFee).gt(0) && this._checkFeeProtocol()) {
				await this.tokenMethod!.transfer(
					this.mutableContext!.context,
					this.address,
					this.feeProtocolPool!,
					this.token0,
					BigInt(state.protocolFee),
				);
				const events = this.events!.get(CollectProtocolEvent);
				events.add(
					this.mutableContext!.context,
					{
						senderAddress: this.mutableContext!.senderAddress,
						recipientAddress: this.feeProtocolPool!,
						amount0: state.protocolFee,
						amount1: '0',
					},
					[this.address, this.feeProtocolPool!],
				);
			}
		} else {
			this.feeGrowthGlobal1X128 = state.feeGrowthGlobalX128;
			if (!this.simulation && Uint128.from(state.protocolFee).gt(0) && this._checkFeeProtocol()) {
				await this.tokenMethod!.transfer(
					this.mutableContext!.context,
					this.address,
					this.feeProtocolPool!,
					this.token1,
					BigInt(state.protocolFee),
				);
				const events = this.events!.get(CollectProtocolEvent);
				events.add(
					this.mutableContext!.context,
					{
						senderAddress: this.mutableContext!.senderAddress,
						recipientAddress: this.feeProtocolPool!,
						amount0: '0',
						amount1: state.protocolFee,
					},
					[this.address, this.feeProtocolPool!],
				);
			}
		}

		if (zeroForOne === exactInput) {
			amount0 = Int256.from(amountSpecified).sub(state.amountSpecifiedRemaining);
			amount1 = Int256.from(state.amountCalculated);
		} else {
			amount0 = Int256.from(state.amountCalculated);
			amount1 = Int256.from(amountSpecified).sub(state.amountSpecifiedRemaining);
		}

		if (zeroForOne) {
			if (!this.simulation && amount1.lt(0)) {
				await this.tokenMethod!.transfer(
					this.mutableContext!.context,
					this.address,
					recipient,
					this.token1,
					Uint256.from(0).sub(amount1).toBigInt(),
				);
			}

			const balance0Before = Uint256.from(await this._getBalance0());

			await callback(amount0.toString(), amount1.toString(), data, this.toJSON());

			if (
				!this.simulation &&
				this.mutableContext!.senderAddress.compare(this.address) !== 0 &&
				balance0Before.add(Uint256.from(amount0)).gt(await this._getBalance0())
			) {
				throw new Error('IIA');
			}
		} else {
			if (!this.simulation && amount0.lt(0)) {
				await this.tokenMethod!.transfer(
					this.mutableContext!.context,
					this.address,
					recipient,
					this.token0,
					Uint256.from(0).sub(amount0).toBigInt(),
				);
			}

			const balance1Before = Uint256.from(await this._getBalance1());

			await callback(amount0.toString(), amount1.toString(), data, this.toJSON());

			if (
				!this.simulation &&
				this.mutableContext!.senderAddress.compare(this.address) !== 0 &&
				balance1Before.add(Uint256.from(amount1)).gt(await this._getBalance1())
			) {
				throw new Error('IIA');
			}
		}

		if (!this.simulation) {
			const events = this.events!.get(SwapEvent);
			events.add(
				this.mutableContext!.context,
				{
					senderAddress: this.mutableContext!.senderAddress,
					recipientAddress: recipient,
					amount0: amount0.toString(),
					amount1: amount1.toString(),
					sqrtPriceX96Before: slot0Before.sqrtPriceX96,
					sqrtPriceX96: state.sqrtPriceX96,
					liquidityBefore,
					liquidity: state.liquidity,
					tickBefore: slot0Before.tick,
					tick: state.tick,
					feeGrowthGlobal0X128Before,
					feeGrowthGlobal0X128: this.feeGrowthGlobal0X128,
					feeGrowthGlobal1X128Before,
					feeGrowthGlobal1X128: this.feeGrowthGlobal1X128,
				},
				[this.address, recipient],
			);

			await this._saveStore();
		}

		return [amount0.toString(), amount1.toString()];
	}

	public async flash(
		recipient: Buffer,
		amount0: Uint256String,
		amount1: Uint256String,
		data: string,
		callback: (fee0: string, fee1: string, data: string, pool?: SwaptoshiPoolData) => Promise<void>,
	) {
		this._checkMutableDependencies();

		const _liquidity = this.liquidity;
		if (Uint128.from(_liquidity).lte(0)) throw new Error('L');

		const fee0: Uint256 = Uint256.from(FullMath.mulDivRoundingUp(amount0, this.fee, '1000000'));
		const fee1: Uint256 = Uint256.from(FullMath.mulDivRoundingUp(amount1, this.fee, '1000000'));
		const balance0Before: Uint256 = Uint256.from(await this._getBalance0());
		const balance1Before: Uint256 = Uint256.from(await this._getBalance1());

		if (!this.simulation) {
			if (Uint256.from(amount0).gt(0))
				await this.tokenMethod!.transfer(
					this.mutableContext!.context,
					this.address,
					recipient,
					this.token0,
					BigInt(amount0),
				);
			if (Uint256.from(amount1).gt(0))
				await this.tokenMethod!.transfer(
					this.mutableContext!.context,
					this.address,
					recipient,
					this.token1,
					BigInt(amount1),
				);
		}

		await callback(fee0.toString(), fee1.toString(), data, this.toJSON());

		const balance0After = Uint256.from(await this._getBalance0());
		const balance1After = Uint256.from(await this._getBalance1());

		if (!this.simulation) {
			if (balance0Before.add(fee0).gt(balance0After)) throw new Error('F0');
			if (balance1Before.add(fee1).gt(balance1After)) throw new Error('F1');
		}

		const paid0 = Uint256.from(balance0After).sub(balance0Before);
		const paid1 = Uint256.from(balance1After).sub(balance1Before);

		if (paid0.gt(0)) {
			const feeProtocol0 = Uint8.from(this.feeProtocol).mod(16);
			const fees0 = Uint256.from(feeProtocol0.eq(0) ? 0 : paid0.div(feeProtocol0));
			if (Uint128.from(fees0).gt(0) && this._checkFeeProtocol()) {
				if (!this.simulation) {
					await this.tokenMethod!.transfer(
						this.mutableContext!.context,
						this.address,
						this.feeProtocolPool!,
						this.token0,
						fees0.toBigInt(),
					);
				}
				const events = this.events!.get(CollectProtocolEvent);
				events.add(
					this.mutableContext!.context,
					{
						senderAddress: this.mutableContext!.senderAddress,
						recipientAddress: this.feeProtocolPool!,
						amount0: fees0.toString(),
						amount1: '0',
					},
					[this.address, this.feeProtocolPool!],
				);
			}
			this.feeGrowthGlobal0X128 = Uint256.from(this.feeGrowthGlobal0X128)
				.add(FullMath.mulDiv(paid0.sub(fees0).toString(), FixedPoint128.Q128, _liquidity))
				.toString();
		}
		if (paid1.gt(0)) {
			const feeProtocol1 = Uint8.from(this.feeProtocol).shr(4);
			const fees1 = Uint256.from(feeProtocol1.eq(0) ? 0 : paid1.div(feeProtocol1));
			if (Uint128.from(fees1).gt(0) && this._checkFeeProtocol()) {
				if (!this.simulation) {
					await this.tokenMethod!.transfer(
						this.mutableContext!.context,
						this.address,
						this.feeProtocolPool!,
						this.token1,
						fees1.toBigInt(),
					);
				}
				const events = this.events!.get(CollectProtocolEvent);
				events.add(
					this.mutableContext!.context,
					{
						senderAddress: this.mutableContext!.senderAddress,
						recipientAddress: this.feeProtocolPool!,
						amount0: '0',
						amount1: fees1.toString(),
					},
					[this.address, this.feeProtocolPool!],
				);
			}
			this.feeGrowthGlobal1X128 = Uint256.from(this.feeGrowthGlobal1X128)
				.add(FullMath.mulDiv(paid1.sub(fees1).toString(), FixedPoint128.Q128, _liquidity))
				.toString();
		}

		if (!this.simulation) {
			const events = this.events!.get(FlashEvent);
			events.add(
				this.mutableContext!.context,
				{
					senderAddress: this.mutableContext!.senderAddress,
					recipientAddress: recipient,
					amount0,
					amount1,
					paid0: paid0.toString(),
					paid1: paid1.toString(),
				},
				[this.address, recipient],
			);

			await this._saveStore();
		}
	}

	public async getTick(tick: Int24String) {
		this._checkImmutableDependencies();
		return this.tickInfoStore!.getOrDefault(
			this.immutableContext!.context,
			this.tickInfoStore!.getKey(this.address, tick),
		);
	}

	public async getTickBitmap(index: Int16String) {
		this._checkImmutableDependencies();
		return (
			await this.tickBitmapStore!.getOrDefault(
				this.immutableContext!.context,
				this.tickBitmapStore!.getKey(this.address, index),
			)
		).bitmap;
	}

	public toJSON(): SwaptoshiPoolData {
		return utils.objects.cloneDeep({
			token0: this.token0,
			token1: this.token1,
			fee: this.fee,
			tickSpacing: this.tickSpacing,
			maxLiquidityPerTick: this.maxLiquidityPerTick,
			feeGrowthGlobal0X128: this.feeGrowthGlobal0X128,
			feeGrowthGlobal1X128: this.feeGrowthGlobal1X128,
			liquidity: this.liquidity,
			slot0: this.slot0,
		}) as SwaptoshiPoolData;
	}

	private async _getBalance0() {
		return this.tokenMethod!.getAvailableBalance(
			this.immutableContext!.context,
			this.address,
			this.token0,
		);
	}

	private async _getBalance1() {
		return this.tokenMethod!.getAvailableBalance(
			this.immutableContext!.context,
			this.address,
			this.token1,
		);
	}

	private async _saveStore() {
		await this.poolStore!.set(this.mutableContext!.context, this.address, this.toJSON());
	}

	private _checkMutableDependencies() {
		if (!this.mutableDependencyReady) {
			throw new Error('dependencies not configured');
		}
	}

	private _checkImmutableDependencies() {
		if (!this.immutableDependencyReady) {
			throw new Error('dependencies not configured');
		}
	}

	private _checkFeeProtocol() {
		return this.feeProtocol > 0 && this.feeProtocolPool && this.feeProtocolPool.length === 20;
	}

	private _checkTicks(tickLower: Int24String, tickUpper: Int24String) {
		if (Int24.from(tickLower).gte(tickUpper)) throw new Error('TLU');
		if (Int24.from(tickLower).lt(TickMath.MIN_TICK)) throw new Error('TLM');
		if (Int24.from(tickUpper).gt(TickMath.MAX_TICK)) throw new Error('TUM');
	}

	private async _modifyPosition(
		params: ModifyPositionParams,
	): Promise<
		[
			position: PositionInfo,
			amount0: Int256String,
			amount1: Int256String,
			lowerTickInfo: TickInfo,
			upperTickInfo: TickInfo,
		]
	> {
		this._checkTicks(params.tickLower, params.tickUpper);

		let amount0: Int256 = Int256.from(0);
		let amount1: Int256 = Int256.from(0);

		const _slot0 = this.slot0;

		const [position, lowerTickInfo, upperTickInfo] = await this._updatePosition(
			params.owner,
			params.tickLower,
			params.tickUpper,
			params.liquidityDelta,
			_slot0.tick,
		);

		if (!Int128.from(params.liquidityDelta).eq(0)) {
			if (Int24.from(_slot0.tick).lt(params.tickLower)) {
				amount0 = Int256.from(
					SqrtPriceMath.getAmount0Delta(
						TickMath.getSqrtRatioAtTick(params.tickLower),
						TickMath.getSqrtRatioAtTick(params.tickUpper),
						params.liquidityDelta,
					),
				);
			} else if (Int24.from(_slot0.tick).lt(params.tickUpper)) {
				const liquidityBefore = Uint128.from(this.liquidity);
				const [observationIndex, observationCardinality] = await Oracle.write(
					this.observationStore!,
					this.mutableContext!.context,
					this.address,
					_slot0.observationIndex,
					this.mutableContext!.timestamp,
					_slot0.tick,
					liquidityBefore.toString(),
					_slot0.observationCardinality,
					_slot0.observationCardinalityNext,
					this.simulation,
				);
				this.slot0.observationIndex = observationIndex;
				this.slot0.observationCardinality = observationCardinality;
				amount0 = Int256.from(
					SqrtPriceMath.getAmount0Delta(
						_slot0.sqrtPriceX96,
						TickMath.getSqrtRatioAtTick(params.tickUpper),
						params.liquidityDelta,
					),
				);
				amount1 = Int256.from(
					SqrtPriceMath.getAmount1Delta(
						TickMath.getSqrtRatioAtTick(params.tickLower),
						_slot0.sqrtPriceX96,
						params.liquidityDelta,
					),
				);

				this.liquidity = LiquidityMath.addDelta(liquidityBefore.toString(), params.liquidityDelta);
			} else {
				amount1 = Int256.from(
					SqrtPriceMath.getAmount1Delta(
						TickMath.getSqrtRatioAtTick(params.tickLower),
						TickMath.getSqrtRatioAtTick(params.tickUpper),
						params.liquidityDelta,
					),
				);
			}
		}

		return [position, amount0.toString(), amount1.toString(), lowerTickInfo, upperTickInfo];
	}

	private async _updatePosition(
		owner: Buffer,
		tickLower: Int24String,
		tickUpper: Int24String,
		liquidityDelta: Int128String,
		tick: Int24String,
	): Promise<[position: PositionInfo, lowerTickInfo: TickInfo, upperTickInfo: TickInfo]> {
		const position = await Position.get(
			this.positionInfoStore!,
			this.mutableContext!.context,
			this.address,
			owner,
			tickLower,
			tickUpper,
		);

		const _feeGrowthGlobal0X128 = Uint256.from(this.feeGrowthGlobal0X128);
		const _feeGrowthGlobal1X128 = Uint256.from(this.feeGrowthGlobal1X128);

		let flippedLower;
		let flippedUpper;

		let lowerTickInfo = await this.tickInfoStore!.getOrDefault(
			this.mutableContext!.context,
			this.tickInfoStore!.getKey(this.address, tickLower),
		);
		let upperTickInfo = await this.tickInfoStore!.getOrDefault(
			this.mutableContext!.context,
			this.tickInfoStore!.getKey(this.address, tickUpper),
		);

		if (!Int128.from(liquidityDelta).eq(0)) {
			const time = this.mutableContext!.timestamp;
			const [tickCumulative, secondsPerLiquidityCumulativeX128] = await Oracle.observeSingle(
				this.observationStore!,
				this.mutableContext!.context,
				this.address,
				time,
				'0',
				this.slot0.tick,
				this.slot0.observationIndex,
				this.liquidity,
				this.slot0.observationCardinality,
			);

			[flippedLower, lowerTickInfo] = await Tick.update(
				this.tickInfoStore!,
				this.mutableContext!.context,
				this.address,
				tickLower,
				tick,
				liquidityDelta,
				_feeGrowthGlobal0X128.toString(),
				_feeGrowthGlobal1X128.toString(),
				secondsPerLiquidityCumulativeX128,
				tickCumulative,
				time,
				false,
				this.maxLiquidityPerTick,
				this.simulation,
			);
			[flippedUpper, upperTickInfo] = await Tick.update(
				this.tickInfoStore!,
				this.mutableContext!.context,
				this.address,
				tickUpper,
				tick,
				liquidityDelta,
				_feeGrowthGlobal0X128.toString(),
				_feeGrowthGlobal1X128.toString(),
				secondsPerLiquidityCumulativeX128,
				tickCumulative,
				time,
				true,
				this.maxLiquidityPerTick,
				this.simulation,
			);

			if (flippedLower) {
				await TickBitmap.flipTick(
					this.tickBitmapStore!,
					this.mutableContext!.context,
					this.address,
					tickLower,
					this.tickSpacing,
					this.simulation,
				);
			}
			if (flippedUpper) {
				await TickBitmap.flipTick(
					this.tickBitmapStore!,
					this.mutableContext!.context,
					this.address,
					tickUpper,
					this.tickSpacing,
					this.simulation,
				);
			}
		}

		const [feeGrowthInside0X128, feeGrowthInside1X128] = await Tick.getFeeGrowthInside(
			this.tickInfoStore!,
			this.mutableContext!.context,
			this.address,
			tickLower,
			tickUpper,
			tick,
			_feeGrowthGlobal0X128.toString(),
			_feeGrowthGlobal1X128.toString(),
		);

		Position.update(position, liquidityDelta, feeGrowthInside0X128, feeGrowthInside1X128);
		if (!this.simulation) {
			await Position.set(
				this.positionInfoStore!,
				this.mutableContext!.context,
				this.address,
				owner,
				tickLower,
				tickUpper,
				position,
			);
		}

		if (Int128.from(liquidityDelta).lt(0)) {
			if (flippedLower) {
				await Tick.clear(
					this.tickInfoStore!,
					this.mutableContext!.context,
					this.address,
					tickLower,
					this.simulation,
				);
			}
			if (flippedUpper) {
				await Tick.clear(
					this.tickInfoStore!,
					this.mutableContext!.context,
					this.address,
					tickUpper,
					this.simulation,
				);
			}
		}

		return [position, lowerTickInfo, upperTickInfo];
	}

	private _validateFeeProtocol() {
		if (this._checkFeeProtocol()) {
			const feeProtocol0 = Uint8.from(this.feeProtocol).mod(16);
			const feeProtocol1 = Uint8.from(this.feeProtocol).shr(4);
			if (
				!(
					Uint8.from(feeProtocol0).eq(0) ||
					(Uint8.from(feeProtocol0).gte(4) && Uint8.from(feeProtocol0).lte(10))
				) ||
				!(
					Uint8.from(feeProtocol1).eq(0) ||
					(Uint8.from(feeProtocol1).gte(4) && Uint8.from(feeProtocol1).lte(10))
				)
			) {
				throw new Error('setFeeeProtocol failed');
			}
		}
	}

	public readonly address: Buffer = Buffer.alloc(0);
	public readonly lisk32: string = '';
	public readonly collectionId: Buffer = Buffer.alloc(0);

	public token0: Buffer = Buffer.alloc(0);
	public token1: Buffer = Buffer.alloc(0);
	public fee: Uint24String = '0';
	public tickSpacing: Int24String = '0';
	public maxLiquidityPerTick: Uint128String = '0';
	public slot0: Slot0 = { ...defaultSlot0 };
	public feeGrowthGlobal0X128: Uint256String = '0';
	public feeGrowthGlobal1X128: Uint256String = '0';
	public liquidity: Uint128String = '0';

	private readonly poolStore: PoolStore | undefined;
	private readonly tickInfoStore: TickInfoStore | undefined;
	private readonly positionInfoStore: PositionInfoStore | undefined;
	private readonly observationStore: ObservationStore | undefined;
	private readonly tickBitmapStore: TickBitmapStore | undefined;
	private readonly events: NamedRegistry | undefined;
	private readonly stores: NamedRegistry | undefined;
	private readonly config: DexModuleConfig | undefined;
	private readonly simulation: boolean = false;

	private feeProtocol: number = 0;
	private feeProtocolPool: Buffer | undefined;
	private immutableContext: ImmutableSwapContext | undefined;
	private mutableContext: MutableSwapContext | undefined;
	private tokenMethod: TokenMethod | undefined;

	private mutableDependencyReady = false;
	private immutableDependencyReady = false;
}
