/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-loop-func */
import Decimal from 'decimal.js';
import { MethodContext, TokenMethod } from 'lisk-sdk';
import {
	FeeAmount,
	MAX_SQRT_RATIO,
	MIN_SQRT_RATIO,
	MintFunction,
	SwapFunction,
	TICK_SPACINGS,
	createPoolFunctions,
	encodePriceSqrt,
	expandTo18Decimals,
	getMaxLiquidityPerTick,
	getMaxTick,
	getMinTick,
} from '../shared/utilities';
import { formatPrice, formatTokenAmount } from '../shared/format';
import { TEST_POOL_START_TIME, poolFixture } from '../shared/pool';
import { Uint, Uint128, Uint256 } from '../../../../../../src/app/modules/dex/stores/library/int';

import * as tickMath from '../../../../../../src/app/modules/dex/stores/library/core/tick_math';
import { SwaptoshiPool } from '../../../../../../src/app/modules/dex/stores/factory';
import { SwapTest } from '../shared/fixtures/SwapTest';
import { methodContextFixture } from '../shared/module';
import { methodSwapContext } from '../../../../../../src/app/modules/dex/stores/context';
import { FeeProtocol } from '../../../../../../src/app/modules/dex/stores/library/periphery';
import { DexModule } from '../../../../../../src/app/modules/dex/module';
import { DexModuleConfig } from '../../../../../../src/app/modules/dex/types';
import { TokenRegistry } from '../shared/token/token_registry';

const sender = Buffer.from('0000000000000000000000000000000000000005', 'hex');
const arbitrageur = Buffer.from('0000000000000000000000000000000000000006', 'hex');

Decimal.config({ toExpNeg: -500, toExpPos: 500 });

function applySqrtRatioBipsHundredthsDelta(sqrtRatio: Uint, bipsHundredths: number): Uint {
	return Uint.from(
		new Decimal(
			sqrtRatio
				.mul(sqrtRatio)
				.mul(1e6 + bipsHundredths)
				.div(1e6)
				.toString(),
		)
			.sqrt()
			.floor()
			.toString(),
	);
}

describe('Swaptoshi Pool arbitrage tests', () => {
	for (const feeProtocol of [0, 6]) {
		describe(`protocol fee = ${feeProtocol};`, () => {
			let module: DexModule;
			let config: DexModuleConfig;
			let tokenMethod: TokenMethod;
			let createMethodContext: () => MethodContext;

			const startingPrice = encodePriceSqrt(1, 1);
			const startingTick = 0;
			const feeAmount = FeeAmount.MEDIUM;
			const tickSpacing = TICK_SPACINGS[feeAmount];
			const minTick = getMinTick(tickSpacing);
			const maxTick = getMaxTick(tickSpacing);

			for (const passiveLiquidity of [
				expandTo18Decimals(1).div(100),
				expandTo18Decimals(1),
				expandTo18Decimals(10),
				expandTo18Decimals(100),
			]) {
				describe(`passive liquidity of ${formatTokenAmount(passiveLiquidity)}`, () => {
					const arbTestFixture = async () => {
						({ module, createMethodContext, tokenMethod, config } = await methodContextFixture());
						const swapContext = methodSwapContext(
							createMethodContext(),
							sender,
							parseInt(TEST_POOL_START_TIME, 10),
						);
						const fix = await poolFixture(swapContext, module);

						const pool = await fix.createPool(feeAmount, tickSpacing);

						await tokenMethod.transfer(
							swapContext.context,
							sender,
							arbitrageur,
							fix.token0,
							Uint.from(2).pow(254).toBigInt(),
						);
						await tokenMethod.transfer(
							swapContext.context,
							sender,
							arbitrageur,
							fix.token1,
							Uint.from(2).pow(254).toBigInt(),
						);

						const { swapExact0For1, swapToHigherPrice, swapToLowerPrice, swapExact1For0, mint } =
							createPoolFunctions({
								swapTarget: fix.swapTargetCallee,
								token0: fix.token0,
								token1: fix.token1,
								pool,
							});

						const tester = new SwapTest(swapContext, module);

						await pool.initialize(startingPrice.toString());
						if (feeProtocol !== 0) {
							pool.setConfig({
								...config,
								feeProtocol: FeeProtocol.calculateFeeProtocol(
									feeProtocol.toString(),
									feeProtocol.toString(),
								),
							});
						}
						await mint(sender.toString('hex'), minTick, maxTick, passiveLiquidity);

						expect(pool.slot0.tick).toBe(startingTick.toString());
						expect(pool.slot0.sqrtPriceX96).toBe(startingPrice.toString());

						return {
							context: swapContext,
							module,
							createMethodContext,
							tokenMethod,
							config,
							pool,
							swapExact0For1,
							mint,
							swapToHigherPrice,
							swapToLowerPrice,
							swapExact1For0,
							tester,
						};
					};

					let swapExact0For1: SwapFunction;
					let swapToHigherPrice: SwapFunction;
					let swapToLowerPrice: SwapFunction;
					let swapExact1For0: SwapFunction;
					let pool: SwaptoshiPool;
					let mint: MintFunction;
					let tester: SwapTest;

					beforeEach(async () => {
						({
							module,
							createMethodContext,
							tokenMethod,
							config,
							swapExact0For1,
							pool,
							mint,
							swapToHigherPrice,
							swapToLowerPrice,
							swapExact1For0,
							tester,
						} = await arbTestFixture());
					});

					async function simulateSwap(
						zeroForOne: boolean,
						amountSpecified: string,
						sqrtPriceLimitX96?: string,
					): Promise<{
						executionPrice: Uint;
						nextSqrtRatio: Uint;
						amount0Delta: Uint;
						amount1Delta: Uint;
					}> {
						const token0Before = await tokenMethod.getAvailableBalance(
							createMethodContext(),
							pool.address,
							pool.token0,
						);
						const token1Before = await tokenMethod.getAvailableBalance(
							createMethodContext(),
							pool.address,
							pool.token1,
						);

						const { amount0Delta, amount1Delta, nextSqrtRatio } = await tester.getSwapResult(
							pool.createEmulator(),
							zeroForOne,
							amountSpecified,
							sqrtPriceLimitX96 ??
								(zeroForOne ? MIN_SQRT_RATIO.add(1).toString() : MAX_SQRT_RATIO.sub(1).toString()),
						);

						const amount0DeltaN = Uint.from(amount0Delta);
						const amount1DeltaN = Uint.from(amount1Delta);
						const nextSqrtRatioN = Uint.from(nextSqrtRatio);

						const executionPrice = zeroForOne
							? encodePriceSqrt(amount1DeltaN, amount0DeltaN.mul(-1))
							: encodePriceSqrt(amount1DeltaN.mul(-1), amount0DeltaN);

						TokenRegistry.instance
							.get(pool.token0.toString('hex'))
							?.balance.set(pool.address.toString('hex'), token0Before);
						TokenRegistry.instance
							.get(pool.token1.toString('hex'))
							?.balance.set(pool.address.toString('hex'), token1Before);

						return {
							executionPrice,
							nextSqrtRatio: nextSqrtRatioN,
							amount0Delta: amount0DeltaN,
							amount1Delta: amount1DeltaN,
						};
					}

					for (const { zeroForOne, assumedTruePriceAfterSwap, inputAmount, description } of [
						{
							description:
								'exact input of 10e18 token0 with starting price of 1.0 and true price of 0.98',
							zeroForOne: true,
							inputAmount: expandTo18Decimals(10),
							assumedTruePriceAfterSwap: encodePriceSqrt(98, 100),
						},
						{
							description:
								'exact input of 10e18 token0 with starting price of 1.0 and true price of 1.01',
							zeroForOne: true,
							inputAmount: expandTo18Decimals(10),
							assumedTruePriceAfterSwap: encodePriceSqrt(101, 100),
						},
					]) {
						describe(description, () => {
							function valueToken1(arbBalance0: Uint, arbBalance1: Uint) {
								return assumedTruePriceAfterSwap
									.mul(assumedTruePriceAfterSwap)
									.mul(arbBalance0)
									.div(Uint.from(2).pow(192))
									.add(arbBalance1);
							}

							it('not sandwiched', async () => {
								const { executionPrice, amount1Delta, amount0Delta } = await simulateSwap(
									zeroForOne,
									inputAmount.toString(),
								);
								zeroForOne
									? await swapExact0For1(inputAmount, sender)
									: await swapExact1For0(inputAmount, sender);
								expect({
									executionPrice: formatPrice(executionPrice),
									amount0Delta: formatTokenAmount(amount0Delta),
									amount1Delta: formatTokenAmount(amount1Delta),
									priceAfter: formatPrice(pool.slot0.sqrtPriceX96),
								}).toMatchSnapshot();
							});

							it('sandwiched with swap to execution price then mint max liquidity/target/burn max liquidity', async () => {
								const { executionPrice } = await simulateSwap(zeroForOne, inputAmount.toString());

								const firstTickAboveMarginalPrice = zeroForOne
									? Math.ceil(
											Uint.from(
												tickMath.getTickAtSqrtRatio(
													applySqrtRatioBipsHundredthsDelta(
														executionPrice,
														parseInt(feeAmount, 10),
													).toString(),
												),
											)
												.div(tickSpacing)
												.toNumber(),
									  ) * parseInt(tickSpacing, 10)
									: Math.floor(
											Uint.from(
												tickMath.getTickAtSqrtRatio(
													applySqrtRatioBipsHundredthsDelta(
														executionPrice,
														-parseInt(feeAmount, 10),
													).toString(),
												),
											)
												.div(tickSpacing)
												.toNumber(),
									  ) * parseInt(tickSpacing, 10);
								const tickAfterFirstTickAboveMarginPrice = zeroForOne
									? firstTickAboveMarginalPrice - parseInt(tickSpacing, 10)
									: firstTickAboveMarginalPrice + parseInt(tickSpacing, 10);

								const priceSwapStart = tickMath.getSqrtRatioAtTick(
									firstTickAboveMarginalPrice.toString(),
								);

								let arbBalance0 = Uint.from(0);
								let arbBalance1 = Uint.from(0);

								// first frontrun to the first tick before the execution price
								const {
									amount0Delta: frontrunDelta0,
									amount1Delta: frontrunDelta1,
									executionPrice: frontrunExecutionPrice,
								} = await simulateSwap(
									zeroForOne,
									Uint256.from(Uint256.MAX).div(2).toString(),
									priceSwapStart,
								);

								arbBalance0 = arbBalance0.sub(frontrunDelta0);
								arbBalance1 = arbBalance1.sub(frontrunDelta1);
								zeroForOne
									? await swapToLowerPrice(priceSwapStart, arbitrageur)
									: await swapToHigherPrice(priceSwapStart, arbitrageur);

								const profitToken1AfterFrontRun = valueToken1(arbBalance0, arbBalance1);

								const tickLower = zeroForOne
									? tickAfterFirstTickAboveMarginPrice
									: firstTickAboveMarginalPrice;
								const tickUpper = zeroForOne
									? firstTickAboveMarginalPrice
									: tickAfterFirstTickAboveMarginPrice;

								// deposit max liquidity at the tick
								const [amount0Mint, amount1Mint] = await mint(
									sender.toString('hex'),
									tickLower,
									tickUpper,
									getMaxLiquidityPerTick(tickSpacing),
								);
								arbBalance0 = arbBalance0.sub(amount0Mint);
								arbBalance1 = arbBalance1.sub(amount1Mint);

								// execute the user's swap
								const { executionPrice: executionPriceAfterFrontrun } = await simulateSwap(
									zeroForOne,
									inputAmount.toString(),
								);
								zeroForOne
									? await swapExact0For1(inputAmount, sender)
									: await swapExact1For0(inputAmount, sender);

								// burn the arb's liquidity
								const [amount0Burn, amount1Burn] = await pool
									.createEmulator()
									.burn(
										tickLower.toString(),
										tickUpper.toString(),
										getMaxLiquidityPerTick(tickSpacing).toString(),
									);
								await pool.burn(
									tickLower.toString(),
									tickUpper.toString(),
									getMaxLiquidityPerTick(tickSpacing).toString(),
								);
								arbBalance0 = arbBalance0.add(amount0Burn);
								arbBalance1 = arbBalance1.add(amount1Burn);

								// add the fees as well
								const [amount0CollectAndBurn, amount1CollectAndBurn] = await pool
									.createEmulator()
									.collect(
										arbitrageur,
										tickLower.toString(),
										tickUpper.toString(),
										Uint128.MAX,
										Uint128.MAX,
									);
								const [amount0Collect, amount1Collect] = [
									Uint128.from(amount0CollectAndBurn).sub(amount0Burn).toString(),
									Uint128.from(amount1CollectAndBurn).sub(amount1Burn).toString(),
								];
								arbBalance0 = arbBalance0.add(amount0Collect);
								arbBalance1 = arbBalance1.add(amount1Collect);

								const profitToken1AfterSandwich = valueToken1(arbBalance0, arbBalance1);

								// backrun the swap to true price, i.e. swap to the marginal price = true price
								const priceToSwapTo = zeroForOne
									? applySqrtRatioBipsHundredthsDelta(
											assumedTruePriceAfterSwap,
											-parseInt(feeAmount, 10),
									  )
									: applySqrtRatioBipsHundredthsDelta(
											assumedTruePriceAfterSwap,
											parseInt(feeAmount, 10),
									  );
								const {
									amount0Delta: backrunDelta0,
									amount1Delta: backrunDelta1,
									executionPrice: backrunExecutionPrice,
								} = await simulateSwap(
									!zeroForOne,
									Uint256.from(Uint256.MAX).div(2).toString(),
									priceToSwapTo.toString(),
								);
								await swapToHigherPrice(priceToSwapTo, sender);
								arbBalance0 = arbBalance0.sub(backrunDelta0);
								arbBalance1 = arbBalance1.sub(backrunDelta1);

								expect({
									sandwichedPrice: formatPrice(executionPriceAfterFrontrun),
									arbBalanceDelta0: formatTokenAmount(arbBalance0),
									arbBalanceDelta1: formatTokenAmount(arbBalance1),
									profit: {
										final: formatTokenAmount(valueToken1(arbBalance0, arbBalance1)),
										afterFrontrun: formatTokenAmount(profitToken1AfterFrontRun),
										afterSandwich: formatTokenAmount(profitToken1AfterSandwich),
									},
									backrun: {
										executionPrice: formatPrice(backrunExecutionPrice),
										delta0: formatTokenAmount(backrunDelta0),
										delta1: formatTokenAmount(backrunDelta1),
									},
									frontrun: {
										executionPrice: formatPrice(frontrunExecutionPrice),
										delta0: formatTokenAmount(frontrunDelta0),
										delta1: formatTokenAmount(frontrunDelta1),
									},
									collect: {
										amount0: formatTokenAmount(amount0Collect),
										amount1: formatTokenAmount(amount1Collect),
									},
									burn: {
										amount0: formatTokenAmount(amount0Burn),
										amount1: formatTokenAmount(amount1Burn),
									},
									mint: {
										amount0: formatTokenAmount(amount0Mint),
										amount1: formatTokenAmount(amount1Mint),
									},
									finalPrice: formatPrice(pool.slot0.sqrtPriceX96),
								}).toMatchSnapshot();
							});

							it('backrun to true price after swap only', async () => {
								let arbBalance0 = Uint.from(0);
								let arbBalance1 = Uint.from(0);

								zeroForOne
									? await swapExact0For1(inputAmount, sender)
									: await swapExact1For0(inputAmount, sender);

								// swap to the marginal price = true price
								const priceToSwapTo = zeroForOne
									? applySqrtRatioBipsHundredthsDelta(
											assumedTruePriceAfterSwap,
											-parseInt(feeAmount, 10),
									  )
									: applySqrtRatioBipsHundredthsDelta(
											assumedTruePriceAfterSwap,
											parseInt(feeAmount, 10),
									  );

								const {
									amount0Delta: backrunDelta0,
									amount1Delta: backrunDelta1,
									executionPrice: backrunExecutionPrice,
								} = await simulateSwap(
									!zeroForOne,
									Uint256.from(Uint256.MAX).div(2).toString(),
									priceToSwapTo.toString(),
								);

								zeroForOne
									? await swapToHigherPrice(priceToSwapTo, sender)
									: await swapToLowerPrice(priceToSwapTo, sender);

								arbBalance0 = arbBalance0.sub(backrunDelta0);
								arbBalance1 = arbBalance1.sub(backrunDelta1);

								expect({
									arbBalanceDelta0: formatTokenAmount(arbBalance0),
									arbBalanceDelta1: formatTokenAmount(arbBalance1),
									profit: {
										final: formatTokenAmount(valueToken1(arbBalance0, arbBalance1)),
									},
									backrun: {
										executionPrice: formatPrice(backrunExecutionPrice),
										delta0: formatTokenAmount(backrunDelta0),
										delta1: formatTokenAmount(backrunDelta1),
									},
									finalPrice: formatPrice(pool.slot0.sqrtPriceX96),
								}).toMatchSnapshot();
							});
						});
					}
				});
			}
		});
	}
});
