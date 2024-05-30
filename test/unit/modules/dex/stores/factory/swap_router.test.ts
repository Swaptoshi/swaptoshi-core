/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-param-reassign */
/* eslint-disable jest/no-standalone-expect */
import { TokenMethod } from 'klayr-sdk';
import { methodSwapContext } from '../../../../../../src/app/modules/dex/stores/context';
import {
	NonfungiblePositionManager,
	SwapRouter,
} from '../../../../../../src/app/modules/dex/stores/factory';
import { Uint } from '../../../../../../src/app/modules/dex/stores/library/int';
import { PoolStore } from '../../../../../../src/app/modules/dex/stores/pool';
import { PositionManagerStore } from '../../../../../../src/app/modules/dex/stores/position_manager';
import { MutableSwapContext } from '../../../../../../src/app/modules/dex/types';
import { methodContextFixture } from '../shared/module';
import { encodePath } from '../shared/path';
import { NATIVE_TOKEN_ID, completeFixture } from '../shared/pool';
import {
	expandTo18Decimals,
	FeeAmount,
	encodePriceSqrt,
	getMinTick,
	TICK_SPACINGS,
	getMaxTick,
} from '../shared/utilities';
import { mock_token_transfer } from '../shared/token';
import { fallbackTokenSymbol } from '../../utils/token';

// const TIMEOUT = 40000;
const sender = Buffer.from('0000000000000000000000000000000000000001', 'hex');
const trader = Buffer.from('0000000000000000000000000000000000000002', 'hex');

type Fixture<T> = (sender: Buffer) => Promise<T>;

interface Tokens {
	address: Buffer;
	symbol: () => string;
	decimals: () => string;
}

describe('SwapRouter', () => {
	const swapRouterFixture: Fixture<{
		router: SwapRouter;
		nft: NonfungiblePositionManager;
		tokens: [Tokens, Tokens, Tokens];
	}> = async (_sender: Buffer) => {
		const {
			module,
			createMethodContext,
			poolStore: _poolStore,
			tokenMethod: _tokenMethod,
		} = await methodContextFixture();
		tokenMethod = _tokenMethod;
		poolStore = _poolStore;
		context = methodSwapContext(createMethodContext(), _sender, 0);
		const {
			token0,
			token1,
			token2,
			token0Decimal,
			token0Symbol,
			token1Decimal,
			token1Symbol,
			token2Decimal,
			token2Symbol,
		} = await completeFixture(context, module);
		const router = poolStore.getMutableRouter(context);

		const _pool = await poolStore.createPool(
			context,
			token0,
			token0Symbol,
			parseInt(token0Decimal, 10),
			token1,
			token1Symbol,
			parseInt(token1Decimal, 10),
			FeeAmount.MEDIUM,
		);
		await _pool.initialize(encodePriceSqrt(1, 1).toString());

		const positionManagerStore = module.stores.get(PositionManagerStore);
		const nft = await positionManagerStore.getMutablePositionManager(context, _pool.address);

		const _tokens: [Tokens, Tokens, Tokens] = [
			{ address: token0, symbol: () => token0Symbol, decimals: () => token0Decimal },
			{ address: token1, symbol: () => token1Symbol, decimals: () => token1Decimal },
			{ address: token2, symbol: () => token2Symbol, decimals: () => token2Decimal },
		];

		_tokens.sort((a, b) =>
			a.address.toString('hex').toLowerCase() < b.address.toString('hex').toLowerCase() ? -1 : 1,
		);

		for (const token of _tokens) {
			await tokenMethod.transfer(
				context.context,
				_sender,
				trader,
				token.address,
				expandTo18Decimals(1_000_000).toBigInt(),
			);
		}

		return {
			router,
			tokens: _tokens,
			nft,
		} as any;
	};

	let tokenMethod: TokenMethod;
	let context: MutableSwapContext;
	let poolStore: PoolStore;
	let router: SwapRouter;
	let nft: NonfungiblePositionManager;
	let tokens: [Tokens, Tokens, Tokens];

	async function getPool(tokenA: Buffer, tokenB: Buffer, fee: string) {
		return poolStore.getMutablePool(context, tokenA, tokenB, fee);
	}

	let getBalances: (who: Buffer) => Promise<{
		native: Uint;
		token0: Uint;
		token1: Uint;
		token2: Uint;
	}>;

	// helper for getting weth and token balances
	beforeEach(async () => {
		({ router, tokens, nft } = await swapRouterFixture(sender));
		await tokenMethod.mint(context.context, trader, NATIVE_TOKEN_ID, BigInt(3000000));

		getBalances = async (who: Buffer) => {
			const balances = await Promise.all([
				await tokenMethod.getAvailableBalance(context.context, who, NATIVE_TOKEN_ID),
				await tokenMethod.getAvailableBalance(context.context, who, tokens[0].address),
				await tokenMethod.getAvailableBalance(context.context, who, tokens[1].address),
				await tokenMethod.getAvailableBalance(context.context, who, tokens[2].address),
			]);
			return {
				native: Uint.from(balances[0]),
				token0: Uint.from(balances[1]),
				token1: Uint.from(balances[2]),
				token2: Uint.from(balances[3]),
			};
		};
	});

	// ensure the swap router never ends up with a balance
	afterEach(async () => {
		const balances = await getBalances(router.address);
		expect(Object.values(balances).every(b => b.eq(0))).toBe(true);
		const balance = await tokenMethod.getAvailableBalance(
			context.context,
			router.address,
			NATIVE_TOKEN_ID,
		);
		expect(balance === BigInt(0)).toBe(true);
		await tokenMethod.burn(
			context.context,
			trader,
			NATIVE_TOKEN_ID,
			await tokenMethod.getAvailableBalance(context.context, sender, NATIVE_TOKEN_ID),
		);
	});

	afterEach(jest.clearAllMocks);

	describe('swaps', () => {
		const liquidity = 1000000;
		async function createPool(tokenAddressA: string, tokenAddressB: string) {
			if (tokenAddressA.toLowerCase() > tokenAddressB.toLowerCase())
				[tokenAddressA, tokenAddressB] = [tokenAddressB, tokenAddressA];

			await nft.createAndInitializePoolIfNecessary(
				Buffer.from(tokenAddressA, 'hex'),
				fallbackTokenSymbol(Buffer.from(tokenAddressA, 'hex'), 'TKNA'),
				8,
				Buffer.from(tokenAddressB, 'hex'),
				fallbackTokenSymbol(Buffer.from(tokenAddressB, 'hex'), 'TKNB'),
				8,
				FeeAmount.MEDIUM,
				encodePriceSqrt(1, 1).toString(),
			);

			const liquidityParams = {
				token0: Buffer.from(tokenAddressA, 'hex'),
				token1: Buffer.from(tokenAddressB, 'hex'),
				fee: FeeAmount.MEDIUM,
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				recipient: sender,
				amount0Desired: '1000000',
				amount1Desired: '1000000',
				amount0Min: '0',
				amount1Min: '0',
				deadline: '1',
			};

			return nft.mint(liquidityParams);
		}

		async function createPoolNative(tokenAddress: string) {
			await tokenMethod.mint(context.context, trader, NATIVE_TOKEN_ID, BigInt(liquidity));
			return createPool(NATIVE_TOKEN_ID.toString('hex'), tokenAddress);
		}

		beforeEach(async () => {
			await createPool(tokens[0].address.toString('hex'), tokens[1].address.toString('hex'));
			await createPool(tokens[1].address.toString('hex'), tokens[2].address.toString('hex'));
			router.setSender(sender);
		});

		describe('#exactInput', () => {
			async function exactInput(
				_tokens: Buffer[],
				amountIn = 3,
				amountOutMinimum = 1,
			): Promise<void> {
				const inputIsWETH = NATIVE_TOKEN_ID.compare(_tokens[0]) === 0;

				const outputIsWETH9 = NATIVE_TOKEN_ID.compare(_tokens[_tokens.length - 1]) === 0;
				const value = inputIsWETH ? amountIn : 0;

				const params = {
					path: encodePath(_tokens, new Array(_tokens.length - 1).fill(FeeAmount.MEDIUM)),
					recipient: outputIsWETH9 ? Buffer.alloc(20) : trader,
					deadline: '1',
					amountIn: amountIn.toString(),
					amountOutMinimum: amountOutMinimum.toString(),
				};

				// optimized for the gas test
				await tokenMethod.transfer(
					context.context,
					trader,
					router.address,
					NATIVE_TOKEN_ID,
					BigInt(value),
				);

				router.setSender(trader);
				await router.exactInput(params);
				router.setSender(sender);
			}

			it('should fail if the limit is any tighter', async () => {
				const token = tokens.slice(0, 2).map(_token => _token.address);
				const amountIn = 3;
				const amountOutMinimum = 1;

				const outputIsWETH9 = NATIVE_TOKEN_ID.compare(token[token.length - 1]) === 0;

				const params = {
					path: encodePath(token, new Array(token.length - 1).fill(FeeAmount.MEDIUM)),
					recipient: outputIsWETH9 ? Buffer.alloc(20) : trader,
					deadline: '1',
					amountIn: amountIn.toString(),
					amountOutMinimum: amountOutMinimum.toString(),
				};

				// ensure that the swap fails if the limit is any tighter
				params.amountOutMinimum = (parseInt(params.amountOutMinimum, 10) + 1).toString();
				await expect(
					(async () => {
						router.setSender(trader);
						await router.exactInput(params);
					})(),
				).rejects.toThrow('Too little received');
			});

			describe('single-pool', () => {
				it('0 -> 1', async () => {
					const pool = await getPool(tokens[0].address, tokens[1].address, FeeAmount.MEDIUM);

					// get balances before
					const poolBefore = await getBalances(pool.address);
					const traderBefore = await getBalances(trader);

					await exactInput(tokens.slice(0, 2).map(token => token.address));

					// get balances after
					const poolAfter = await getBalances(pool.address);
					const traderAfter = await getBalances(trader);

					expect(traderAfter.token0).toStrictEqual(traderBefore.token0.sub(3));
					expect(traderAfter.token1).toStrictEqual(traderBefore.token1.add(1));
					expect(poolAfter.token0).toStrictEqual(poolBefore.token0.add(3));
					expect(poolAfter.token1).toStrictEqual(poolBefore.token1.sub(1));
				});

				it('1 -> 0', async () => {
					const pool = await getPool(tokens[1].address, tokens[0].address, FeeAmount.MEDIUM);

					// get balances before
					const poolBefore = await getBalances(pool.address);
					const traderBefore = await getBalances(trader);

					await exactInput(
						tokens
							.slice(0, 2)
							.reverse()
							.map(token => token.address),
					);

					// get balances after
					const poolAfter = await getBalances(pool.address);
					const traderAfter = await getBalances(trader);

					expect(traderAfter.token0).toStrictEqual(traderBefore.token0.add(1));
					expect(traderAfter.token1).toStrictEqual(traderBefore.token1.sub(3));
					expect(poolAfter.token0).toStrictEqual(poolBefore.token0.sub(1));
					expect(poolAfter.token1).toStrictEqual(poolBefore.token1.add(3));
				});
			});

			describe('multi-pool', () => {
				it('0 -> 1 -> 2', async () => {
					const traderBefore = await getBalances(trader);

					await exactInput(
						tokens.map(token => token.address),
						5,
						1,
					);

					const traderAfter = await getBalances(trader);

					expect(traderAfter.token0).toStrictEqual(traderBefore.token0.sub(5));
					expect(traderAfter.token2).toStrictEqual(traderBefore.token2.add(1));
				});

				it('2 -> 1 -> 0', async () => {
					const traderBefore = await getBalances(trader);

					await exactInput(tokens.map(token => token.address).reverse(), 5, 1);

					const traderAfter = await getBalances(trader);

					expect(traderAfter.token2).toStrictEqual(traderBefore.token2.sub(5));
					expect(traderAfter.token0).toStrictEqual(traderBefore.token0.add(1));
				});

				it('events', async () => {
					await exactInput(
						tokens.map(token => token.address),
						5,
						1,
					);

					expect(mock_token_transfer).toHaveBeenCalledWith(
						trader.toString('hex'),
						(
							await getPool(tokens[0].address, tokens[1].address, FeeAmount.MEDIUM)
						).address.toString('hex'),
						'5',
					);

					expect(mock_token_transfer).toHaveBeenCalledWith(
						(
							await getPool(tokens[0].address, tokens[1].address, FeeAmount.MEDIUM)
						).address.toString('hex'),
						router.address.toString('hex'),
						'3',
					);

					expect(mock_token_transfer).toHaveBeenCalledWith(
						router.address.toString('hex'),
						(
							await getPool(tokens[1].address, tokens[2].address, FeeAmount.MEDIUM)
						).address.toString('hex'),
						'3',
					);

					expect(mock_token_transfer).toHaveBeenCalledWith(
						(
							await getPool(tokens[1].address, tokens[2].address, FeeAmount.MEDIUM)
						).address.toString('hex'),
						trader.toString('hex'),
						'1',
					);
				});

				describe('ETH input', () => {
					describe('WETH9', () => {
						beforeEach(async () => {
							await createPoolNative(tokens[0].address.toString('hex'));
						});

						it('WETH9 -> 0', async () => {
							const pool = await getPool(NATIVE_TOKEN_ID, tokens[0].address, FeeAmount.MEDIUM);

							// get balances before
							const poolBefore = await getBalances(pool.address);
							const traderBefore = await getBalances(trader);

							await exactInput([NATIVE_TOKEN_ID, tokens[0].address]);

							// get balances after
							const poolAfter = await getBalances(pool.address);
							const traderAfter = await getBalances(trader);

							expect(traderAfter.token0).toStrictEqual(traderBefore.token0.add(1));
							expect(poolAfter.native).toStrictEqual(poolBefore.native.add(3));
							expect(poolAfter.token0).toStrictEqual(poolBefore.token0.sub(1));
						});

						it('WETH9 -> 0 -> 1', async () => {
							const traderBefore = await getBalances(trader);

							await exactInput([NATIVE_TOKEN_ID, tokens[0].address, tokens[1].address], 5);

							const traderAfter = await getBalances(trader);

							expect(traderAfter.token1).toStrictEqual(traderBefore.token1.add(1));
						});
					});
				});

				describe('ETH output', () => {
					describe('WETH9', () => {
						beforeEach(async () => {
							await createPoolNative(tokens[0].address.toString('hex'));
							await createPoolNative(tokens[1].address.toString('hex'));
						});

						it('0 -> WETH9', async () => {
							const pool = await getPool(tokens[0].address, NATIVE_TOKEN_ID, FeeAmount.MEDIUM);

							// get balances before
							const poolBefore = await getBalances(pool.address);
							const traderBefore = await getBalances(trader);

							await exactInput([tokens[0].address, NATIVE_TOKEN_ID]);

							// get balances after
							const poolAfter = await getBalances(pool.address);
							const traderAfter = await getBalances(trader);

							expect(traderAfter.token0).toStrictEqual(traderBefore.token0.sub(3));
							expect(poolAfter.native).toStrictEqual(poolBefore.native.sub(1));
							expect(poolAfter.token0).toStrictEqual(poolBefore.token0.add(3));
						});

						it('0 -> 1 -> WETH9', async () => {
							// get balances before
							const traderBefore = await getBalances(trader);

							await exactInput([tokens[0].address, tokens[1].address, NATIVE_TOKEN_ID], 5);

							// get balances after
							const traderAfter = await getBalances(trader);

							expect(traderAfter.token0).toStrictEqual(traderBefore.token0.sub(5));
						});
					});
				});
			});
		});

		describe('#exactInputSingle', () => {
			async function exactInputSingle(
				tokenIn: Buffer,
				tokenOut: Buffer,
				amountIn = 3,
				amountOutMinimum = 1,
				sqrtPriceLimitX96?: Uint,
			): Promise<void> {
				const inputIsWETH = NATIVE_TOKEN_ID.compare(tokenIn) === 0;
				const outputIsWETH9 = tokenOut.compare(NATIVE_TOKEN_ID) === 0;

				const value = inputIsWETH ? amountIn : 0;

				const params = {
					tokenIn,
					tokenOut,
					fee: FeeAmount.MEDIUM,
					sqrtPriceLimitX96:
						sqrtPriceLimitX96 ??
						tokenIn.toString('hex').toLowerCase() < tokenOut.toString('hex').toLowerCase()
							? Uint.from('4295128740').toString()
							: Uint.from('1461446703485210103287273052203988822378723970341').toString(),
					recipient: outputIsWETH9 ? Buffer.alloc(20) : trader,
					deadline: '1',
					amountIn: amountIn.toString(),
					amountOutMinimum: amountOutMinimum.toString(),
				};

				// optimized for the gas test
				await tokenMethod.transfer(
					context.context,
					trader,
					router.address,
					NATIVE_TOKEN_ID,
					BigInt(value),
				);
				router.setSender(trader);
				await router.exactInputSingle(params);
				router.setSender(sender);
			}

			it('should fail if the limit is any tighter', async () => {
				const [tokenIn, tokenOut, amountIn, amountOutMinimum] = [
					tokens[0].address,
					tokens[1].address,
					3,
					1,
				];
				const outputIsWETH9 = tokenOut.compare(NATIVE_TOKEN_ID) === 0;

				const params = {
					tokenIn,
					tokenOut,
					fee: FeeAmount.MEDIUM,
					sqrtPriceLimitX96:
						tokenIn.toString('hex').toLowerCase() < tokenOut.toString('hex').toLowerCase()
							? Uint.from('4295128740').toString()
							: Uint.from('1461446703485210103287273052203988822378723970341').toString(),
					recipient: outputIsWETH9 ? Buffer.alloc(20) : trader,
					deadline: '1',
					amountIn: amountIn.toString(),
					amountOutMinimum: amountOutMinimum.toString(),
				};

				// ensure that the swap fails if the limit is any tighter
				params.amountOutMinimum = (parseInt(params.amountOutMinimum, 10) + 1).toString();
				await expect(
					(async () => {
						router.setSender(trader);
						await router.exactInputSingle(params);
					})(),
				).rejects.toThrow('Too little received');
				router.setSender(sender);
			});

			it('0 -> 1', async () => {
				const pool = await getPool(tokens[0].address, tokens[1].address, FeeAmount.MEDIUM);

				// get balances before
				const poolBefore = await getBalances(pool.address);
				const traderBefore = await getBalances(trader);

				await exactInputSingle(tokens[0].address, tokens[1].address);

				// get balances after
				const poolAfter = await getBalances(pool.address);
				const traderAfter = await getBalances(trader);

				expect(traderAfter.token0).toStrictEqual(traderBefore.token0.sub(3));
				expect(traderAfter.token1).toStrictEqual(traderBefore.token1.add(1));
				expect(poolAfter.token0).toStrictEqual(poolBefore.token0.add(3));
				expect(poolAfter.token1).toStrictEqual(poolBefore.token1.sub(1));
			});

			it('1 -> 0', async () => {
				const pool = await getPool(tokens[1].address, tokens[0].address, FeeAmount.MEDIUM);

				// get balances before
				const poolBefore = await getBalances(pool.address);
				const traderBefore = await getBalances(trader);

				await exactInputSingle(tokens[1].address, tokens[0].address);

				// get balances after
				const poolAfter = await getBalances(pool.address);
				const traderAfter = await getBalances(trader);

				expect(traderAfter.token0).toStrictEqual(traderBefore.token0.add(1));
				expect(traderAfter.token1).toStrictEqual(traderBefore.token1.sub(3));
				expect(poolAfter.token0).toStrictEqual(poolBefore.token0.sub(1));
				expect(poolAfter.token1).toStrictEqual(poolBefore.token1.add(3));
			});

			describe('ETH input', () => {
				describe('WETH9', () => {
					beforeEach(async () => {
						await createPoolNative(tokens[0].address.toString('hex'));
					});

					it('WETH9 -> 0', async () => {
						const pool = await getPool(NATIVE_TOKEN_ID, tokens[0].address, FeeAmount.MEDIUM);

						// get balances before
						const poolBefore = await getBalances(pool.address);
						const traderBefore = await getBalances(trader);

						await exactInputSingle(NATIVE_TOKEN_ID, tokens[0].address);

						// get balances after
						const poolAfter = await getBalances(pool.address);
						const traderAfter = await getBalances(trader);

						expect(traderAfter.token0).toStrictEqual(traderBefore.token0.add(1));
						expect(poolAfter.native).toStrictEqual(poolBefore.native.add(3));
						expect(poolAfter.token0).toStrictEqual(poolBefore.token0.sub(1));
					});
				});
			});

			describe('ETH output', () => {
				describe('WETH9', () => {
					beforeEach(async () => {
						await createPoolNative(tokens[0].address.toString('hex'));
						await createPoolNative(tokens[1].address.toString('hex'));
					});

					it('0 -> WETH9', async () => {
						const pool = await getPool(tokens[0].address, NATIVE_TOKEN_ID, FeeAmount.MEDIUM);

						// get balances before
						const poolBefore = await getBalances(pool.address);
						const traderBefore = await getBalances(trader);

						await exactInputSingle(tokens[0].address, NATIVE_TOKEN_ID);

						// get balances after
						const poolAfter = await getBalances(pool.address);
						const traderAfter = await getBalances(trader);

						expect(traderAfter.token0).toStrictEqual(traderBefore.token0.sub(3));
						expect(poolAfter.native).toStrictEqual(poolBefore.native.sub(1));
						expect(poolAfter.token0).toStrictEqual(poolBefore.token0.add(3));
					});
				});
			});
		});

		describe('#exactOutput', () => {
			async function exactOutput(
				_tokens: Buffer[],
				amountOut = 1,
				amountInMaximum = 3,
			): Promise<void> {
				const inputIsWETH9 = _tokens[0].compare(NATIVE_TOKEN_ID) === 0;
				const outputIsWETH9 = _tokens[_tokens.length - 1].compare(NATIVE_TOKEN_ID) === 0;

				const value = inputIsWETH9 ? amountInMaximum : 0;

				const params = {
					path: encodePath(
						_tokens.slice().reverse(),
						new Array(_tokens.length - 1).fill(FeeAmount.MEDIUM),
					),
					recipient: outputIsWETH9 ? Buffer.alloc(20) : trader,
					deadline: '1',
					amountOut: amountOut.toString(),
					amountInMaximum: amountInMaximum.toString(),
				};

				await tokenMethod.transfer(
					context.context,
					trader,
					router.address,
					NATIVE_TOKEN_ID,
					BigInt(value),
				);
				router.setSender(trader);
				await router.exactOutput(params);
			}

			it('should fail if the limit is any tighter', async () => {
				const token = tokens.slice(0, 2).map(_token => _token.address);
				const amountOut = 1;
				const amountInMaximum = 3;

				const outputIsWETH9 = token[token.length - 1] === NATIVE_TOKEN_ID;

				const params = {
					path: encodePath(
						token.slice().reverse(),
						new Array(token.length - 1).fill(FeeAmount.MEDIUM),
					),
					recipient: outputIsWETH9 ? Buffer.alloc(20) : trader,
					deadline: '1',
					amountOut: amountOut.toString(),
					amountInMaximum: amountInMaximum.toString(),
				};

				// ensure that the swap fails if the limit is any tighter
				params.amountInMaximum = (parseInt(params.amountInMaximum, 10) - 1).toString();
				await expect(
					(async () => {
						router.setSender(trader);
						await router.exactOutput(params);
					})(),
				).rejects.toThrow('Too much requested');
				router.setSender(sender);
			});

			describe('single-pool', () => {
				it('0 -> 1', async () => {
					const pool = await getPool(tokens[0].address, tokens[1].address, FeeAmount.MEDIUM);

					// get balances before
					const poolBefore = await getBalances(pool.address);
					const traderBefore = await getBalances(trader);

					await exactOutput(tokens.slice(0, 2).map(token => token.address));

					// get balances after
					const poolAfter = await getBalances(pool.address);
					const traderAfter = await getBalances(trader);

					expect(traderAfter.token0).toStrictEqual(traderBefore.token0.sub(3));
					expect(traderAfter.token1).toStrictEqual(traderBefore.token1.add(1));
					expect(poolAfter.token0).toStrictEqual(poolBefore.token0.add(3));
					expect(poolAfter.token1).toStrictEqual(poolBefore.token1.sub(1));
				});

				it('1 -> 0', async () => {
					const pool = await getPool(tokens[1].address, tokens[0].address, FeeAmount.MEDIUM);

					// get balances before
					const poolBefore = await getBalances(pool.address);
					const traderBefore = await getBalances(trader);

					await exactOutput(
						tokens
							.slice(0, 2)
							.reverse()
							.map(token => token.address),
					);

					// get balances after
					const poolAfter = await getBalances(pool.address);
					const traderAfter = await getBalances(trader);

					expect(traderAfter.token0).toStrictEqual(traderBefore.token0.add(1));
					expect(traderAfter.token1).toStrictEqual(traderBefore.token1.sub(3));
					expect(poolAfter.token0).toStrictEqual(poolBefore.token0.sub(1));
					expect(poolAfter.token1).toStrictEqual(poolBefore.token1.add(3));
				});
			});

			describe('multi-pool', () => {
				it('0 -> 1 -> 2', async () => {
					const traderBefore = await getBalances(trader);

					await exactOutput(
						tokens.map(token => token.address),
						1,
						5,
					);

					const traderAfter = await getBalances(trader);

					expect(traderAfter.token0).toStrictEqual(traderBefore.token0.sub(5));
					expect(traderAfter.token2).toStrictEqual(traderBefore.token2.add(1));
				});

				it('2 -> 1 -> 0', async () => {
					const traderBefore = await getBalances(trader);

					await exactOutput(tokens.map(token => token.address).reverse(), 1, 5);

					const traderAfter = await getBalances(trader);

					expect(traderAfter.token2).toStrictEqual(traderBefore.token2.sub(5));
					expect(traderAfter.token0).toStrictEqual(traderBefore.token0.add(1));
				});

				it('events', async () => {
					await exactOutput(
						tokens.map(token => token.address),
						1,
						5,
					);

					expect(mock_token_transfer).toHaveBeenCalledWith(
						(
							await getPool(tokens[2].address, tokens[1].address, FeeAmount.MEDIUM)
						).address.toString('hex'),
						trader.toString('hex'),
						'1',
					);

					expect(mock_token_transfer).toHaveBeenCalledWith(
						(
							await getPool(tokens[1].address, tokens[0].address, FeeAmount.MEDIUM)
						).address.toString('hex'),
						(
							await getPool(tokens[2].address, tokens[1].address, FeeAmount.MEDIUM)
						).address.toString('hex'),
						'3',
					);

					expect(mock_token_transfer).toHaveBeenCalledWith(
						trader.toString('hex'),
						(
							await getPool(tokens[1].address, tokens[0].address, FeeAmount.MEDIUM)
						).address.toString('hex'),
						'5',
					);
				});
			});

			describe('ETH input', () => {
				describe('WETH9', () => {
					beforeEach(async () => {
						await createPoolNative(tokens[0].address.toString('hex'));
					});

					it('WETH9 -> 0', async () => {
						const pool = await getPool(NATIVE_TOKEN_ID, tokens[0].address, FeeAmount.MEDIUM);

						// get balances before
						const poolBefore = await getBalances(pool.address);
						const traderBefore = await getBalances(trader);

						await exactOutput([NATIVE_TOKEN_ID, tokens[0].address]);

						// get balances after
						const poolAfter = await getBalances(pool.address);
						const traderAfter = await getBalances(trader);

						expect(traderAfter.token0).toStrictEqual(traderBefore.token0.add(1));
						expect(poolAfter.native).toStrictEqual(poolBefore.native.add(3));
						expect(poolAfter.token0).toStrictEqual(poolBefore.token0.sub(1));
					});

					it('WETH9 -> 0 -> 1', async () => {
						const traderBefore = await getBalances(trader);

						await exactOutput([NATIVE_TOKEN_ID, tokens[0].address, tokens[1].address], 1, 5);

						const traderAfter = await getBalances(trader);

						expect(traderAfter.token1).toStrictEqual(traderBefore.token1.add(1));
					});
				});
			});

			describe('ETH output', () => {
				describe('WETH9', () => {
					beforeEach(async () => {
						await createPoolNative(tokens[0].address.toString('hex'));
						await createPoolNative(tokens[1].address.toString('hex'));
					});

					it('0 -> WETH9', async () => {
						const pool = await getPool(tokens[0].address, NATIVE_TOKEN_ID, FeeAmount.MEDIUM);

						// get balances before
						const poolBefore = await getBalances(pool.address);
						const traderBefore = await getBalances(trader);

						await exactOutput([tokens[0].address, NATIVE_TOKEN_ID]);

						// get balances after
						const poolAfter = await getBalances(pool.address);
						const traderAfter = await getBalances(trader);

						expect(traderAfter.token0).toStrictEqual(traderBefore.token0.sub(3));
						expect(poolAfter.native).toStrictEqual(poolBefore.native.sub(1));
						expect(poolAfter.token0).toStrictEqual(poolBefore.token0.add(3));
					});

					it('0 -> 1 -> WETH9', async () => {
						// get balances before
						const traderBefore = await getBalances(trader);

						await exactOutput([tokens[0].address, tokens[1].address, NATIVE_TOKEN_ID], 1, 5);

						// get balances after
						const traderAfter = await getBalances(trader);

						expect(traderAfter.token0).toStrictEqual(traderBefore.token0.sub(5));
					});
				});
			});
		});

		describe('#exactOutputSingle', () => {
			async function exactOutputSingle(
				tokenIn: Buffer,
				tokenOut: Buffer,
				amountOut = 1,
				amountInMaximum = 3,
				sqrtPriceLimitX96?: Uint,
			): Promise<void> {
				const inputIsWETH9 = tokenIn.compare(NATIVE_TOKEN_ID) === 0;
				const outputIsWETH9 = tokenOut.compare(NATIVE_TOKEN_ID) === 0;

				const value = inputIsWETH9 ? amountInMaximum : 0;

				const params = {
					tokenIn,
					tokenOut,
					fee: FeeAmount.MEDIUM,
					recipient: outputIsWETH9 ? Buffer.alloc(20) : trader,
					deadline: '1',
					amountOut: amountOut.toString(),
					amountInMaximum: amountInMaximum.toString(),
					sqrtPriceLimitX96:
						sqrtPriceLimitX96 ??
						tokenIn.toString('hex').toLowerCase() < tokenOut.toString('hex').toLowerCase()
							? Uint.from('4295128740').toString()
							: Uint.from('1461446703485210103287273052203988822378723970341').toString(),
				};

				await tokenMethod.transfer(
					context.context,
					trader,
					router.address,
					NATIVE_TOKEN_ID,
					BigInt(value),
				);
				router.setSender(trader);
				await router.exactOutputSingle(params);
				router.setSender(sender);
			}

			it('should fail if the limit is any tighter', async () => {
				const tokenIn = tokens[0].address;
				const tokenOut = tokens[1].address;
				const amountOut = 1;
				const amountInMaximum = 3;
				const outputIsWETH9 = tokenOut.compare(NATIVE_TOKEN_ID) === 0;

				const params = {
					tokenIn,
					tokenOut,
					fee: FeeAmount.MEDIUM,
					recipient: outputIsWETH9 ? Buffer.alloc(20) : trader,
					deadline: '1',
					amountOut: amountOut.toString(),
					amountInMaximum: amountInMaximum.toString(),
					sqrtPriceLimitX96:
						tokenIn.toString('hex').toLowerCase() < tokenOut.toString('hex').toLowerCase()
							? Uint.from('4295128740').toString()
							: Uint.from('1461446703485210103287273052203988822378723970341').toString(),
				};

				// ensure that the swap fails if the limit is any tighter
				params.amountInMaximum = (parseInt(params.amountInMaximum, 10) - 1).toString();
				await expect(
					(async () => {
						router.setSender(trader);
						await router.exactOutputSingle(params);
					})(),
				).rejects.toThrow('Too much requested');
				router.setSender(sender);
			});

			it('0 -> 1', async () => {
				const pool = await getPool(tokens[0].address, tokens[1].address, FeeAmount.MEDIUM);

				// get balances before
				const poolBefore = await getBalances(pool.address);
				const traderBefore = await getBalances(trader);

				await exactOutputSingle(tokens[0].address, tokens[1].address);

				// get balances after
				const poolAfter = await getBalances(pool.address);
				const traderAfter = await getBalances(trader);

				expect(traderAfter.token0).toStrictEqual(traderBefore.token0.sub(3));
				expect(traderAfter.token1).toStrictEqual(traderBefore.token1.add(1));
				expect(poolAfter.token0).toStrictEqual(poolBefore.token0.add(3));
				expect(poolAfter.token1).toStrictEqual(poolBefore.token1.sub(1));
			});

			it('1 -> 0', async () => {
				const pool = await getPool(tokens[1].address, tokens[0].address, FeeAmount.MEDIUM);

				// get balances before
				const poolBefore = await getBalances(pool.address);
				const traderBefore = await getBalances(trader);

				await exactOutputSingle(tokens[1].address, tokens[0].address);

				// get balances after
				const poolAfter = await getBalances(pool.address);
				const traderAfter = await getBalances(trader);

				expect(traderAfter.token0).toStrictEqual(traderBefore.token0.add(1));
				expect(traderAfter.token1).toStrictEqual(traderBefore.token1.sub(3));
				expect(poolAfter.token0).toStrictEqual(poolBefore.token0.sub(1));
				expect(poolAfter.token1).toStrictEqual(poolBefore.token1.add(3));
			});

			describe('ETH input', () => {
				describe('WETH9', () => {
					beforeEach(async () => {
						await createPoolNative(tokens[0].address.toString('hex'));
					});

					it('WETH9 -> 0', async () => {
						const pool = await getPool(NATIVE_TOKEN_ID, tokens[0].address, FeeAmount.MEDIUM);

						// get balances before
						const poolBefore = await getBalances(pool.address);
						const traderBefore = await getBalances(trader);

						await exactOutputSingle(NATIVE_TOKEN_ID, tokens[0].address);

						// get balances after
						const poolAfter = await getBalances(pool.address);
						const traderAfter = await getBalances(trader);

						expect(traderAfter.token0).toStrictEqual(traderBefore.token0.add(1));
						expect(poolAfter.native).toStrictEqual(poolBefore.native.add(3));
						expect(poolAfter.token0).toStrictEqual(poolBefore.token0.sub(1));
					});
				});
			});

			describe('ETH output', () => {
				describe('WETH9', () => {
					beforeEach(async () => {
						await createPoolNative(tokens[0].address.toString('hex'));
						await createPoolNative(tokens[1].address.toString('hex'));
					});

					it('0 -> WETH9', async () => {
						const pool = await getPool(tokens[0].address, NATIVE_TOKEN_ID, FeeAmount.MEDIUM);

						// get balances before
						const poolBefore = await getBalances(pool.address);
						const traderBefore = await getBalances(trader);

						await exactOutputSingle(tokens[0].address, NATIVE_TOKEN_ID);

						// get balances after
						const poolAfter = await getBalances(pool.address);
						const traderAfter = await getBalances(trader);

						expect(traderAfter.token0).toStrictEqual(traderBefore.token0.sub(3));
						expect(poolAfter.native).toStrictEqual(poolBefore.native.sub(1));
						expect(poolAfter.token0).toStrictEqual(poolBefore.token0.add(3));
					});
				});
			});
		});
	});
});
