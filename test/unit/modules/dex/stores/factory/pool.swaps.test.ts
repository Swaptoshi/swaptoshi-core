/* eslint-disable no-loop-func */
/* eslint-disable camelcase */
import { Decimal } from 'decimal.js';
import { MethodContext, TokenMethod } from 'lisk-sdk';
import { formatPrice, formatTokenAmount } from '../shared/format';
import {
	createPoolFunctions,
	encodePriceSqrt,
	expandTo18Decimals,
	FeeAmount,
	getMaxLiquidityPerTick,
	getMaxTick,
	getMinTick,
	MAX_SQRT_RATIO,
	MIN_SQRT_RATIO,
	TICK_SPACINGS,
} from '../shared/utilities';
import { TEST_POOL_START_TIME, poolFixture } from '../shared/pool';
import {
	BigIntAble,
	Uint,
	Uint128,
} from '../../../../../../src/app/modules/dex/stores/library/int';
import { SwaptoshiPool } from '../../../../../../src/app/modules/dex/stores/factory';
import { mock_token_transfer } from '../shared/token';
import { eventResultContain } from '../../../../../utils/events';
import { SwapEvent } from '../../../../../../src/app/modules/dex/events/swap';
import { DexModule } from '../../../../../../src/app/modules/dex/module';
import { methodContextFixture } from '../shared/module';
import { methodSwapContext } from '../../../../../../src/app/modules/dex/stores/context';

Decimal.config({ toExpNeg: -500, toExpPos: 500 });

interface BaseSwapTestCase {
	zeroForOne: boolean;
	sqrtPriceLimit?: Uint;
}
interface SwapExact0For1TestCase extends BaseSwapTestCase {
	zeroForOne: true;
	exactOut: false;
	amount0: BigIntAble;
	sqrtPriceLimit?: Uint;
}
interface SwapExact1For0TestCase extends BaseSwapTestCase {
	zeroForOne: false;
	exactOut: false;
	amount1: BigIntAble;
	sqrtPriceLimit?: Uint;
}
interface Swap0ForExact1TestCase extends BaseSwapTestCase {
	zeroForOne: true;
	exactOut: true;
	amount1: BigIntAble;
	sqrtPriceLimit?: Uint;
}
interface Swap1ForExact0TestCase extends BaseSwapTestCase {
	zeroForOne: false;
	exactOut: true;
	amount0: BigIntAble;
	sqrtPriceLimit?: Uint;
}
interface SwapToHigherPrice extends BaseSwapTestCase {
	zeroForOne: false;
	sqrtPriceLimit: Uint;
}
interface SwapToLowerPrice extends BaseSwapTestCase {
	zeroForOne: true;
	sqrtPriceLimit: Uint;
}
type SwapTestCase =
	| SwapExact0For1TestCase
	| Swap0ForExact1TestCase
	| SwapExact1For0TestCase
	| Swap1ForExact0TestCase
	| SwapToHigherPrice
	| SwapToLowerPrice;

function swapCaseToDescription(testCase: SwapTestCase): string {
	const priceClause = testCase?.sqrtPriceLimit
		? ` to price ${formatPrice(testCase.sqrtPriceLimit)}`
		: '';
	if ('exactOut' in testCase) {
		if (testCase.exactOut) {
			if (testCase.zeroForOne) {
				return `swap token0 for exactly ${formatTokenAmount(
					testCase.amount1,
				)} token1${priceClause}`;
			}
			return `swap token1 for exactly ${formatTokenAmount(testCase.amount0)} token0${priceClause}`;
		}
		if (testCase.zeroForOne) {
			return `swap exactly ${formatTokenAmount(testCase.amount0)} token0 for token1${priceClause}`;
		}
		return `swap exactly ${formatTokenAmount(testCase.amount1)} token1 for token0${priceClause}`;
	}
	if (testCase.zeroForOne) {
		return `swap token0 for token1${priceClause}`;
	}
	return `swap token1 for token0${priceClause}`;
}

type PoolFunctions = ReturnType<typeof createPoolFunctions>;

const sender = Buffer.from('0000000000000000000000000000000000000001', 'hex');

// can't use address zero because the Buffer token does not allow it
const SWAP_RECIPIENT_ADDRESS = Buffer.from('0000000000000000000000000000000000000002', 'hex');
const POSITION_PROCEEDS_OUTPUT_ADDRESS = Buffer.from(
	'0000000000000000000000000000000000000003',
	'hex',
);

async function executeSwap(
	_pool: SwaptoshiPool,
	testCase: SwapTestCase,
	poolFunctions: PoolFunctions,
): Promise<void> {
	let swap: void;
	if ('exactOut' in testCase) {
		if (testCase.exactOut) {
			if (testCase.zeroForOne) {
				swap = await poolFunctions.swap0ForExact1(
					testCase.amount1,
					SWAP_RECIPIENT_ADDRESS,
					testCase.sqrtPriceLimit,
				);
			} else {
				swap = await poolFunctions.swap1ForExact0(
					testCase.amount0,
					SWAP_RECIPIENT_ADDRESS,
					testCase.sqrtPriceLimit,
				);
			}
		} else if (testCase.zeroForOne) {
			swap = await poolFunctions.swapExact0For1(
				testCase.amount0,
				SWAP_RECIPIENT_ADDRESS,
				testCase.sqrtPriceLimit,
			);
		} else {
			swap = await poolFunctions.swapExact1For0(
				testCase.amount1,
				SWAP_RECIPIENT_ADDRESS,
				testCase.sqrtPriceLimit,
			);
		}
	} else if (testCase.zeroForOne) {
		swap = await poolFunctions.swapToLowerPrice(testCase.sqrtPriceLimit, SWAP_RECIPIENT_ADDRESS);
	} else {
		swap = await poolFunctions.swapToHigherPrice(testCase.sqrtPriceLimit, SWAP_RECIPIENT_ADDRESS);
	}
	return swap;
}

const DEFAULT_POOL_SWAP_TESTS: SwapTestCase[] = [
	// swap large amounts in/out
	{
		zeroForOne: true,
		exactOut: false,
		amount0: expandTo18Decimals(1),
	},
	{
		zeroForOne: false,
		exactOut: false,
		amount1: expandTo18Decimals(1),
	},
	{
		zeroForOne: true,
		exactOut: true,
		amount1: expandTo18Decimals(1),
	},
	{
		zeroForOne: false,
		exactOut: true,
		amount0: expandTo18Decimals(1),
	},
	// swap large amounts in/out with a price limit
	{
		zeroForOne: true,
		exactOut: false,
		amount0: expandTo18Decimals(1),
		sqrtPriceLimit: encodePriceSqrt(50, 100),
	},
	{
		zeroForOne: false,
		exactOut: false,
		amount1: expandTo18Decimals(1),
		sqrtPriceLimit: encodePriceSqrt(200, 100),
	},
	{
		zeroForOne: true,
		exactOut: true,
		amount1: expandTo18Decimals(1),
		sqrtPriceLimit: encodePriceSqrt(50, 100),
	},
	{
		zeroForOne: false,
		exactOut: true,
		amount0: expandTo18Decimals(1),
		sqrtPriceLimit: encodePriceSqrt(200, 100),
	},
	// swap small amounts in/out
	{
		zeroForOne: true,
		exactOut: false,
		amount0: 1000,
	},
	{
		zeroForOne: false,
		exactOut: false,
		amount1: 1000,
	},
	{
		zeroForOne: true,
		exactOut: true,
		amount1: 1000,
	},
	{
		zeroForOne: false,
		exactOut: true,
		amount0: 1000,
	},
	// swap arbitrary input to price
	{
		sqrtPriceLimit: encodePriceSqrt(5, 2),
		zeroForOne: false,
	},
	{
		sqrtPriceLimit: encodePriceSqrt(2, 5),
		zeroForOne: true,
	},
	{
		sqrtPriceLimit: encodePriceSqrt(5, 2),
		zeroForOne: true,
	},
	{
		sqrtPriceLimit: encodePriceSqrt(2, 5),
		zeroForOne: false,
	},
];

interface Position {
	tickLower: number;
	tickUpper: number;
	liquidity: BigIntAble;
}

interface PoolTestCase {
	description: string;
	feeAmount: number;
	tickSpacing: number;
	startingPrice: Uint;
	positions: Position[];
	swapTests?: SwapTestCase[];
}

const TEST_POOLS: PoolTestCase[] = [
	{
		description: 'low fee, 1:1 price, 2e18 max range liquidity',
		feeAmount: parseInt(FeeAmount.LOW, 10),
		tickSpacing: parseInt(TICK_SPACINGS[FeeAmount.LOW], 10),
		startingPrice: encodePriceSqrt(1, 1),
		positions: [
			{
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.LOW]),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.LOW]),
				liquidity: expandTo18Decimals(2),
			},
		],
	},
	{
		description: 'medium fee, 1:1 price, 2e18 max range liquidity',
		feeAmount: parseInt(FeeAmount.MEDIUM, 10),
		tickSpacing: parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10),
		startingPrice: encodePriceSqrt(1, 1),
		positions: [
			{
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				liquidity: expandTo18Decimals(2),
			},
		],
	},
	{
		description: 'high fee, 1:1 price, 2e18 max range liquidity',
		feeAmount: parseInt(FeeAmount.HIGH, 10),
		tickSpacing: parseInt(TICK_SPACINGS[FeeAmount.HIGH], 10),
		startingPrice: encodePriceSqrt(1, 1),
		positions: [
			{
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.HIGH]),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.HIGH]),
				liquidity: expandTo18Decimals(2),
			},
		],
	},
	{
		description: 'medium fee, 10:1 price, 2e18 max range liquidity',
		feeAmount: parseInt(FeeAmount.MEDIUM, 10),
		tickSpacing: parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10),
		startingPrice: encodePriceSqrt(10, 1),
		positions: [
			{
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				liquidity: expandTo18Decimals(2),
			},
		],
	},
	{
		description: 'medium fee, 1:10 price, 2e18 max range liquidity',
		feeAmount: parseInt(FeeAmount.MEDIUM, 10),
		tickSpacing: parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10),
		startingPrice: encodePriceSqrt(1, 10),
		positions: [
			{
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				liquidity: expandTo18Decimals(2),
			},
		],
	},
	{
		description: 'medium fee, 1:1 price, 0 liquidity, all liquidity around current price',
		feeAmount: parseInt(FeeAmount.MEDIUM, 10),
		tickSpacing: parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10),
		startingPrice: encodePriceSqrt(1, 1),
		positions: [
			{
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				tickUpper: -TICK_SPACINGS[FeeAmount.MEDIUM],
				liquidity: expandTo18Decimals(2),
			},
			{
				tickLower: parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				liquidity: expandTo18Decimals(2),
			},
		],
	},
	{
		description: 'medium fee, 1:1 price, additional liquidity around current price',
		feeAmount: parseInt(FeeAmount.MEDIUM, 10),
		tickSpacing: parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10),
		startingPrice: encodePriceSqrt(1, 1),
		positions: [
			{
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				liquidity: expandTo18Decimals(2),
			},
			{
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				tickUpper: -TICK_SPACINGS[FeeAmount.MEDIUM],
				liquidity: expandTo18Decimals(2),
			},
			{
				tickLower: parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				liquidity: expandTo18Decimals(2),
			},
		],
	},
	{
		description: 'low fee, large liquidity around current price (stable swap)',
		feeAmount: parseInt(FeeAmount.LOW, 10),
		tickSpacing: parseInt(TICK_SPACINGS[FeeAmount.LOW], 10),
		startingPrice: encodePriceSqrt(1, 1),
		positions: [
			{
				tickLower: -TICK_SPACINGS[FeeAmount.LOW],
				tickUpper: parseInt(TICK_SPACINGS[FeeAmount.LOW], 10),
				liquidity: expandTo18Decimals(2),
			},
		],
	},
	{
		description: 'medium fee, token0 liquidity only',
		feeAmount: parseInt(FeeAmount.MEDIUM, 10),
		tickSpacing: parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10),
		startingPrice: encodePriceSqrt(1, 1),
		positions: [
			{
				tickLower: 0,
				tickUpper: 2000 * parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10),
				liquidity: expandTo18Decimals(2),
			},
		],
	},
	{
		description: 'medium fee, token1 liquidity only',
		feeAmount: parseInt(FeeAmount.MEDIUM, 10),
		tickSpacing: parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10),
		startingPrice: encodePriceSqrt(1, 1),
		positions: [
			{
				tickLower: -2000 * parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10),
				tickUpper: 0,
				liquidity: expandTo18Decimals(2),
			},
		],
	},
	{
		description: 'close to max price',
		feeAmount: parseInt(FeeAmount.MEDIUM, 10),
		tickSpacing: parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10),
		startingPrice: encodePriceSqrt(Uint.from(2).pow(127), 1),
		positions: [
			{
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				liquidity: expandTo18Decimals(2),
			},
		],
	},
	{
		description: 'close to min price',
		feeAmount: parseInt(FeeAmount.MEDIUM, 10),
		tickSpacing: parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10),
		startingPrice: encodePriceSqrt(1, Uint.from(2).pow(127)),
		positions: [
			{
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				liquidity: expandTo18Decimals(2),
			},
		],
	},
	{
		description: 'max full range liquidity at 1:1 price with default fee',
		feeAmount: parseInt(FeeAmount.MEDIUM, 10),
		tickSpacing: parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10),
		startingPrice: encodePriceSqrt(1, 1),
		positions: [
			{
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				liquidity: getMaxLiquidityPerTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
			},
		],
	},
	{
		description: 'initialized at the max ratio',
		feeAmount: parseInt(FeeAmount.MEDIUM, 10),
		tickSpacing: parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10),
		startingPrice: MAX_SQRT_RATIO.sub(1),
		positions: [
			{
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				liquidity: expandTo18Decimals(2),
			},
		],
	},
	{
		description: 'initialized at the min ratio',
		feeAmount: parseInt(FeeAmount.MEDIUM, 10),
		tickSpacing: parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10),
		startingPrice: MIN_SQRT_RATIO,
		positions: [
			{
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
				liquidity: expandTo18Decimals(2),
			},
		],
	},
];

describe('Swaptoshi Pool swap tests', () => {
	for (const poolCase of TEST_POOLS) {
		let module: DexModule;
		let createMethodContext: () => MethodContext;
		let context: MethodContext;
		let tokenMethod: TokenMethod;

		describe(poolCase.description, () => {
			const poolCaseFixture = async () => {
				({ module, createMethodContext, tokenMethod } = await methodContextFixture());
				context = createMethodContext();
				const swapContext = methodSwapContext(context, sender, parseInt(TEST_POOL_START_TIME, 10));
				const {
					createPool,
					token0,
					token1,
					swapTargetCallee: swapTarget,
				} = await poolFixture(swapContext, module);
				const pool = await createPool(
					poolCase.feeAmount.toString(),
					poolCase.tickSpacing.toString(),
				);
				const poolFunctions = createPoolFunctions({ swapTarget, token0, token1, pool });
				await pool.initialize(poolCase.startingPrice.toString());
				// mint all positions
				for (const position of poolCase.positions) {
					await poolFunctions.mint(
						sender.toString('hex'),
						position.tickLower,
						position.tickUpper,
						position.liquidity,
					);
				}

				const [poolBalance0, poolBalance1] = await Promise.all([
					(
						(await tokenMethod.getAvailableBalance(context, pool.address, token0)) ?? BigInt(0)
					).toString(),
					(
						(await tokenMethod.getAvailableBalance(context, pool.address, token1)) ?? BigInt(0)
					).toString(),
				]);

				return { token0, token1, pool, poolFunctions, poolBalance0, poolBalance1, swapTarget };
			};

			let token0: Buffer;
			let token1: Buffer;

			let poolBalance0: string;
			let poolBalance1: string;

			let pool: SwaptoshiPool;
			let poolFunctions: PoolFunctions;

			beforeEach(async () => {
				({ token0, token1, pool, poolFunctions, poolBalance0, poolBalance1 } =
					await poolCaseFixture());
			});

			afterEach(async () => {
				for (const { liquidity, tickUpper, tickLower } of poolCase.positions) {
					await pool.burn(tickLower.toString(), tickUpper.toString(), liquidity.toString());
					await pool.collect(
						POSITION_PROCEEDS_OUTPUT_ADDRESS,
						tickLower.toString(),
						tickUpper.toString(),
						Uint128.MAX,
						Uint128.MAX,
					);
				}
			});

			for (const testCase of poolCase.swapTests ?? DEFAULT_POOL_SWAP_TESTS) {
				it(swapCaseToDescription(testCase), async () => {
					const { slot0, liquidity: liquidityBefore } = pool.createEmulator();
					try {
						await executeSwap(pool, testCase, poolFunctions);
					} catch (error) {
						expect({
							swapError: (error as string)
								.toString()
								.replace('Error: ', 'VM Exception while processing transaction: revert '),
							poolBalance0: poolBalance0.toString(),
							poolBalance1: poolBalance1.toString(),
							poolPriceBefore: formatPrice(slot0.sqrtPriceX96),
							tickBefore: parseInt(slot0.tick, 10),
						}).toMatchSnapshot();
						return;
					}
					const [
						poolBalance0After,
						poolBalance1After,
						slot0After,
						liquidityAfter,
						feeGrowthGlobal0X128,
						feeGrowthGlobal1X128,
					] = await Promise.all([
						(
							(await tokenMethod.getAvailableBalance(context, pool.address, token0)) ?? BigInt(0)
						).toString(),
						(
							(await tokenMethod.getAvailableBalance(context, pool.address, token1)) ?? BigInt(0)
						).toString(),
						pool.slot0,
						pool.liquidity,
						pool.feeGrowthGlobal0X128,
						pool.feeGrowthGlobal1X128,
					]);
					const poolBalance0Delta = Uint.from(poolBalance0After).sub(poolBalance0);
					const poolBalance1Delta = Uint.from(poolBalance1After).sub(poolBalance1);

					// check all the events were emitted corresponding to balance changes
					if (poolBalance0Delta.eq(0))
						expect(mock_token_transfer).not.toHaveBeenCalledWith(
							pool.address.toString('hex'),
							SWAP_RECIPIENT_ADDRESS.toString('hex'),
							'0',
						);
					else if (poolBalance0Delta.lt(0))
						expect(mock_token_transfer).toHaveBeenCalledWith(
							pool.address.toString('hex'),
							SWAP_RECIPIENT_ADDRESS.toString('hex'),
							poolBalance0Delta.mul(-1).toString(),
						);
					else
						expect(mock_token_transfer).toHaveBeenCalledWith(
							sender.toString('hex'),
							pool.address.toString('hex'),
							poolBalance0Delta.toString(),
						);

					if (poolBalance1Delta.eq(0))
						expect(mock_token_transfer).not.toHaveBeenCalledWith(
							pool.address.toString('hex'),
							SWAP_RECIPIENT_ADDRESS.toString('hex'),
							'0',
						);
					else if (poolBalance1Delta.lt(0))
						expect(mock_token_transfer).toHaveBeenCalledWith(
							pool.address.toString('hex'),
							SWAP_RECIPIENT_ADDRESS.toString('hex'),
							poolBalance1Delta.mul(-1).toString(),
						);
					else
						expect(mock_token_transfer).toHaveBeenCalledWith(
							sender.toString('hex'),
							pool.address.toString('hex'),
							poolBalance1Delta.toString(),
						);

					// check that the swap event was emitted too
					eventResultContain(context.eventQueue, SwapEvent, 'dex', {
						senderAddress: sender,
						recipientAddress: SWAP_RECIPIENT_ADDRESS,
						amount0: poolBalance0Delta.toString(),
						amount1: poolBalance1Delta.toString(),
						sqrtPriceX96Before: slot0.sqrtPriceX96,
						sqrtPriceX96: slot0After.sqrtPriceX96,
						liquidityBefore,
						liquidity: liquidityAfter,
						tickBefore: slot0.tick,
						tick: slot0After.tick,
						feeGrowthGlobal0X128Before: '0',
						feeGrowthGlobal0X128: feeGrowthGlobal0X128.toString(),
						feeGrowthGlobal1X128Before: '0',
						feeGrowthGlobal1X128: feeGrowthGlobal1X128.toString(),
					});

					const executionPrice = new Decimal(poolBalance1Delta.toString())
						.div(poolBalance0Delta.toString())
						.mul(-1);

					expect({
						amount0Before: poolBalance0.toString(),
						amount1Before: poolBalance1.toString(),
						amount0Delta: poolBalance0Delta.toString(),
						amount1Delta: poolBalance1Delta.toString(),
						feeGrowthGlobal0X128Delta: feeGrowthGlobal0X128.toString(),
						feeGrowthGlobal1X128Delta: feeGrowthGlobal1X128.toString(),
						tickBefore: parseInt(slot0.tick, 10),
						poolPriceBefore: formatPrice(slot0.sqrtPriceX96),
						tickAfter: parseInt(slot0After.tick, 10),
						poolPriceAfter: formatPrice(slot0After.sqrtPriceX96),
						executionPrice: executionPrice.toPrecision(5),
					}).toMatchSnapshot();
				});
			}
		});
	}
});
