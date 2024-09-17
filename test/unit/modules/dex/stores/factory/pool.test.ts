/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable camelcase */
/* eslint-disable jest/expect-expect */
import { StateMachine } from 'klayr-sdk';
import {
	expandTo18Decimals,
	FeeAmount,
	getMaxTick,
	getMinTick,
	encodePriceSqrt,
	TICK_SPACINGS,
	createPoolFunctions,
	SwapFunction,
	MintFunction,
	getMaxLiquidityPerTick,
	FlashFunction,
	MaxUint128,
	MAX_SQRT_RATIO,
	MIN_SQRT_RATIO,
	SwapToPriceFunction,
} from '../shared/utilities';
import { TEST_POOL_START_TIME, poolFixture } from '../shared/pool';
import { checkObservationEquals } from '../shared/fixtures/OracleTest';

import * as sqrtTickMath from '../../../../../../src/app/modules/dex/stores/library/core/tick_math';
import * as swapMath from '../../../../../../src/app/modules/dex/stores/library/core/swap_math';
import { BigIntAble, Int24, Int56, Uint, Uint128, Uint160, Uint256 } from '../../../../../../src/app/modules/dex/stores/library/int';
import { DEXPool } from '../../../../../../src/app/modules/dex/stores/factory';
import { TestCallee, mockedFlashCallback } from '../shared/fixtures/TestCallee';
import { DexModule } from '../../../../../../src/app/modules/dex/module';
import { methodContextFixture } from '../shared/module';
import { methodSwapContext } from '../../../../../../src/app/modules/dex/stores/context';
import { ObservationStore } from '../../../../../../src/app/modules/dex/stores/observation';
import { eventResultContain, eventResultHaveLength } from '../../../../../utils/events';
import { PoolInitializedEvent } from '../../../../../../src/app/modules/dex/events/pool_initialized';
import { IncreaseObservationCardinalityNextEvent } from '../../../../../../src/app/modules/dex/events/increase_observation_cardinality_next';
import { mock_token_transfer } from '../shared/token';
import { advanceTime, setFeeGrowthGlobal0X128, setFeeGrowthGlobal1X128 } from '../shared/fixtures/PoolUtilities';
import { DexModuleConfig, MutableSwapContext, TokenMethod } from '../../../../../../src/app/modules/dex/types';
import { FeeProtocol } from '../../../../../../src/app/modules/dex/stores/library/periphery';
import { CollectProtocolEvent } from '../../../../../../src/app/modules/dex/events/collect_protocol';
import { DEFAULT_TREASURY_ADDRESS } from '../../../../../../src/app/modules/dex/constants';
import { Position } from '../../../../../../src/app/modules/dex/stores/library/core';
import { PositionInfoStore } from '../../../../../../src/app/modules/dex/stores/position_info';
import { BurnEvent } from '../../../../../../src/app/modules/dex/events/burn';
import { FlashEvent } from '../../../../../../src/app/modules/dex/events/flash';
import { TestSwapPay } from '../shared/fixtures/TestSwapPay';

const sender = Buffer.from('0000000000000000000000000000000000000007', 'hex');
const other = Buffer.from('0000000000000000000000000000000000000008', 'hex');
const AddressZero = Buffer.from('0000000000000000000000000000000000000000', 'hex');

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;

describe('DEX Pool', () => {
	let module: DexModule;
	let createMethodContext: () => StateMachine.MethodContext;
	let otherContext: MutableSwapContext;
	let senderContext: MutableSwapContext;
	let context: StateMachine.MethodContext;
	let observationStore: ObservationStore;
	let tokenMethod: TokenMethod;
	let config: DexModuleConfig;
	let positionInfoStore: PositionInfoStore;

	let token0: Buffer;
	let token1: Buffer;

	let pool: DEXPool;

	let swapTarget: TestCallee;

	let swapToLowerPrice: SwapToPriceFunction;
	let swapToHigherPrice: SwapToPriceFunction;
	let swapExact0For1: SwapFunction;
	let swapExact1For0: SwapFunction;

	let tickSpacing: number;

	let minTick: number;
	let maxTick: number;

	let mint: MintFunction;
	let flash: FlashFunction;
	let createPool: ThenArg<ReturnType<typeof poolFixture>>['createPool'];

	beforeEach(jest.clearAllMocks);

	beforeEach(async () => {
		({ module, createMethodContext, tokenMethod, observationStore, config, positionInfoStore } = await methodContextFixture());
		context = createMethodContext();
		const swapContext = methodSwapContext(context, sender, parseInt(TEST_POOL_START_TIME, 10));
		otherContext = methodSwapContext(context, other, parseInt(TEST_POOL_START_TIME, 10));
		senderContext = methodSwapContext(context, sender, parseInt(TEST_POOL_START_TIME, 10));
		({ token0, token1, createPool, swapTargetCallee: swapTarget } = await poolFixture(swapContext, module));

		const oldCreatePool = createPool;
		createPool = async (_feeAmount, _tickSpacing) => {
			const _pool = await oldCreatePool(_feeAmount, _tickSpacing);
			({ swapToLowerPrice, swapToHigherPrice, swapExact0For1, swapExact1For0, mint, flash } = createPoolFunctions({
				token0,
				token1,
				swapTarget,
				pool: _pool,
			}));
			minTick = getMinTick(_tickSpacing);
			maxTick = getMaxTick(_tickSpacing);
			tickSpacing = parseInt(_tickSpacing, 10);
			return _pool;
		};

		// default to the 30 bips pool
		pool = await createPool(FeeAmount.MEDIUM, TICK_SPACINGS[FeeAmount.MEDIUM]);
	});

	it('constructor initializes immutables', () => {
		expect(pool.token0).toStrictEqual(token0);
		expect(pool.token1).toStrictEqual(token1);
		expect(pool.maxLiquidityPerTick).toStrictEqual(getMaxLiquidityPerTick(tickSpacing.toString()).toString());
	});

	function setFeeProtocol(tokenA: string, tokenB: string) {
		pool.setConfig({
			...config,
			feeProtocol: FeeProtocol.calculateFeeProtocol(tokenA, tokenB),
		});
	}

	describe('#initialize', () => {
		it('fails if already initialized', async () => {
			await pool.initialize(encodePriceSqrt(1, 1).toString());
			await expect((async () => pool.initialize(encodePriceSqrt(1, 1).toString()))()).rejects.toThrow();
		});
		it('fails if starting price is too low', async () => {
			await expect((async () => pool.initialize('1'))()).rejects.toThrow('R');
			await expect((async () => pool.initialize(MIN_SQRT_RATIO.sub(1).toString()))()).rejects.toThrow('R');
		});
		it('fails if starting price is too high', async () => {
			await expect((async () => pool.initialize(MAX_SQRT_RATIO.toString()))()).rejects.toThrow('R');
			await expect((async () => pool.initialize(Uint.from(2).pow(160).sub(1).toString()))()).rejects.toThrow('R');
		});
		it('can be initialized at MIN_SQRT_RATIO', async () => {
			await pool.initialize(MIN_SQRT_RATIO.toString());
			expect(pool.slot0.tick).toBe(getMinTick('1').toString());
		});
		it('can be initialized at MAX_SQRT_RATIO - 1', async () => {
			await pool.initialize(MAX_SQRT_RATIO.sub(1).toString());
			expect(pool.slot0.tick).toBe((getMaxTick('1') - 1).toString());
		});
		it('sets initial variables', async () => {
			const price = encodePriceSqrt(1, 2);
			await pool.initialize(price.toString());

			const { sqrtPriceX96, observationIndex } = pool.slot0;
			expect(sqrtPriceX96).toBe(price.toString());
			expect(observationIndex).toBe('0');
			expect(pool.slot0.tick).toBe('-6932');
		});
		it('initializes the first observations slot', async () => {
			await pool.initialize(encodePriceSqrt(1, 1).toString());
			const oracleData = await observationStore.getOrDefault(context, observationStore.getKey(pool.address, '0'));
			checkObservationEquals(oracleData, {
				secondsPerLiquidityCumulativeX128: '0',
				initialized: true,
				blockTimestamp: TEST_POOL_START_TIME.toString(),
				tickCumulative: '0',
			});
		});
		it('emits a Initialized event with the input tick', async () => {
			const sqrtPriceX96 = encodePriceSqrt(1, 2);
			await pool.initialize(sqrtPriceX96.toString());
			eventResultContain(context.eventQueue, PoolInitializedEvent, module.name, {
				sqrtPriceX96: sqrtPriceX96.toString(),
				tick: '-6932',
			});
		});
	});

	describe('#increaseObservationCardinalityNext', () => {
		it('can only be called after initialize', async () => {
			await expect((async () => pool.increaseObservationCardinalityNext('2'))()).rejects.toThrow();
		});
		it('emits an event including both old and new', async () => {
			await pool.initialize(encodePriceSqrt(1, 1).toString());
			await pool.increaseObservationCardinalityNext('2');
			eventResultContain(context.eventQueue, IncreaseObservationCardinalityNextEvent, module.name, {
				observationCardinalityNextOld: '1',
				observationCardinalityNextNew: '2',
			});
		});
		it('does not emit an event for no op call', async () => {
			await pool.initialize(encodePriceSqrt(1, 1).toString());
			await pool.increaseObservationCardinalityNext('3');
			await pool.increaseObservationCardinalityNext('2');
			eventResultHaveLength(context.eventQueue, IncreaseObservationCardinalityNextEvent, module.name, 1);
		});
		it('does not change cardinality next if less than current', async () => {
			await pool.initialize(encodePriceSqrt(1, 1).toString());
			await pool.increaseObservationCardinalityNext('3');
			await pool.increaseObservationCardinalityNext('2');
			expect(pool.slot0.observationCardinalityNext).toBe('3');
		});
		it('increases cardinality and cardinality next first time', async () => {
			await pool.initialize(encodePriceSqrt(1, 1).toString());
			await pool.increaseObservationCardinalityNext('2');
			const { observationCardinality, observationCardinalityNext } = pool.slot0;
			expect(observationCardinality).toBe('1');
			expect(observationCardinalityNext).toBe('2');
		});
	});

	describe('#mint', () => {
		it('fails if not initialized', async () => {
			await expect((async () => mint(sender.toString('hex'), -tickSpacing, tickSpacing, 1))()).rejects.toThrow();
		});
		describe('after initialization', () => {
			beforeEach(async () => {
				await pool.initialize(encodePriceSqrt(1, 10).toString());
				await mint(sender.toString('hex'), minTick, maxTick, 3161);
			});

			describe('failure cases', () => {
				it('fails if tickLower greater than tickUpper', async () => {
					// should be TLU but...hardhat
					await expect((async () => mint(sender.toString('hex'), 1, 0, 1))()).rejects.toThrow();
				});
				it('fails if tickLower less than min tick', async () => {
					// should be TLM but...hardhat
					await expect((async () => mint(sender.toString('hex'), -887273, 0, 1))()).rejects.toThrow();
				});
				it('fails if tickUpper greater than max tick', async () => {
					// should be TUM but...hardhat
					await expect((async () => mint(sender.toString('hex'), 0, 887273, 1))()).rejects.toThrow();
				});
				it('fails if amount exceeds the max', async () => {
					// these should fail with 'LO' but hardhat is bugged
					const maxLiquidityGross = Uint128.from(pool.maxLiquidityPerTick);
					await expect((async () => mint(sender.toString('hex'), minTick + tickSpacing, maxTick - tickSpacing, maxLiquidityGross.add(1).toString()))()).rejects.toThrow();
					await expect((async () => mint(sender.toString('hex'), minTick + tickSpacing, maxTick - tickSpacing, maxLiquidityGross.toString()))()).resolves.not.toThrow();
				});
				it('fails if total amount at tick exceeds the max', async () => {
					// these should fail with 'LO' but hardhat is bugged
					await mint(sender.toString('hex'), minTick + tickSpacing, maxTick - tickSpacing, 1000);

					const maxLiquidityGross = Uint128.from(pool.maxLiquidityPerTick);
					await expect((async () => mint(sender.toString('hex'), minTick + tickSpacing, maxTick - tickSpacing, maxLiquidityGross.sub(1000).add(1).toString()))()).rejects.toThrow();
					await expect((async () => mint(sender.toString('hex'), minTick + tickSpacing * 2, maxTick - tickSpacing, maxLiquidityGross.sub(1000).add(1).toString()))()).rejects.toThrow();
					await expect((async () => mint(sender.toString('hex'), minTick + tickSpacing, maxTick - tickSpacing * 2, maxLiquidityGross.sub(1000).add(1).toString()))()).rejects.toThrow();
					await expect((async () => mint(sender.toString('hex'), minTick + tickSpacing, maxTick - tickSpacing, maxLiquidityGross.sub(1000).toString()))()).resolves.not.toThrow();
				});
				it('fails if amount is 0', async () => {
					await expect((async () => mint(sender.toString('hex'), minTick + tickSpacing, maxTick - tickSpacing, 0))()).rejects.toThrow();
				});
			});

			describe('success cases', () => {
				it('initial balances', async () => {
					expect((await tokenMethod.getAvailableBalance(context, pool.address, token0)).toString()).toBe('9996');
					expect((await tokenMethod.getAvailableBalance(context, pool.address, token1)).toString()).toBe('1000');
				});

				it('initial tick', () => {
					expect(pool.slot0.tick).toBe('-23028');
				});

				describe('above current price', () => {
					it('transfers token0 only', async () => {
						await mint(sender.toString('hex'), -22980, 0, 10000);
						expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '21549');
						expect((await tokenMethod.getAvailableBalance(context, pool.address, token0)).toString()).toBe((9996 + 21549).toString());
						expect((await tokenMethod.getAvailableBalance(context, pool.address, token1)).toString()).toBe('1000');
					});

					it('max tick with max leverage', async () => {
						await mint(sender.toString('hex'), maxTick - tickSpacing, maxTick, Uint.from(2).pow(102));
						expect((await tokenMethod.getAvailableBalance(context, pool.address, token0)).toString()).toBe((9996 + 828011525).toString());
						expect((await tokenMethod.getAvailableBalance(context, pool.address, token1)).toString()).toBe('1000');
					});

					it('works for max tick', async () => {
						await mint(sender.toString('hex'), -22980, maxTick, 10000);
						expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '31549');
						expect((await tokenMethod.getAvailableBalance(context, pool.address, token0)).toString()).toBe((9996 + 31549).toString());
						expect((await tokenMethod.getAvailableBalance(context, pool.address, token1)).toString()).toBe('1000');
					});

					it('removing works', async () => {
						await mint(sender.toString('hex'), -240, 0, 10000);
						await pool.burn('-240', '0', '10000');
						const [amount0, amount1] = await pool.collect(sender, '-240', '0', MaxUint128.toString(), MaxUint128.toString());
						expect(amount0).toBe('120');
						expect(amount1).toBe('0');
					});

					it('adds liquidity to liquidityGross', async () => {
						await mint(sender.toString('hex'), -240, 0, 100);
						expect((await pool.getTick('-240')).liquidityGross).toBe('100');
						expect((await pool.getTick('0')).liquidityGross).toBe('100');
						expect((await pool.getTick(tickSpacing.toString())).liquidityGross).toBe('0');
						expect((await pool.getTick((tickSpacing * 2).toString())).liquidityGross).toBe('0');
						await mint(sender.toString('hex'), -240, tickSpacing, 150);
						expect((await pool.getTick('-240')).liquidityGross).toBe('250');
						expect((await pool.getTick('0')).liquidityGross).toBe('100');
						expect((await pool.getTick(tickSpacing.toString())).liquidityGross).toBe('150');
						expect((await pool.getTick((tickSpacing * 2).toString())).liquidityGross).toBe('0');
						await mint(sender.toString('hex'), 0, tickSpacing * 2, 60);
						expect((await pool.getTick('-240')).liquidityGross).toBe('250');
						expect((await pool.getTick('0')).liquidityGross).toBe('160');
						expect((await pool.getTick(tickSpacing.toString())).liquidityGross).toBe('150');
						expect((await pool.getTick((tickSpacing * 2).toString())).liquidityGross).toBe('60');
					});

					it('removes liquidity from liquidityGross', async () => {
						await mint(sender.toString('hex'), -240, 0, 100);
						await mint(sender.toString('hex'), -240, 0, 40);
						await pool.burn('-240', '0', '90');
						expect((await pool.getTick('-240')).liquidityGross).toBe('50');
						expect((await pool.getTick('0')).liquidityGross).toBe('50');
					});

					it('clears tick lower if last position is removed', async () => {
						await mint(sender.toString('hex'), -240, 0, 100);
						await pool.burn('-240', '0', '100');
						const { liquidityGross, feeGrowthOutside0X128, feeGrowthOutside1X128 } = await pool.getTick('-240');
						expect(liquidityGross).toBe('0');
						expect(feeGrowthOutside0X128).toBe('0');
						expect(feeGrowthOutside1X128).toBe('0');
					});

					it('clears tick upper if last position is removed', async () => {
						await mint(sender.toString('hex'), -240, 0, 100);
						await pool.burn('-240', '0', '100');
						const { liquidityGross, feeGrowthOutside0X128, feeGrowthOutside1X128 } = await pool.getTick('0');
						expect(liquidityGross).toBe('0');
						expect(feeGrowthOutside0X128).toBe('0');
						expect(feeGrowthOutside1X128).toBe('0');
					});
					it('only clears the tick that is not used at all', async () => {
						await mint(sender.toString('hex'), -240, 0, 100);
						await mint(sender.toString('hex'), -tickSpacing, 0, 250);
						await pool.burn('-240', '0', '100');

						let { liquidityGross, feeGrowthOutside0X128, feeGrowthOutside1X128 } = await pool.getTick('-240');
						expect(liquidityGross).toBe('0');
						expect(feeGrowthOutside0X128).toBe('0');
						expect(feeGrowthOutside1X128).toBe('0');
						({ liquidityGross, feeGrowthOutside0X128, feeGrowthOutside1X128 } = await pool.getTick((-tickSpacing).toString()));
						expect(liquidityGross).toBe('250');
						expect(feeGrowthOutside0X128).toBe('0');
						expect(feeGrowthOutside1X128).toBe('0');
					});

					it('does not write an observation', async () => {
						let oracleData = await observationStore.getOrDefault(context, observationStore.getKey(pool.address, '0'));
						checkObservationEquals(oracleData, {
							tickCumulative: '0',
							blockTimestamp: TEST_POOL_START_TIME.toString(),
							initialized: true,
							secondsPerLiquidityCumulativeX128: '0',
						});
						advanceTime.bind(pool)('1');
						await mint(sender.toString('hex'), -240, 0, 100);
						oracleData = await observationStore.getOrDefault(context, observationStore.getKey(pool.address, '0'));
						checkObservationEquals(oracleData, {
							tickCumulative: '0',
							blockTimestamp: TEST_POOL_START_TIME.toString(),
							initialized: true,
							secondsPerLiquidityCumulativeX128: '0',
						});
					});
				});

				describe('including current price', () => {
					it('price within range: transfers current price of both tokens', async () => {
						await mint(sender.toString('hex'), minTick + tickSpacing, maxTick - tickSpacing, 100);
						expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '317');
						expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '32');
						expect((await tokenMethod.getAvailableBalance(context, pool.address, token0)).toString()).toBe((9996 + 317).toString());
						expect((await tokenMethod.getAvailableBalance(context, pool.address, token1)).toString()).toBe((1000 + 32).toString());
					});

					it('initializes lower tick', async () => {
						await mint(sender.toString('hex'), minTick + tickSpacing, maxTick - tickSpacing, 100);
						const { liquidityGross } = await pool.getTick((minTick + tickSpacing).toString());
						expect(liquidityGross).toBe('100');
					});

					it('initializes upper tick', async () => {
						await mint(sender.toString('hex'), minTick + tickSpacing, maxTick - tickSpacing, 100);
						const { liquidityGross } = await pool.getTick((maxTick - tickSpacing).toString());
						expect(liquidityGross).toBe('100');
					});

					it('works for min/max tick', async () => {
						await mint(sender.toString('hex'), minTick, maxTick, 10000);
						expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '31623');
						expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '3163');
						expect((await tokenMethod.getAvailableBalance(context, pool.address, token0)).toString()).toBe((9996 + 31623).toString());
						expect((await tokenMethod.getAvailableBalance(context, pool.address, token1)).toString()).toBe((1000 + 3163).toString());
					});

					it('removing works', async () => {
						await mint(sender.toString('hex'), minTick + tickSpacing, maxTick - tickSpacing, 100);
						await pool.burn((minTick + tickSpacing).toString(), (maxTick - tickSpacing).toString(), '100');
						const [amount0, amount1] = await pool.collect(sender, (minTick + tickSpacing).toString(), (maxTick - tickSpacing).toString(), MaxUint128.toString(), MaxUint128.toString());
						expect(amount0).toBe('316');
						expect(amount1).toBe('31');
					});

					it('writes an observation', async () => {
						let oracleData = await observationStore.getOrDefault(context, observationStore.getKey(pool.address, '0'));
						checkObservationEquals(oracleData, {
							tickCumulative: '0',
							blockTimestamp: TEST_POOL_START_TIME.toString(),
							initialized: true,
							secondsPerLiquidityCumulativeX128: '0',
						});
						advanceTime.bind(pool)('1');
						await mint(sender.toString('hex'), minTick, maxTick, 100);
						oracleData = await observationStore.getOrDefault(context, observationStore.getKey(pool.address, '0'));
						checkObservationEquals(oracleData, {
							tickCumulative: '-23028',
							blockTimestamp: (parseInt(TEST_POOL_START_TIME, 10) + 1).toString(),
							initialized: true,
							secondsPerLiquidityCumulativeX128: '107650226801941937191829992860413859',
						});
					});
				});

				describe('below current price', () => {
					it('transfers token1 only', async () => {
						await mint(sender.toString('hex'), -46080, -23040, 10000);
						expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '2162');
						expect((await tokenMethod.getAvailableBalance(context, pool.address, token0)).toString()).toBe('9996');
						expect((await tokenMethod.getAvailableBalance(context, pool.address, token1)).toString()).toBe((1000 + 2162).toString());
					});

					it('min tick with max leverage', async () => {
						await mint(sender.toString('hex'), minTick, minTick + tickSpacing, Uint.from(2).pow(102));
						expect((await tokenMethod.getAvailableBalance(context, pool.address, token0)).toString()).toBe('9996');
						expect((await tokenMethod.getAvailableBalance(context, pool.address, token1)).toString()).toBe((1000 + 828011520).toString());
					});

					it('works for min tick', async () => {
						await mint(sender.toString('hex'), minTick, -23040, 10000);
						expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '3161');
						expect((await tokenMethod.getAvailableBalance(context, pool.address, token0)).toString()).toBe('9996');
						expect((await tokenMethod.getAvailableBalance(context, pool.address, token1)).toString()).toBe((1000 + 3161).toString());
					});

					it('removing works', async () => {
						await mint(sender.toString('hex'), -46080, -46020, 10000);
						await pool.burn('-46080', '-46020', '10000');
						const [amount0, amount1] = await pool.collect(sender, '-46080', '-46020', MaxUint128.toString(), MaxUint128.toString());
						expect(amount0).toBe('0');
						expect(amount1).toBe('3');
					});

					it('does not write an observation', async () => {
						let oracleData = await observationStore.getOrDefault(context, observationStore.getKey(pool.address, '0'));
						checkObservationEquals(oracleData, {
							tickCumulative: '0',
							blockTimestamp: TEST_POOL_START_TIME.toString(),
							initialized: true,
							secondsPerLiquidityCumulativeX128: '0',
						});
						advanceTime.bind(pool)('1');
						await mint(sender.toString('hex'), -46080, -23040, 100);
						oracleData = await observationStore.getOrDefault(context, observationStore.getKey(pool.address, '0'));
						checkObservationEquals(oracleData, {
							tickCumulative: '0',
							blockTimestamp: TEST_POOL_START_TIME.toString(),
							initialized: true,
							secondsPerLiquidityCumulativeX128: '0',
						});
					});
				});
			});

			it('protocol fees accumulate as expected during swap', async () => {
				setFeeProtocol('6', '6');

				await mint(sender.toString('hex'), minTick + tickSpacing, maxTick - tickSpacing, expandTo18Decimals(1));
				await swapExact0For1(expandTo18Decimals(1).div(10), sender);
				await swapExact1For0(expandTo18Decimals(1).div(100), sender);

				eventResultContain(context.eventQueue, CollectProtocolEvent, module.name, {
					senderAddress: sender,
					recipientAddress: DEFAULT_TREASURY_ADDRESS,
					amount0: '50000000000000',
					amount1: '0',
				});
				eventResultContain(context.eventQueue, CollectProtocolEvent, module.name, {
					senderAddress: sender,
					recipientAddress: DEFAULT_TREASURY_ADDRESS,
					amount0: '0',
					amount1: '5000000000000',
				});
			});

			it('positions are protected before protocol fee is turned on', async () => {
				await mint(sender.toString('hex'), minTick + tickSpacing, maxTick - tickSpacing, expandTo18Decimals(1));
				await swapExact0For1(expandTo18Decimals(1).div(10), sender);
				await swapExact1For0(expandTo18Decimals(1).div(100), sender);

				eventResultHaveLength(context.eventQueue, CollectProtocolEvent, module.name, 0);
			});

			it('poke is not allowed on uninitialized position', async () => {
				await mint(other.toString('hex'), minTick + tickSpacing, maxTick - tickSpacing, expandTo18Decimals(1));
				await swapExact0For1(expandTo18Decimals(1).div(10), sender);
				await swapExact1For0(expandTo18Decimals(1).div(100), sender);

				// missing revert reason due to hardhat
				await expect((async () => pool.burn((minTick + tickSpacing).toString(), (maxTick - tickSpacing).toString(), '0'))()).rejects.toThrow();

				await mint(sender.toString('hex'), minTick + tickSpacing, maxTick - tickSpacing, 1);
				let { liquidity, feeGrowthInside0LastX128, feeGrowthInside1LastX128, tokensOwed1, tokensOwed0 } = await Position.get(
					positionInfoStore,
					context,
					pool.address,
					sender,
					(minTick + tickSpacing).toString(),
					(maxTick - tickSpacing).toString(),
				);
				expect(liquidity).toBe('1');
				expect(feeGrowthInside0LastX128).toBe('102084710076281216349243831104605583');
				expect(feeGrowthInside1LastX128).toBe('10208471007628121634924383110460558');
				expect(tokensOwed0).toBe('0');
				expect(tokensOwed1).toBe('0');

				await pool.burn((minTick + tickSpacing).toString(), (maxTick - tickSpacing).toString(), '1');
				({ liquidity, feeGrowthInside0LastX128, feeGrowthInside1LastX128, tokensOwed1, tokensOwed0 } = await Position.get(
					positionInfoStore,
					context,
					pool.address,
					sender,
					(minTick + tickSpacing).toString(),
					(maxTick - tickSpacing).toString(),
				));
				expect(liquidity).toBe('0');
				expect(feeGrowthInside0LastX128).toBe('102084710076281216349243831104605583');
				expect(feeGrowthInside1LastX128).toBe('10208471007628121634924383110460558');
				expect(tokensOwed0).toBe('3');
				expect(tokensOwed1).toBe('0');
			});
		});
	});

	describe('#burn', () => {
		beforeEach(async () => initializeAtZeroTick(pool));

		async function checkTickIsClear(tick: number) {
			const { liquidityGross, feeGrowthOutside0X128, feeGrowthOutside1X128, liquidityNet } = await pool.getTick(tick.toString());
			expect(liquidityGross).toBe('0');
			expect(feeGrowthOutside0X128).toBe('0');
			expect(feeGrowthOutside1X128).toBe('0');
			expect(liquidityNet).toBe('0');
		}

		async function checkTickIsNotClear(tick: number) {
			const { liquidityGross } = await pool.getTick(tick.toString());
			expect(liquidityGross).not.toBe('0');
		}

		it('does not clear the position fee growth snapshot if no more liquidity', async () => {
			// some activity that would make the ticks non-zero
			advanceTime.bind(pool)('10');
			await mint(other.toString('hex'), minTick, maxTick, expandTo18Decimals(1));
			await swapExact0For1(expandTo18Decimals(1), sender);
			await swapExact1For0(expandTo18Decimals(1), sender);

			pool['mutableContext'] = otherContext;
			await pool.burn(minTick.toString(), maxTick.toString(), expandTo18Decimals(1).toString());
			const { liquidity, tokensOwed0, tokensOwed1, feeGrowthInside0LastX128, feeGrowthInside1LastX128 } = await Position.get(
				positionInfoStore,
				context,
				pool.address,
				other,
				minTick.toString(),
				maxTick.toString(),
			);
			pool['mutableContext'] = senderContext;

			expect(liquidity).toBe('0');
			expect(tokensOwed0).not.toBe('0');
			expect(tokensOwed1).not.toBe('0');
			expect(feeGrowthInside0LastX128).toBe('340282366920938463463374607431768211');
			expect(feeGrowthInside1LastX128).toBe('340282366920938576890830247744589365');
		});

		it('clears the tick if its the last position using it', async () => {
			const tickLower = minTick + tickSpacing;
			const tickUpper = maxTick - tickSpacing;
			// some activity that would make the ticks non-zero
			advanceTime.bind(pool)('10');
			await mint(sender.toString('hex'), tickLower, tickUpper, 1);
			await swapExact0For1(expandTo18Decimals(1), sender);
			await pool.burn(tickLower.toString(), tickUpper.toString(), '1');
			await checkTickIsClear(tickLower);
			await checkTickIsClear(tickUpper);
		});

		it('clears only the lower tick if upper is still used', async () => {
			const tickLower = minTick + tickSpacing;
			const tickUpper = maxTick - tickSpacing;
			// some activity that would make the ticks non-zero
			advanceTime.bind(pool)('10');
			await mint(sender.toString('hex'), tickLower, tickUpper, 1);
			await mint(sender.toString('hex'), tickLower + tickSpacing, tickUpper, 1);
			await swapExact0For1(expandTo18Decimals(1), sender);
			await pool.burn(tickLower.toString(), tickUpper.toString(), '1');
			await checkTickIsClear(tickLower);
			await checkTickIsNotClear(tickUpper);
		});

		it('clears only the upper tick if lower is still used', async () => {
			const tickLower = minTick + tickSpacing;
			const tickUpper = maxTick - tickSpacing;
			// some activity that would make the ticks non-zero
			advanceTime.bind(pool)('10');
			await mint(sender.toString('hex'), tickLower, tickUpper, 1);
			await mint(sender.toString('hex'), tickLower, tickUpper - tickSpacing, 1);
			await swapExact0For1(expandTo18Decimals(1), sender);
			await pool.burn(tickLower.toString(), tickUpper.toString(), '1');
			await checkTickIsNotClear(tickLower);
			await checkTickIsClear(tickUpper);
		});
	});

	// the combined amount of liquidity that the pool is initialized with (including the 1 minimum liquidity that is burned)
	const initializeLiquidityAmount = expandTo18Decimals(2);
	async function initializeAtZeroTick(_pool: DEXPool): Promise<void> {
		await _pool.initialize(encodePriceSqrt(1, 1).toString());
		const { tickSpacing: _tickSpacing } = _pool;
		const [min, max] = [getMinTick(_tickSpacing), getMaxTick(_tickSpacing)];
		await mint(sender.toString('hex'), min, max, initializeLiquidityAmount);
	}

	describe('#observe', () => {
		beforeEach(async () => initializeAtZeroTick(pool));

		// zero tick
		it('current tick accumulator increases by tick over time', async () => {
			let { tickCumulatives } = await pool.observe(['0']);
			let tickCumulative = tickCumulatives[0];
			expect(tickCumulative).toBe('0');
			advanceTime.bind(pool)('10');
			({ tickCumulatives } = await pool.observe(['0']));
			[tickCumulative] = tickCumulatives;
			expect(tickCumulative).toBe('0');
		});

		it('current tick accumulator after single swap', async () => {
			// moves to tick -1
			await swapExact0For1(1000, sender);
			advanceTime.bind(pool)('4');
			const { tickCumulatives } = await pool.observe(['0']);
			const tickCumulative = tickCumulatives[0];
			expect(tickCumulative).toBe('-4');
		});

		it('current tick accumulator after two swaps', async () => {
			await swapExact0For1(expandTo18Decimals(1).div(2), sender);
			expect(pool.slot0.tick).toBe('-4452');
			advanceTime.bind(pool)('4');
			await swapExact1For0(expandTo18Decimals(1).div(4), sender);
			expect(pool.slot0.tick).toBe('-1558');
			advanceTime.bind(pool)('6');
			const { tickCumulatives } = await pool.observe(['0']);
			const tickCumulative = tickCumulatives[0];
			// -4452*4 + -1558*6
			expect(tickCumulative).toBe('-27156');
		});
	});

	describe('miscellaneous mint tests', () => {
		beforeEach(async () => {
			pool = await createPool(FeeAmount.LOW, TICK_SPACINGS[FeeAmount.LOW]);
			await initializeAtZeroTick(pool);
		});

		it('mint to the right of the current price', async () => {
			const liquidityDelta = 1000;
			const lowerTick = tickSpacing;
			const upperTick = tickSpacing * 2;

			const liquidityBefore = Uint128.from(pool.liquidity);

			const b0 = (await tokenMethod.getAvailableBalance(context, pool.address, token0)).toString();
			const b1 = (await tokenMethod.getAvailableBalance(context, pool.address, token1)).toString();

			await mint(sender.toString('hex'), lowerTick, upperTick, liquidityDelta);

			const liquidityAfter = Uint128.from(pool.liquidity);
			expect(liquidityAfter.gte(liquidityBefore)).toBe(true);

			expect(
				Uint256.from((await tokenMethod.getAvailableBalance(context, pool.address, token0)).toString())
					.sub(b0)
					.toString(),
			).toBe('1');
			expect(
				Uint256.from((await tokenMethod.getAvailableBalance(context, pool.address, token1)).toString())
					.sub(b1)
					.toString(),
			).toBe('0');
		});

		it('mint to the left of the current price', async () => {
			const liquidityDelta = 1000;
			const lowerTick = -tickSpacing * 2;
			const upperTick = -tickSpacing;

			const liquidityBefore = Uint128.from(pool.liquidity);

			const b0 = (await tokenMethod.getAvailableBalance(context, pool.address, token0)).toString();
			const b1 = (await tokenMethod.getAvailableBalance(context, pool.address, token1)).toString();

			await mint(sender.toString('hex'), lowerTick, upperTick, liquidityDelta);

			const liquidityAfter = Uint128.from(pool.liquidity);
			expect(liquidityAfter.gte(liquidityBefore)).toBe(true);

			expect(
				Uint256.from((await tokenMethod.getAvailableBalance(context, pool.address, token0)).toString())
					.sub(b0)
					.toString(),
			).toBe('0');
			expect(
				Uint256.from((await tokenMethod.getAvailableBalance(context, pool.address, token1)).toString())
					.sub(b1)
					.toString(),
			).toBe('1');
		});

		it('mint within the current price', async () => {
			const liquidityDelta = 1000;
			const lowerTick = -tickSpacing;
			const upperTick = tickSpacing;

			const liquidityBefore = Uint128.from(pool.liquidity);

			const b0 = (await tokenMethod.getAvailableBalance(context, pool.address, token0)).toString();
			const b1 = (await tokenMethod.getAvailableBalance(context, pool.address, token1)).toString();

			await mint(sender.toString('hex'), lowerTick, upperTick, liquidityDelta);

			const liquidityAfter = Uint128.from(pool.liquidity);
			expect(liquidityAfter.gte(liquidityBefore)).toBe(true);

			expect(
				Uint256.from((await tokenMethod.getAvailableBalance(context, pool.address, token0)).toString())
					.sub(b0)
					.toString(),
			).toBe('1');
			expect(
				Uint256.from((await tokenMethod.getAvailableBalance(context, pool.address, token1)).toString())
					.sub(b1)
					.toString(),
			).toBe('1');
		});

		it('cannot remove more than the entire position', async () => {
			const lowerTick = -tickSpacing;
			const upperTick = tickSpacing;
			await mint(sender.toString('hex'), lowerTick, upperTick, expandTo18Decimals(1000));
			// should be 'LS', hardhat is bugged
			await expect((async () => pool.burn(lowerTick.toString(), upperTick.toString(), expandTo18Decimals(1001).toString()))()).rejects.toThrow();
		});

		it('collect fees within the current price after swap', async () => {
			const liquidityDelta = expandTo18Decimals(100);
			const lowerTick = -tickSpacing * 100;
			const upperTick = tickSpacing * 100;

			await mint(sender.toString('hex'), lowerTick, upperTick, liquidityDelta);

			const liquidityBefore = Uint128.from(pool.liquidity);

			const amount0In = expandTo18Decimals(1);
			await swapExact0For1(amount0In, sender);

			const liquidityAfter = Uint128.from(pool.liquidity);
			expect(liquidityAfter.gte(liquidityBefore)).toBe(true);

			const token0BalanceBeforePool = (await tokenMethod.getAvailableBalance(context, pool.address, token0)).toString();
			const token1BalanceBeforePool = (await tokenMethod.getAvailableBalance(context, pool.address, token1)).toString();
			const token0BalanceBeforeWallet = (await tokenMethod.getAvailableBalance(context, sender, token0)).toString();
			const token1BalanceBeforeWallet = (await tokenMethod.getAvailableBalance(context, sender, token1)).toString();

			await pool.burn(lowerTick.toString(), upperTick.toString(), '0');
			await pool.collect(sender, lowerTick.toString(), upperTick.toString(), MaxUint128.toString(), MaxUint128.toString());

			await pool.burn(lowerTick.toString(), upperTick.toString(), '0');
			const [fees0, fees1] = await pool.collect(sender, lowerTick.toString(), upperTick.toString(), MaxUint128.toString(), MaxUint128.toString());
			expect(fees0).toBe('0');
			expect(fees1).toBe('0');

			const token0BalanceAfterWallet = (await tokenMethod.getAvailableBalance(context, sender, token0)).toString();
			const token1BalanceAfterWallet = (await tokenMethod.getAvailableBalance(context, sender, token1)).toString();
			const token0BalanceAfterPool = (await tokenMethod.getAvailableBalance(context, pool.address, token0)).toString();
			const token1BalanceAfterPool = (await tokenMethod.getAvailableBalance(context, pool.address, token1)).toString();

			expect(Uint.from(token0BalanceAfterWallet).gt(token0BalanceBeforeWallet)).toBe(true);
			expect(Uint.from(token1BalanceAfterWallet).eq(token1BalanceBeforeWallet)).toBe(true);

			expect(Uint.from(token0BalanceAfterPool).lt(token0BalanceBeforePool)).toBe(true);
			expect(Uint.from(token1BalanceAfterPool).eq(token1BalanceBeforePool)).toBe(true);
		});
	});

	describe('post-initialize at medium fee', () => {
		describe('k (implicit)', () => {
			it('returns 0 before initialization', () => {
				expect(pool.liquidity).toBe('0');
			});
			describe('post initialized', () => {
				beforeEach(async () => initializeAtZeroTick(pool));

				it('returns initial liquidity', () => {
					expect(pool.liquidity).toBe(expandTo18Decimals(2).toString());
				});
				it('returns in supply in range', async () => {
					await mint(sender.toString('hex'), -tickSpacing, tickSpacing, expandTo18Decimals(3));
					expect(pool.liquidity).toBe(expandTo18Decimals(5).toString());
				});
				it('excludes supply at tick above current tick', async () => {
					await mint(sender.toString('hex'), tickSpacing, tickSpacing * 2, expandTo18Decimals(3));
					expect(pool.liquidity).toBe(expandTo18Decimals(2).toString());
				});
				it('excludes supply at tick below current tick', async () => {
					await mint(sender.toString('hex'), -tickSpacing * 2, -tickSpacing, expandTo18Decimals(3));
					expect(pool.liquidity).toBe(expandTo18Decimals(2).toString());
				});
				it('updates correctly when exiting range', async () => {
					const kBefore = pool.liquidity;
					expect(kBefore).toBe(expandTo18Decimals(2).toString());

					// add liquidity at and above current tick
					const liquidityDelta = expandTo18Decimals(1);
					const lowerTick = 0;
					const upperTick = tickSpacing;
					await mint(sender.toString('hex'), lowerTick, upperTick, liquidityDelta);

					// ensure virtual supply has increased appropriately
					const kAfter = pool.liquidity;
					expect(kAfter).toBe(expandTo18Decimals(3).toString());

					// swap toward the left (just enough for the tick transition function to trigger)
					await swapExact0For1(1, sender);
					const { tick } = pool.slot0;
					expect(tick).toBe('-1');

					const kAfterSwap = pool.liquidity;
					expect(kAfterSwap).toBe(expandTo18Decimals(2).toString());
				});
				it('updates correctly when entering range', async () => {
					const kBefore = pool.liquidity;
					expect(kBefore).toBe(expandTo18Decimals(2).toString());

					// add liquidity below the current tick
					const liquidityDelta = expandTo18Decimals(1);
					const lowerTick = -tickSpacing;
					const upperTick = 0;
					await mint(sender.toString('hex'), lowerTick, upperTick, liquidityDelta);

					// ensure virtual supply hasn't changed
					const kAfter = pool.liquidity;
					expect(kAfter).toBe(kBefore);

					// swap toward the left (just enough for the tick transition function to trigger)
					await swapExact0For1(1, sender);
					const { tick } = pool.slot0;
					expect(tick).toBe('-1');

					const kAfterSwap = pool.liquidity;
					expect(kAfterSwap).toBe(expandTo18Decimals(3).toString());
				});
			});
		});
	});

	describe('limit orders', () => {
		beforeEach(async () => initializeAtZeroTick(pool));

		it('limit selling 0 for 1 at tick 0 thru 1', async () => {
			await mint(sender.toString('hex'), 0, 120, expandTo18Decimals(1));
			expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '5981737760509663');
			// somebody takes the limit order
			await swapExact1For0(expandTo18Decimals(2), other);
			await pool.burn('0', '120', expandTo18Decimals(1).toString());

			eventResultContain(context.eventQueue, BurnEvent, module.name, {
				senderAddress: sender,
				tickLower: '0',
				tickUpper: '120',
				lowerLiquidityNet: '0',
				lowerLiquidityNetBefore: '1000000000000000000',
				upperLiquidityNet: '0',
				upperLiquidityNetBefore: '-1000000000000000000',
			});

			await pool.collect(sender, '0', '120', MaxUint128.toString(), MaxUint128.toString());
			expect(mock_token_transfer).toHaveBeenCalledWith(pool.address.toString('hex'), sender.toString('hex'), Uint.from('6017734268818165').add('18107525382602').toString()); // roughly 0.3% despite other liquidity
			expect(Int24.from(pool.slot0.tick).gte(120)).toBe(true);
		});
		it('limit selling 1 for 0 at tick 0 thru -1', async () => {
			await mint(sender.toString('hex'), -120, 0, expandTo18Decimals(1));
			expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '5981737760509663');
			// somebody takes the limit order
			await swapExact0For1(expandTo18Decimals(2), other);
			await pool.burn('-120', '0', expandTo18Decimals(1).toString());
			eventResultContain(context.eventQueue, BurnEvent, module.name, {
				senderAddress: sender,
				tickLower: '-120',
				tickUpper: '0',
				lowerLiquidityNet: '0',
				lowerLiquidityNetBefore: '1000000000000000000',
				upperLiquidityNet: '0',
				upperLiquidityNetBefore: '-1000000000000000000',
			});
			await pool.collect(sender, '-120', '0', MaxUint128.toString(), MaxUint128.toString());
			expect(mock_token_transfer).toHaveBeenCalledWith(pool.address.toString('hex'), sender.toString('hex'), Uint.from('6017734268818165').add('18107525382602').toString()); // roughly 0.3% despite other liquidity
			expect(Int24.from(pool.slot0.tick).lt(-120)).toBe(true);
		});

		describe('fee is on', () => {
			beforeEach(() => {
				setFeeProtocol('6', '6');
			});
			it('limit selling 0 for 1 at tick 0 thru 1', async () => {
				await mint(sender.toString('hex'), 0, 120, expandTo18Decimals(1));
				expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '5981737760509663');
				// somebody takes the limit order
				await swapExact1For0(expandTo18Decimals(2), other);
				await pool.burn('0', '120', expandTo18Decimals(1).toString());
				eventResultContain(context.eventQueue, BurnEvent, module.name, {
					senderAddress: sender,
					tickLower: '0',
					tickUpper: '120',
					lowerLiquidityNet: '0',
					lowerLiquidityNetBefore: '1000000000000000000',
					upperLiquidityNet: '0',
					upperLiquidityNetBefore: '-1000000000000000000',
				});
				await pool.collect(sender, '0', '120', MaxUint128.toString(), MaxUint128.toString());
				expect(mock_token_transfer).toHaveBeenCalledWith(pool.address.toString('hex'), sender.toString('hex'), Uint.from('6017734268818165').add('15089604485501').toString()); // roughly 0.25% despite other liquidity
				expect(Int24.from(pool.slot0.tick).gte(120)).toBe(true);
			});
			it('limit selling 1 for 0 at tick 0 thru -1', async () => {
				await mint(sender.toString('hex'), -120, 0, expandTo18Decimals(1));
				expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '5981737760509663');
				// somebody takes the limit order
				await swapExact0For1(expandTo18Decimals(2), other);
				await pool.burn('-120', '0', expandTo18Decimals(1).toString());
				eventResultContain(context.eventQueue, BurnEvent, module.name, {
					senderAddress: sender,
					tickLower: '-120',
					tickUpper: '0',
					lowerLiquidityNet: '0',
					lowerLiquidityNetBefore: '1000000000000000000',
					upperLiquidityNet: '0',
					upperLiquidityNetBefore: '-1000000000000000000',
				});
				await pool.collect(sender, '-120', '0', MaxUint128.toString(), MaxUint128.toString());
				expect(mock_token_transfer).toHaveBeenCalledWith(pool.address.toString('hex'), sender.toString('hex'), Uint.from('6017734268818165').add('15089604485501').toString()); // roughly 0.25% despite other liquidity
				expect(Int24.from(pool.slot0.tick).lt(-120)).toBe(true);
			});
		});
	});

	describe('#collect', () => {
		beforeEach(async () => {
			pool = await createPool(FeeAmount.LOW, TICK_SPACINGS[FeeAmount.LOW]);
			await pool.initialize(encodePriceSqrt(1, 1).toString());
		});

		it('works with multiple LPs', async () => {
			await mint(sender.toString('hex'), minTick, maxTick, expandTo18Decimals(1));
			await mint(sender.toString('hex'), minTick + tickSpacing, maxTick - tickSpacing, expandTo18Decimals(2));

			await swapExact0For1(expandTo18Decimals(1), sender);

			// poke positions
			await pool.burn(minTick.toString(), maxTick.toString(), '0');
			await pool.burn((minTick + tickSpacing).toString(), (maxTick - tickSpacing).toString(), '0');

			const { tokensOwed0: tokensOwed0Position0 } = await Position.get(positionInfoStore, context, pool.address, sender, minTick.toString(), maxTick.toString());
			const { tokensOwed0: tokensOwed0Position1 } = await Position.get(positionInfoStore, context, pool.address, sender, (minTick + tickSpacing).toString(), (maxTick - tickSpacing).toString());

			expect(tokensOwed0Position0).toBe('166666666666667');
			expect(tokensOwed0Position1).toBe('333333333333334');
		});

		describe('works across large increases', () => {
			beforeEach(async () => {
				await mint(sender.toString('hex'), minTick, maxTick, expandTo18Decimals(1));
			});

			// type(uint128).max * 2**128 / 1e18
			// https://www.wolframalpha.com/input/?i=%282**128+-+1%29+*+2**128+%2F+1e18
			const magicNumber = Uint.from('115792089237316195423570985008687907852929702298719625575994');

			it('works just before the cap binds', async () => {
				setFeeGrowthGlobal0X128.bind(pool)(magicNumber.toString());
				await pool.burn(minTick.toString(), maxTick.toString(), '0');

				const { tokensOwed0, tokensOwed1 } = await Position.get(positionInfoStore, context, pool.address, sender, minTick.toString(), maxTick.toString());

				expect(tokensOwed0).toBe(MaxUint128.sub(1).toString());
				expect(tokensOwed1).toBe('0');
			});

			it('works just after the cap binds', async () => {
				setFeeGrowthGlobal0X128.bind(pool)(magicNumber.add(1).toString());
				await pool.burn(minTick.toString(), maxTick.toString(), '0');

				const { tokensOwed0, tokensOwed1 } = await Position.get(positionInfoStore, context, pool.address, sender, minTick.toString(), maxTick.toString());

				expect(tokensOwed0).toBe(MaxUint128.toString());
				expect(tokensOwed1).toBe('0');
			});

			it('works well after the cap binds', async () => {
				setFeeGrowthGlobal0X128.bind(pool)(Uint256.MAX);
				await pool.burn(minTick.toString(), maxTick.toString(), '0');

				const { tokensOwed0, tokensOwed1 } = await Position.get(positionInfoStore, context, pool.address, sender, minTick.toString(), maxTick.toString());

				expect(tokensOwed0).toBe(MaxUint128.toString());
				expect(tokensOwed1).toBe('0');
			});
		});

		describe('works across overflow boundaries', () => {
			beforeEach(async () => {
				setFeeGrowthGlobal0X128.bind(pool)(Uint256.MAX);
				setFeeGrowthGlobal1X128.bind(pool)(Uint256.MAX);
				await mint(sender.toString('hex'), minTick, maxTick, expandTo18Decimals(10));
			});

			it('token0', async () => {
				await swapExact0For1(expandTo18Decimals(1), sender);
				await pool.burn(minTick.toString(), maxTick.toString(), '0');
				const [amount0, amount1] = await pool.collect(sender, minTick.toString(), maxTick.toString(), MaxUint128.toString(), MaxUint128.toString());
				expect(amount0).toBe('499999999999999');
				expect(amount1).toBe('0');
			});
			it('token1', async () => {
				await swapExact1For0(expandTo18Decimals(1), sender);
				await pool.burn(minTick.toString(), maxTick.toString(), '0');
				const [amount0, amount1] = await pool.collect(sender, minTick.toString(), maxTick.toString(), MaxUint128.toString(), MaxUint128.toString());
				expect(amount0).toBe('0');
				expect(amount1).toBe('499999999999999');
			});
			it('token0 and token1', async () => {
				await swapExact0For1(expandTo18Decimals(1), sender);
				await swapExact1For0(expandTo18Decimals(1), sender);
				await pool.burn(minTick.toString(), maxTick.toString(), '0');
				const [amount0, amount1] = await pool.collect(sender, minTick.toString(), maxTick.toString(), MaxUint128.toString(), MaxUint128.toString());
				expect(amount0).toBe('499999999999999');
				expect(amount1).toBe('500000000000000');
			});
		});
	});

	describe('#feeProtocol', () => {
		const liquidityAmount = expandTo18Decimals(1000);

		beforeEach(async () => {
			pool = await createPool(FeeAmount.LOW, TICK_SPACINGS[FeeAmount.LOW]);
			await pool.initialize(encodePriceSqrt(1, 1).toString());
			await mint(sender.toString('hex'), minTick, maxTick, liquidityAmount);
		});

		it('cannot be configured out of bounds', async () => {
			await expect((async () => setFeeProtocol('3', '3'))()).rejects.toThrow();
			await expect((async () => setFeeProtocol('11', '11'))()).rejects.toThrow();
		});

		async function swapAndGetFeesOwed({ amount, zeroForOne, poke }: { amount: BigIntAble; zeroForOne: boolean; poke: boolean }) {
			await (zeroForOne ? swapExact0For1(amount, sender) : swapExact1For0(amount, sender));

			if (poke) await pool.burn(minTick.toString(), maxTick.toString(), '0');

			const [fees0, fees1] = await pool.createEmulator().collect(sender, minTick.toString(), maxTick.toString(), MaxUint128.toString(), MaxUint128.toString());

			expect(Uint128.from(fees0).gte(0)).toBe(true);
			expect(Uint128.from(fees1).gte(0)).toBe(true);

			return { token0Fees: fees0, token1Fees: fees1 };
		}

		it('position owner gets full fees when protocol fee is off', async () => {
			const { token0Fees, token1Fees } = await swapAndGetFeesOwed({
				amount: expandTo18Decimals(1),
				zeroForOne: true,
				poke: true,
			});

			// 6 bips * 1e18
			expect(token0Fees).toBe('499999999999999');
			expect(token1Fees).toBe('0');
		});

		it('swap fees accumulate as expected (0 for 1)', async () => {
			let token0Fees;
			let token1Fees;
			({ token0Fees, token1Fees } = await swapAndGetFeesOwed({
				amount: expandTo18Decimals(1),
				zeroForOne: true,
				poke: true,
			}));
			expect(token0Fees).toBe('499999999999999');
			expect(token1Fees).toBe('0');
			({ token0Fees, token1Fees } = await swapAndGetFeesOwed({
				amount: expandTo18Decimals(1),
				zeroForOne: true,
				poke: true,
			}));
			expect(token0Fees).toBe('999999999999998');
			expect(token1Fees).toBe('0');
			({ token0Fees, token1Fees } = await swapAndGetFeesOwed({
				amount: expandTo18Decimals(1),
				zeroForOne: true,
				poke: true,
			}));
			expect(token0Fees).toBe('1499999999999997');
			expect(token1Fees).toBe('0');
		});

		it('swap fees accumulate as expected (1 for 0)', async () => {
			let token0Fees;
			let token1Fees;
			({ token0Fees, token1Fees } = await swapAndGetFeesOwed({
				amount: expandTo18Decimals(1),
				zeroForOne: false,
				poke: true,
			}));
			expect(token0Fees).toBe('0');
			expect(token1Fees).toBe('499999999999999');
			({ token0Fees, token1Fees } = await swapAndGetFeesOwed({
				amount: expandTo18Decimals(1),
				zeroForOne: false,
				poke: true,
			}));
			expect(token0Fees).toBe('0');
			expect(token1Fees).toBe('999999999999998');
			({ token0Fees, token1Fees } = await swapAndGetFeesOwed({
				amount: expandTo18Decimals(1),
				zeroForOne: false,
				poke: true,
			}));
			expect(token0Fees).toBe('0');
			expect(token1Fees).toBe('1499999999999997');
		});

		it('position owner gets partial fees when protocol fee is on', async () => {
			setFeeProtocol('6', '6');

			const { token0Fees, token1Fees } = await swapAndGetFeesOwed({
				amount: expandTo18Decimals(1),
				zeroForOne: true,
				poke: true,
			});

			expect(token0Fees).toBe('416666666666666');
			expect(token1Fees).toBe('0');
		});

		describe('#collectProtocol', () => {
			it('can collect fees', async () => {
				setFeeProtocol('6', '6');

				await swapAndGetFeesOwed({
					amount: expandTo18Decimals(1),
					zeroForOne: true,
					poke: true,
				});

				expect(mock_token_transfer).toHaveBeenCalledWith(pool.address.toString('hex'), DEFAULT_TREASURY_ADDRESS.toString('hex'), '83333333333333');
			});

			it('fees collected can differ between token0 and token1', async () => {
				setFeeProtocol('8', '5');

				await swapAndGetFeesOwed({
					amount: expandTo18Decimals(1),
					zeroForOne: true,
					poke: false,
				});
				await swapAndGetFeesOwed({
					amount: expandTo18Decimals(1),
					zeroForOne: false,
					poke: false,
				});

				expect(mock_token_transfer).toHaveBeenCalledWith(pool.address.toString('hex'), DEFAULT_TREASURY_ADDRESS.toString('hex'), '62500000000000');

				// less token1 fees because it's 1/8th the swap fees
				expect(mock_token_transfer).toHaveBeenCalledWith(pool.address.toString('hex'), DEFAULT_TREASURY_ADDRESS.toString('hex'), '99999999999999');
			});
		});

		it('fees collected by lp after two swaps should be double one swap', async () => {
			await swapAndGetFeesOwed({
				amount: expandTo18Decimals(1),
				zeroForOne: true,
				poke: true,
			});
			const { token0Fees, token1Fees } = await swapAndGetFeesOwed({
				amount: expandTo18Decimals(1),
				zeroForOne: true,
				poke: true,
			});

			// 6 bips * 2e18
			expect(token0Fees).toBe('999999999999998');
			expect(token1Fees).toBe('0');
		});

		it('fees collected after two swaps with fee turned on in middle are fees from last swap (not confiscatory)', async () => {
			await swapAndGetFeesOwed({
				amount: expandTo18Decimals(1),
				zeroForOne: true,
				poke: false,
			});

			setFeeProtocol('6', '6');

			const { token0Fees, token1Fees } = await swapAndGetFeesOwed({
				amount: expandTo18Decimals(1),
				zeroForOne: true,
				poke: true,
			});

			expect(token0Fees).toBe('916666666666666');
			expect(token1Fees).toBe('0');
		});

		it('fees collected by lp after two swaps with intermediate withdrawal', async () => {
			setFeeProtocol('6', '6');

			const { token0Fees, token1Fees } = await swapAndGetFeesOwed({
				amount: expandTo18Decimals(1),
				zeroForOne: true,
				poke: true,
			});

			expect(token0Fees).toBe('416666666666666');
			expect(token1Fees).toBe('0');

			// collect the fees
			await pool.collect(sender, minTick.toString(), maxTick.toString(), MaxUint128.toString(), MaxUint128.toString());

			const { token0Fees: token0FeesNext, token1Fees: token1FeesNext } = await swapAndGetFeesOwed({
				amount: expandTo18Decimals(1),
				zeroForOne: true,
				poke: false,
			});

			expect(token0FeesNext).toBe('0');
			expect(token1FeesNext).toBe('0');

			eventResultHaveLength(context.eventQueue, CollectProtocolEvent, module.name, 2);
			eventResultContain(context.eventQueue, CollectProtocolEvent, module.name, {
				senderAddress: sender,
				recipientAddress: DEFAULT_TREASURY_ADDRESS,
				amount0: '83333333333333',
				amount1: '0',
			});

			await pool.burn(minTick.toString(), maxTick.toString(), '0'); // poke to update fees

			await pool.collect(sender, minTick.toString(), maxTick.toString(), MaxUint128.toString(), MaxUint128.toString());
			expect(mock_token_transfer).toHaveBeenCalledWith(pool.address.toString('hex'), sender.toString('hex'), '416666666666666');

			eventResultHaveLength(context.eventQueue, CollectProtocolEvent, module.name, 2);
			eventResultContain(context.eventQueue, CollectProtocolEvent, module.name, {
				senderAddress: sender,
				recipientAddress: DEFAULT_TREASURY_ADDRESS,
				amount0: '83333333333333',
				amount1: '0',
			});
		});
	});

	describe('#tickSpacing', () => {
		describe('tickSpacing = 12', () => {
			beforeEach(async () => {
				pool = await createPool(FeeAmount.MEDIUM, '12');
			});
			describe('post initialize', () => {
				beforeEach(async () => {
					await pool.initialize(encodePriceSqrt(1, 1).toString());
				});
				it('mint can only be called for multiples of 12', async () => {
					await expect((async () => mint(sender.toString('hex'), -6, 0, 1))()).rejects.toThrow();
					await expect((async () => mint(sender.toString('hex'), 0, 6, 1))()).rejects.toThrow();
				});
				it('mint can be called with multiples of 12', async () => {
					await mint(sender.toString('hex'), 12, 24, 1);
					await mint(sender.toString('hex'), -144, -120, 1);
				});
				it('swapping across gaps works in 1 for 0 direction', async () => {
					const liquidityAmount = expandTo18Decimals(1).div(4);
					await mint(sender.toString('hex'), 120000, 121200, liquidityAmount);
					await swapExact1For0(expandTo18Decimals(1), sender);
					await pool.burn('120000', '121200', liquidityAmount.toString());
					eventResultContain(context.eventQueue, BurnEvent, module.name, {
						senderAddress: sender,
						tickLower: '120000',
						tickUpper: '121200',
						lowerLiquidityNet: '0',
						lowerLiquidityNetBefore: '250000000000000000',
						upperLiquidityNet: '0',
						upperLiquidityNetBefore: '-250000000000000000',
					});
					expect(pool.slot0.tick).toBe('120196');
				});
				it('swapping across gaps works in 0 for 1 direction', async () => {
					const liquidityAmount = expandTo18Decimals(1).div(4);
					await mint(sender.toString('hex'), -121200, -120000, liquidityAmount);
					await swapExact0For1(expandTo18Decimals(1), sender);
					await pool.burn('-121200', '-120000', liquidityAmount.toString());
					eventResultContain(context.eventQueue, BurnEvent, module.name, {
						senderAddress: sender,
						tickLower: '-121200',
						tickUpper: '-120000',
						lowerLiquidityNet: '0',
						lowerLiquidityNetBefore: '250000000000000000',
						upperLiquidityNet: '0',
						upperLiquidityNetBefore: '-250000000000000000',
					});
					expect(pool.slot0.tick).toBe('-120197');
				});
			});
		});
	});

	// https://github.com/Uniswap/uniswap-v3-core/issues/214
	it('tick transition cannot run twice if zero for one swap ends at fractional price just below tick', async () => {
		pool = await createPool(FeeAmount.MEDIUM, '1');
		const p0 = Uint.from(sqrtTickMath.getSqrtRatioAtTick('-24081')).add(1);
		// initialize at a price of ~0.3 token1/token0
		// meaning if you swap in 2 token0, you should end up getting 0 token1
		await pool.initialize(p0.toString());
		expect(pool.liquidity).toBe('0');
		expect(pool.slot0.tick).toBe('-24081');

		// add a bunch of liquidity around current price
		const liquidity = expandTo18Decimals(1000);
		await mint(sender.toString('hex'), -24082, -24080, liquidity);
		expect(pool.liquidity).toBe(liquidity.toString());

		await mint(sender.toString('hex'), -24082, -24081, liquidity);
		expect(pool.liquidity).toBe(liquidity.toString());

		// check the math works out to moving the price down 1, sending no amount out, and having some amount remaining
		{
			const [sqrtQ, amountIn, amountOut, feeAmount] = swapMath.computeSwapStep(p0.toString(), p0.sub(1).toString(), liquidity.toString(), '3', FeeAmount.MEDIUM);
			expect(sqrtQ).toBe(p0.sub(1).toString());
			expect(feeAmount).toBe('1');
			expect(amountIn).toBe('1');
			expect(amountOut).toBe('0');
		}

		// swap 2 amount in, should get 0 amount out
		await swapExact0For1(3, sender);
		expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '3');

		const { tick, sqrtPriceX96 } = pool.slot0;

		expect(tick).toBe('-24082');
		expect(sqrtPriceX96).toBe(p0.sub(1).toString());
		expect(pool.liquidity).toBe(liquidity.mul(2).toString());
	});

	describe('#flash', () => {
		it('fails if not initialized', async () => {
			await expect((async () => flash(100, 200, other))()).rejects.toThrow();
			await expect((async () => flash(100, 0, other))()).rejects.toThrow();
			await expect((async () => flash(0, 200, other))()).rejects.toThrow();
		});
		it('fails if no liquidity', async () => {
			await pool.initialize(encodePriceSqrt(1, 1).toString());
			await expect((async () => flash(100, 200, other))()).rejects.toThrow('L');
			await expect((async () => flash(100, 0, other))()).rejects.toThrow('L');
			await expect((async () => flash(0, 200, other))()).rejects.toThrow('L');
		});
		describe('after liquidity added', () => {
			let balance0: Uint;
			let balance1: Uint;
			beforeEach(async () => {
				await initializeAtZeroTick(pool);
				[balance0, balance1] = await Promise.all([
					Uint.from((await tokenMethod.getAvailableBalance(context, pool.address, token0)).toString()),
					Uint.from((await tokenMethod.getAvailableBalance(context, pool.address, token1)).toString()),
				]);
			});

			describe('fee off', () => {
				it('emits an event', async () => {
					await flash(1001, 2001, other);
					eventResultContain(context.eventQueue, FlashEvent, module.name, {
						senderAddress: sender,
						recipientAddress: other,
						amount0: '1001',
						amount1: '2001',
						paid0: '4',
						paid1: '7',
					});
				});

				it('transfers the amount0 to the recipient', async () => {
					await flash(100, 200, other);
					expect(mock_token_transfer).toHaveBeenCalledWith(pool.address.toString('hex'), other.toString('hex'), '100');
				});
				it('transfers the amount1 to the recipient', async () => {
					await flash(100, 200, other);
					expect(mock_token_transfer).toHaveBeenCalledWith(pool.address.toString('hex'), other.toString('hex'), '200');
				});
				it('can flash only token0', async () => {
					await flash(101, 0, other);
					expect(mock_token_transfer).toHaveBeenCalledWith(pool.address.toString('hex'), other.toString('hex'), '101');
				});
				it('can flash only token1', async () => {
					await flash(0, 102, other);
					expect(mock_token_transfer).toHaveBeenCalledWith(pool.address.toString('hex'), other.toString('hex'), '102');
				});
				it('can flash entire token balance', async () => {
					await flash(balance0, balance1, other);
					expect(mock_token_transfer).toHaveBeenCalledWith(pool.address.toString('hex'), other.toString('hex'), balance0.toString());
					expect(mock_token_transfer).toHaveBeenCalledWith(pool.address.toString('hex'), other.toString('hex'), balance1.toString());
				});
				it('no-op if both amounts are 0', async () => {
					await flash(0, 0, other);
					expect(mock_token_transfer).not.toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '0');
				});
				it('fails if flash amount is greater than token balance', async () => {
					await expect((async () => flash(balance0.add(1), balance1, other))()).rejects.toThrow();
					await expect((async () => flash(balance0, balance1.add(1), other))()).rejects.toThrow();
				});
				it('calls the flash callback on the sender with correct fee amounts', async () => {
					await flash(1001, 2002, other);
					expect(mockedFlashCallback).toHaveBeenCalledWith('4', '7');
				});
				it('increases the fee growth by the expected amount', async () => {
					await flash(1001, 2002, other);
					expect(pool.feeGrowthGlobal0X128).toBe(Uint.from(4).mul(Uint.from(2).pow(128)).div(expandTo18Decimals(2)).toString());
					expect(pool.feeGrowthGlobal1X128).toBe(Uint.from(7).mul(Uint.from(2).pow(128)).div(expandTo18Decimals(2)).toString());
				});
				it('fails if original balance not returned in either token', async () => {
					await expect((async () => flash(1000, 0, other, 999, 0))()).rejects.toThrow();
					await expect((async () => flash(0, 1000, other, 0, 999))()).rejects.toThrow();
				});
				it('fails if underpays either token', async () => {
					await expect((async () => flash(1000, 0, other, 1002, 0))()).rejects.toThrow();
					await expect((async () => flash(0, 1000, other, 0, 1002))()).rejects.toThrow();
				});
				it('allows donating token0', async () => {
					await flash(0, 0, AddressZero, 567, 0);
					expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '567');
					expect(pool.feeGrowthGlobal0X128).toBe(Uint.from(567).mul(Uint.from(2).pow(128)).div(expandTo18Decimals(2)).toString());
				});
				it('allows donating token1', async () => {
					await flash(0, 0, AddressZero, 0, 678);
					expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '678');
					expect(pool.feeGrowthGlobal1X128).toBe(Uint.from(678).mul(Uint.from(2).pow(128)).div(expandTo18Decimals(2)).toString());
				});
				it('allows donating token0 and token1 together', async () => {
					await flash(0, 0, AddressZero, 789, 1234);
					expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '789');

					expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '1234');

					expect(pool.feeGrowthGlobal0X128).toBe(Uint.from(789).mul(Uint.from(2).pow(128)).div(expandTo18Decimals(2)).toString());
					expect(pool.feeGrowthGlobal1X128).toBe(Uint.from(1234).mul(Uint.from(2).pow(128)).div(expandTo18Decimals(2)).toString());
				});
			});

			describe('fee on', () => {
				beforeEach(async () => {
					setFeeProtocol('6', '6');
				});

				it('emits an event', async () => {
					await flash(1001, 2001, other);
					eventResultContain(context.eventQueue, FlashEvent, module.name, {
						senderAddress: sender,
						recipientAddress: other,
						amount0: '1001',
						amount1: '2001',
						paid0: '4',
						paid1: '7',
					});
				});

				it('increases the fee growth by the expected amount', async () => {
					await flash(2002, 4004, other);

					eventResultContain(context.eventQueue, CollectProtocolEvent, module.name, {
						senderAddress: sender,
						recipientAddress: DEFAULT_TREASURY_ADDRESS,
						amount0: '1',
						amount1: '0',
					});
					eventResultContain(context.eventQueue, CollectProtocolEvent, module.name, {
						senderAddress: sender,
						recipientAddress: DEFAULT_TREASURY_ADDRESS,
						amount0: '0',
						amount1: '2',
					});

					expect(pool.feeGrowthGlobal0X128).toBe(Uint.from(6).mul(Uint.from(2).pow(128)).div(expandTo18Decimals(2)).toString());
					expect(pool.feeGrowthGlobal1X128).toBe(Uint.from(11).mul(Uint.from(2).pow(128)).div(expandTo18Decimals(2)).toString());
				});
				it('allows donating token0', async () => {
					await flash(0, 0, AddressZero, 567, 0);
					expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '567');

					eventResultContain(context.eventQueue, CollectProtocolEvent, module.name, {
						senderAddress: sender,
						recipientAddress: DEFAULT_TREASURY_ADDRESS,
						amount0: '94',
						amount1: '0',
					});

					expect(pool.feeGrowthGlobal0X128).toBe(Uint.from(473).mul(Uint.from(2).pow(128)).div(expandTo18Decimals(2)).toString());
				});
				it('allows donating token1', async () => {
					await flash(0, 0, AddressZero, 0, 678);
					expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '678');

					eventResultContain(context.eventQueue, CollectProtocolEvent, module.name, {
						senderAddress: sender,
						recipientAddress: DEFAULT_TREASURY_ADDRESS,
						amount0: '0',
						amount1: '113',
					});

					expect(pool.feeGrowthGlobal1X128).toBe(Uint.from(565).mul(Uint.from(2).pow(128)).div(expandTo18Decimals(2)).toString());
				});
				it('allows donating token0 and token1 together', async () => {
					await flash(0, 0, AddressZero, 789, 1234);
					expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '789');

					expect(mock_token_transfer).toHaveBeenCalledWith(sender.toString('hex'), pool.address.toString('hex'), '1234');

					eventResultContain(context.eventQueue, CollectProtocolEvent, module.name, {
						senderAddress: sender,
						recipientAddress: DEFAULT_TREASURY_ADDRESS,
						amount0: '131',
						amount1: '0',
					});
					eventResultContain(context.eventQueue, CollectProtocolEvent, module.name, {
						senderAddress: sender,
						recipientAddress: DEFAULT_TREASURY_ADDRESS,
						amount0: '0',
						amount1: '205',
					});

					expect(pool.feeGrowthGlobal0X128).toBe(Uint.from(658).mul(Uint.from(2).pow(128)).div(expandTo18Decimals(2)).toString());
					expect(pool.feeGrowthGlobal1X128).toBe(Uint.from(1029).mul(Uint.from(2).pow(128)).div(expandTo18Decimals(2)).toString());
				});
			});
		});
	});

	describe('#increaseObservationCardinalityNext - 2', () => {
		it('cannot be called before initialization', async () => {
			await expect((async () => pool.increaseObservationCardinalityNext('2'))()).rejects.toThrow();
		});
		describe('after initialization', () => {
			beforeEach(async () => pool.initialize(encodePriceSqrt(1, 1).toString()));
			it('oracle starting state after initialization', async () => {
				const { observationCardinality, observationIndex, observationCardinalityNext } = pool.slot0;
				expect(observationCardinality).toBe('1');
				expect(observationIndex).toBe('0');
				expect(observationCardinalityNext).toBe('1');
				const { secondsPerLiquidityCumulativeX128, tickCumulative, initialized, blockTimestamp } = await observationStore.getOrDefault(context, observationStore.getKey(pool.address, '0'));
				expect(secondsPerLiquidityCumulativeX128).toBe('0');
				expect(tickCumulative).toBe('0');
				expect(initialized).toBe(true);
				expect(blockTimestamp).toBe(TEST_POOL_START_TIME.toString());
			});
			it('increases observation cardinality next', async () => {
				await pool.increaseObservationCardinalityNext('2');
				const { observationCardinality, observationIndex, observationCardinalityNext } = pool.slot0;
				expect(observationCardinality).toBe('1');
				expect(observationIndex).toBe('0');
				expect(observationCardinalityNext).toBe('2');
			});
			it('is no op if target is already exceeded', async () => {
				await pool.increaseObservationCardinalityNext('5');
				await pool.increaseObservationCardinalityNext('3');
				const { observationCardinality, observationIndex, observationCardinalityNext } = pool.slot0;
				expect(observationCardinality).toBe('1');
				expect(observationIndex).toBe('0');
				expect(observationCardinalityNext).toBe('5');
			});
		});
	});

	describe('#snapshotCumulativesInside', () => {
		const tickLower = `-${parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10)}`;
		const tickUpper = TICK_SPACINGS[FeeAmount.MEDIUM];
		// eslint-disable-next-line @typescript-eslint/no-shadow
		const tickSpacing = TICK_SPACINGS[FeeAmount.MEDIUM];
		beforeEach(async () => {
			await pool.initialize(encodePriceSqrt(1, 1).toString());
			await mint(sender.toString('hex'), tickLower, tickUpper, 10);
		});
		it('throws if ticks are in reverse order', async () => {
			await expect((async () => pool.snapshotCumulativesInside(tickUpper, tickLower))()).rejects.toThrow();
		});
		it('throws if ticks are the same', async () => {
			await expect((async () => pool.snapshotCumulativesInside(tickUpper, tickUpper))()).rejects.toThrow();
		});
		it('throws if tick lower is too low', async () => {
			await expect((async () => pool.snapshotCumulativesInside((getMinTick(tickSpacing) - 1).toString(), tickUpper))()).rejects.toThrow();
		});
		it('throws if tick upper is too high', async () => {
			await expect((async () => pool.snapshotCumulativesInside(tickLower, (getMaxTick(tickSpacing) + 1).toString()))()).rejects.toThrow();
		});
		it('throws if tick lower is not initialized', async () => {
			await expect((async () => pool.snapshotCumulativesInside((parseInt(tickLower, 10) - parseInt(tickSpacing, 10)).toString(), tickUpper))()).rejects.toThrow();
		});
		it('throws if tick upper is not initialized', async () => {
			await expect((async () => pool.snapshotCumulativesInside(tickLower, tickUpper + tickSpacing))()).rejects.toThrow();
		});
		it('is zero immediately after initialize', async () => {
			const [tickCumulativeInside, secondsPerLiquidityInsideX128, secondsInside] = await pool.snapshotCumulativesInside(tickLower, tickUpper);
			expect(secondsPerLiquidityInsideX128).toBe('0');
			expect(tickCumulativeInside).toBe('0');
			expect(secondsInside).toBe('0');
		});
		it('increases by expected amount when time elapses in the range', async () => {
			advanceTime.bind(pool)('5');
			const [tickCumulativeInside, secondsPerLiquidityInsideX128, secondsInside] = await pool.snapshotCumulativesInside(tickLower, tickUpper);
			expect(secondsPerLiquidityInsideX128).toBe(Uint.from(5).shl(128).div(10).toString());
			expect(tickCumulativeInside).toBe('0');
			expect(secondsInside).toBe('5');
		});
		it('does not account for time increase above range', async () => {
			advanceTime.bind(pool)('5');
			await swapToHigherPrice(encodePriceSqrt(2, 1), sender);
			advanceTime.bind(pool)('7');
			const [tickCumulativeInside, secondsPerLiquidityInsideX128, secondsInside] = await pool.snapshotCumulativesInside(tickLower, tickUpper);
			expect(secondsPerLiquidityInsideX128).toBe(Uint.from(5).shl(128).div(10).toString());
			expect(tickCumulativeInside).toBe('0');
			expect(secondsInside).toBe('5');
		});
		it('does not account for time increase below range', async () => {
			advanceTime.bind(pool)('5');
			await swapToLowerPrice(encodePriceSqrt(1, 2), sender);
			advanceTime.bind(pool)('7');
			const [tickCumulativeInside, secondsPerLiquidityInsideX128, secondsInside] = await pool.snapshotCumulativesInside(tickLower, tickUpper);
			expect(secondsPerLiquidityInsideX128).toBe(Uint.from(5).shl(128).div(10).toString());
			// tick is 0 for 5 seconds, then not in range
			expect(tickCumulativeInside).toBe('0');
			expect(secondsInside).toBe('5');
		});
		it('time increase below range is not counted', async () => {
			await swapToLowerPrice(encodePriceSqrt(1, 2), sender);
			advanceTime.bind(pool)('5');
			await swapToHigherPrice(encodePriceSqrt(1, 1), sender);
			advanceTime.bind(pool)('7');
			const [tickCumulativeInside, secondsPerLiquidityInsideX128, secondsInside] = await pool.snapshotCumulativesInside(tickLower, tickUpper);
			expect(secondsPerLiquidityInsideX128).toBe(Uint.from(7).shl(128).div(10).toString());
			// tick is not in range then tick is 0 for 7 seconds
			expect(tickCumulativeInside).toBe('0');
			expect(secondsInside).toBe('7');
		});
		it('time increase above range is not counted', async () => {
			await swapToHigherPrice(encodePriceSqrt(2, 1), sender);
			advanceTime.bind(pool)('5');
			await swapToLowerPrice(encodePriceSqrt(1, 1), sender);
			advanceTime.bind(pool)('7');
			const [tickCumulativeInside, secondsPerLiquidityInsideX128, secondsInside] = await pool.snapshotCumulativesInside(tickLower, tickUpper);
			expect(secondsPerLiquidityInsideX128).toBe(Uint.from(7).shl(128).div(10).toString());
			expect(pool.slot0.tick).toBe('-1'); // justify the -7 tick cumulative inside value
			expect(tickCumulativeInside).toBe('-7');
			expect(secondsInside).toBe('7');
		});
		it('positions minted after time spent', async () => {
			advanceTime.bind(pool)('5');
			await mint(sender.toString('hex'), tickUpper, getMaxTick(tickSpacing), 15);
			await swapToHigherPrice(encodePriceSqrt(2, 1), sender);
			advanceTime.bind(pool)('8');
			const [tickCumulativeInside, secondsPerLiquidityInsideX128, secondsInside] = await pool.snapshotCumulativesInside(tickUpper, getMaxTick(tickSpacing).toString());
			expect(secondsPerLiquidityInsideX128).toBe(Uint.from(8).shl(128).div(15).toString());
			// the tick of 2/1 is 6931
			// 8 seconds * 6931 = 55448
			expect(tickCumulativeInside).toBe('55448');
			expect(secondsInside).toBe('8');
		});
		it('overlapping liquidity is aggregated', async () => {
			await mint(sender.toString('hex'), tickLower, getMaxTick(tickSpacing), 15);
			advanceTime.bind(pool)('5');
			await swapToHigherPrice(encodePriceSqrt(2, 1), sender);
			advanceTime.bind(pool)('8');
			const [tickCumulativeInside, secondsPerLiquidityInsideX128, secondsInside] = await pool.snapshotCumulativesInside(tickLower, tickUpper);
			expect(secondsPerLiquidityInsideX128).toBe(Uint.from(5).shl(128).div(25).toString());
			expect(tickCumulativeInside).toBe('0');
			expect(secondsInside).toBe('5');
		});
		it('relative behavior of snapshots', async () => {
			advanceTime.bind(pool)('5');
			await mint(sender.toString('hex'), getMinTick(tickSpacing), tickLower, 15);
			const [tickCumulativeInsideStart, secondsPerLiquidityInsideX128Start, secondsInsideStart] = await pool.snapshotCumulativesInside(getMinTick(tickSpacing).toString(), tickLower);
			advanceTime.bind(pool)('8');
			// 13 seconds in starting range, then 3 seconds in newly minted range
			await swapToLowerPrice(encodePriceSqrt(1, 2), sender);
			advanceTime.bind(pool)('3');
			const [tickCumulativeInside, secondsPerLiquidityInsideX128, secondsInside] = await pool.snapshotCumulativesInside(getMinTick(tickSpacing).toString(), tickLower);
			const expectedDiffSecondsPerLiquidity = Uint.from(3).shl(128).div(15);
			expect(Uint160.from(secondsPerLiquidityInsideX128).sub(secondsPerLiquidityInsideX128Start).toString()).toBe(expectedDiffSecondsPerLiquidity.toString());
			expect(secondsPerLiquidityInsideX128).not.toBe(expectedDiffSecondsPerLiquidity.toString());
			// the tick is the one corresponding to the price of 1/2, or log base 1.0001 of 0.5
			// this is -6932, and 3 seconds have passed, so the cumulative computed from the diff equals 6932 * 3
			expect(Int56.from(tickCumulativeInside).sub(tickCumulativeInsideStart).toString()).toBe('-20796');
			expect(parseInt(secondsInside, 10) - parseInt(secondsInsideStart, 10)).toBe(3);
			expect(secondsInside).not.toBe('3');
		});
	});

	describe('fees overflow scenarios', () => {
		it('up to max uint 128', async () => {
			await pool.initialize(encodePriceSqrt(1, 1).toString());
			await mint(sender.toString('hex'), minTick, maxTick, 1);
			await flash(0, 0, sender, MaxUint128, MaxUint128);

			const [feeGrowthGlobal0X128, feeGrowthGlobal1X128] = await Promise.all([pool.feeGrowthGlobal0X128, pool.feeGrowthGlobal1X128]);
			// all 1s in first 128 bits
			expect(feeGrowthGlobal0X128).toBe(MaxUint128.shl(128).toString());
			expect(feeGrowthGlobal1X128).toBe(MaxUint128.shl(128).toString());
			await pool.burn(minTick.toString(), maxTick.toString(), '0');
			const [amount0, amount1] = await pool.collect(sender, minTick.toString(), maxTick.toString(), MaxUint128.toString(), MaxUint128.toString());
			expect(amount0).toBe(MaxUint128.toString());
			expect(amount1).toBe(MaxUint128.toString());
		});

		it('overflow max uint 128', async () => {
			await pool.initialize(encodePriceSqrt(1, 1).toString());
			await mint(sender.toString('hex'), minTick, maxTick, 1);
			await flash(0, 0, sender, MaxUint128, MaxUint128);
			await flash(0, 0, sender, 1, 1);

			const [feeGrowthGlobal0X128, feeGrowthGlobal1X128] = await Promise.all([pool.feeGrowthGlobal0X128, pool.feeGrowthGlobal1X128]);
			// all 1s in first 128 bits
			expect(feeGrowthGlobal0X128).toBe('0');
			expect(feeGrowthGlobal1X128).toBe('0');
			await pool.burn(minTick.toString(), maxTick.toString(), '0');
			const [amount0, amount1] = await pool.collect(sender, minTick.toString(), maxTick.toString(), MaxUint128.toString(), MaxUint128.toString());
			// fees burned
			expect(amount0).toBe('0');
			expect(amount1).toBe('0');
		});

		it('overflow max uint 128 after poke burns fees owed to 0', async () => {
			await pool.initialize(encodePriceSqrt(1, 1).toString());
			await mint(sender.toString('hex'), minTick, maxTick, 1);
			await flash(0, 0, sender, MaxUint128, MaxUint128);
			await pool.burn(minTick.toString(), maxTick.toString(), '0');
			await flash(0, 0, sender, 1, 1);
			await pool.burn(minTick.toString(), maxTick.toString(), '0');

			const [amount0, amount1] = await pool.collect(sender, minTick.toString(), maxTick.toString(), MaxUint128.toString(), MaxUint128.toString());
			// fees burned
			expect(amount0).toBe('0');
			expect(amount1).toBe('0');
		});

		it('two positions at the same snapshot', async () => {
			await pool.initialize(encodePriceSqrt(1, 1).toString());
			await mint(sender.toString('hex'), minTick, maxTick, 1);
			await mint(other.toString('hex'), minTick, maxTick, 1);
			await flash(0, 0, sender, MaxUint128, 0);
			await flash(0, 0, sender, MaxUint128, 0);

			const { feeGrowthGlobal0X128 } = pool;
			expect(feeGrowthGlobal0X128).toBe(MaxUint128.shl(128).toString());

			await flash(0, 0, sender, 2, 0);
			await pool.burn(minTick.toString(), maxTick.toString(), '0');

			pool['mutableContext'] = otherContext;
			await pool.burn(minTick.toString(), maxTick.toString(), '0');

			pool['mutableContext'] = senderContext;
			let [amount0] = await pool.collect(sender, minTick.toString(), maxTick.toString(), MaxUint128.toString(), MaxUint128.toString());

			expect(amount0).toBe('0');

			pool['mutableContext'] = otherContext;
			[amount0] = await pool.collect(other, minTick.toString(), maxTick.toString(), MaxUint128.toString(), MaxUint128.toString());
			pool['mutableContext'] = senderContext;
			expect(amount0).toBe('0');
		});

		it('two positions 1 wei of fees apart overflows exactly once', async () => {
			await pool.initialize(encodePriceSqrt(1, 1).toString());
			await mint(sender.toString('hex'), minTick, maxTick, 1);
			await flash(0, 0, sender, 1, 0);
			await mint(other.toString('hex'), minTick, maxTick, 1);
			await flash(0, 0, sender, MaxUint128, 0);
			await flash(0, 0, sender, MaxUint128, 0);

			const { feeGrowthGlobal0X128 } = pool;
			expect(feeGrowthGlobal0X128).toBe('0');

			await flash(0, 0, sender, 2, 0);
			await pool.burn(minTick.toString(), maxTick.toString(), '0');

			pool['mutableContext'] = otherContext;
			await pool.burn(minTick.toString(), maxTick.toString(), '0');

			pool['mutableContext'] = senderContext;
			let [amount0] = await pool.collect(sender, minTick.toString(), maxTick.toString(), MaxUint128.toString(), MaxUint128.toString());
			expect(amount0).toBe('1');

			pool['mutableContext'] = otherContext;
			[amount0] = await pool.collect(other, minTick.toString(), maxTick.toString(), MaxUint128.toString(), MaxUint128.toString());
			expect(amount0).toBe('0');
		});
	});

	describe('swap underpayment tests', () => {
		let underpay: TestSwapPay;
		beforeEach(async () => {
			const swapContext = methodSwapContext(context, sender, parseInt(TEST_POOL_START_TIME, 10));
			underpay = new TestSwapPay(swapContext, module);

			await pool.initialize(encodePriceSqrt(1, 1).toString());
			await mint(sender.toString('hex'), minTick, maxTick, expandTo18Decimals(1));
		});

		it('underpay zero for one and exact in', async () => {
			await expect((async () => underpay.swap.bind(underpay)(pool, sender, true, MIN_SQRT_RATIO.add(1).toString(), '1000', '1', '0'))()).rejects.toThrow('IIA');
		});
		it('pay in the wrong token zero for one and exact in', async () => {
			await expect((async () => underpay.swap.bind(underpay)(pool, sender, true, MIN_SQRT_RATIO.add(1).toString(), '1000', '0', '2000'))()).rejects.toThrow('IIA');
		});
		it('overpay zero for one and exact in', async () => {
			await expect((async () => underpay.swap.bind(underpay)(pool, sender, true, MIN_SQRT_RATIO.add(1).toString(), '1000', '2000', '0'))()).resolves.not.toThrow('IIA');
		});
		it('underpay zero for one and exact out', async () => {
			await expect((async () => underpay.swap.bind(underpay)(pool, sender, true, MIN_SQRT_RATIO.add(1).toString(), '-1000', '1', '0'))()).rejects.toThrow('IIA');
		});
		it('pay in the wrong token zero for one and exact out', async () => {
			await expect((async () => underpay.swap.bind(underpay)(pool, sender, true, MIN_SQRT_RATIO.add(1).toString(), '-1000', '0', '2000'))()).rejects.toThrow('IIA');
		});
		it('overpay zero for one and exact out', async () => {
			await expect((async () => underpay.swap.bind(underpay)(pool, sender, true, MIN_SQRT_RATIO.add(1).toString(), '-1000', '2000', '0'))()).resolves.not.toThrow('IIA');
		});
		it('(async() => underpay one for zero and exact in', async () => {
			await expect((async () => underpay.swap.bind(underpay)(pool, sender, false, MAX_SQRT_RATIO.sub(1).toString(), '1000', '0', '1'))()).rejects.toThrow('IIA');
		});
		it('pay in the wrong token one for zero and exact in', async () => {
			await expect((async () => underpay.swap.bind(underpay)(pool, sender, false, MAX_SQRT_RATIO.sub(1).toString(), '1000', '2000', '0'))()).rejects.toThrow('IIA');
		});
		it('overpay one for zero and exact in', async () => {
			await expect((async () => underpay.swap.bind(underpay)(pool, sender, false, MAX_SQRT_RATIO.sub(1).toString(), '1000', '0', '2000'))()).resolves.not.toThrow('IIA');
		});
		it('(async() => underpay one for zero and exact out', async () => {
			await expect((async () => underpay.swap.bind(underpay)(pool, sender, false, MAX_SQRT_RATIO.sub(1).toString(), '-1000', '0', '1'))()).rejects.toThrow('IIA');
		});
		it('pay in the wrong token one for zero and exact out', async () => {
			await expect((async () => underpay.swap.bind(underpay)(pool, sender, false, MAX_SQRT_RATIO.sub(1).toString(), '-1000', '2000', '0'))()).rejects.toThrow('IIA');
		});
		it('overpay one for zero and exact out', async () => {
			await expect((async () => underpay.swap.bind(underpay)(pool, sender, false, MAX_SQRT_RATIO.sub(1).toString(), '-1000', '0', '2000'))()).resolves.not.toThrow('IIA');
		});
	});
});
