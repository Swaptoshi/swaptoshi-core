/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
import { TokenMethod } from 'klayr-sdk';
import { NonfungiblePositionManager, SwapRouter, DEXPool } from '../../../../../../src/app/modules/dex/stores/factory';
import * as PoolAddress from '../../../../../../src/app/modules/dex/stores/library/periphery/pool_address';
import { completeFixture } from '../shared/pool';
import { MutableSwapContext } from '../../../../../../src/app/modules/dex/types';
import { PoolStore } from '../../../../../../src/app/modules/dex/stores/pool';
import { FeeAmount, MaxUint128, TICK_SPACINGS, encodePriceSqrt, expandTo18Decimals, getMaxTick, getMinTick } from '../shared/utilities';
import { PositionManagerStore } from '../../../../../../src/app/modules/dex/stores/position_manager';
import { methodSwapContext } from '../../../../../../src/app/modules/dex/stores/context';
import { methodContextFixture } from '../shared/module';
import { NFTRegistry } from '../shared/nft/nft_registry';
import { setTime } from '../shared/fixtures/PositionManagerUtilities';
import { mock_token_transfer } from '../shared/token';
import { encodePath } from '../shared/path';
import { TokenRegistry } from '../shared/token/token_registry';
import { fallbackTokenSymbol } from '../../utils/token';

type Fixture<T> = (sender: Buffer) => Promise<T>;

interface Tokens {
	address: Buffer;
	symbol: () => string;
	decimals: () => string;
}

const sender = Buffer.from('0000000000000000000000000000000000000001', 'hex');
const other = Buffer.from('0000000000000000000000000000000000000002', 'hex');

describe('NonfungiblePositionManager', () => {
	const nftFixture: Fixture<{
		nft: NonfungiblePositionManager;
		tokens: [Tokens, Tokens, Tokens];
		pool: DEXPool;
		router: SwapRouter;
	}> = async (_sender: Buffer) => {
		const { module, createMethodContext, poolStore: _poolStore, tokenMethod: _tokenMethod, nftMethod: _nftMethod } = await methodContextFixture();
		tokenMethod = _tokenMethod;
		poolStore = _poolStore;
		context = methodSwapContext(createMethodContext(), _sender, 0);
		const { token0, token1, token2, token0Decimal, token0Symbol, token1Decimal, token1Symbol, token2Decimal, token2Symbol } = await completeFixture(context, module);
		const router = await poolStore.getMutableRouter(context);

		const _pool = await poolStore.createPool(context, token0, token0Symbol, parseInt(token0Decimal, 10), token1, token1Symbol, parseInt(token1Decimal, 10), FeeAmount.MEDIUM);
		await _pool.initialize(encodePriceSqrt(1, 1).toString());

		const positionManagerStore = module.stores.get(PositionManagerStore);
		const nft = await positionManagerStore.getMutablePositionManager(context, _pool.address);

		const _tokens: [Tokens, Tokens, Tokens] = [
			{ address: token0, symbol: () => token0Symbol, decimals: () => token0Decimal },
			{ address: token1, symbol: () => token1Symbol, decimals: () => token1Decimal },
			{ address: token2, symbol: () => token2Symbol, decimals: () => token2Decimal },
		];

		_tokens.sort((a, b) => (a.address.toString('hex').toLowerCase() < b.address.toString('hex').toLowerCase() ? -1 : 1));

		for (const token of _tokens) {
			await tokenMethod.transfer(context.context, _sender, other, token.address, expandTo18Decimals(1_000_000).toBigInt());
		}

		return {
			router,
			tokens: _tokens,
			pool: _pool,
			nft,
		} as any;
	};

	let tokenMethod: TokenMethod;
	let pool: DEXPool;
	let context: MutableSwapContext;
	let poolStore: PoolStore;
	let router: SwapRouter;
	let nft: NonfungiblePositionManager;
	let tokens: [Tokens, Tokens, Tokens];

	function computePoolAddress(token: [tokenA: Buffer, tokenB: Buffer], fee: string) {
		return PoolAddress.computeAddress(PoolAddress.getPoolKey(token[0], token[1], fee));
	}

	async function createPool(tokenA: Buffer, tokenB: Buffer, fee: string) {
		const _pool = await poolStore.createPool(context, tokenA, fallbackTokenSymbol(tokenA, 'TKNA'), 8, tokenB, fallbackTokenSymbol(tokenB, 'TKNB'), 8, fee);
		return _pool;
	}

	beforeEach(async () => {
		({ nft, tokens, pool, router } = await nftFixture(sender));
	});

	afterEach(() => {
		NFTRegistry.reset();
		TokenRegistry.reset();
	});

	describe('#createAndInitializePoolIfNecessary', () => {
		it('creates the pool at the expected address', async () => {
			const expectedAddress = computePoolAddress([tokens[0].address, tokens[1].address], FeeAmount.MEDIUM);
			const _pool = await nft.createAndInitializePoolIfNecessary(
				tokens[0].address,
				tokens[0].symbol(),
				parseInt(tokens[0].decimals(), 10),
				tokens[1].address,
				tokens[1].symbol(),
				parseInt(tokens[1].decimals(), 10),
				FeeAmount.MEDIUM,
				encodePriceSqrt(1, 1).toString(),
			);
			expect(_pool.address.toString('hex')).toBe(expectedAddress.toString('hex'));
		});

		it('works if pool is created but not initialized', async () => {
			const expectedAddress = computePoolAddress([Buffer.from('0000000000000000', 'hex'), tokens[1].address], FeeAmount.MEDIUM);
			const _pool = await createPool(Buffer.from('0000000000000000', 'hex'), tokens[1].address, FeeAmount.MEDIUM);
			expect(_pool.address.toString('hex')).toBe(expectedAddress.toString('hex'));
			await nft.createAndInitializePoolIfNecessary(
				Buffer.from('0000000000000000', 'hex'),
				tokens[0].symbol(),
				parseInt(tokens[0].decimals(), 10),
				tokens[1].address,
				tokens[1].symbol(),
				parseInt(tokens[1].decimals(), 10),
				FeeAmount.MEDIUM,
				encodePriceSqrt(2, 1).toString(),
			);
		});

		it('works if pool is created and initialized', async () => {
			const expectedAddress = computePoolAddress([tokens[0].address, tokens[1].address], FeeAmount.MEDIUM);
			let _pool: DEXPool;
			try {
				_pool = await createPool(tokens[0].address, tokens[1].address, FeeAmount.MEDIUM);
				await _pool.initialize(encodePriceSqrt(3, 1).toString());
			} catch {
				_pool = await poolStore.getMutablePool(context, tokens[0].address, tokens[1].address, FeeAmount.MEDIUM);
			}
			expect(_pool.address.toString('hex')).toBe(expectedAddress.toString('hex'));
			await nft.createAndInitializePoolIfNecessary(
				tokens[0].address,
				tokens[0].symbol(),
				parseInt(tokens[0].decimals(), 10),
				tokens[1].address,
				tokens[1].symbol(),
				parseInt(tokens[1].decimals(), 10),
				FeeAmount.MEDIUM,
				encodePriceSqrt(4, 1).toString(),
			);
		});
	});

	describe('#mint', () => {
		it('fails if pool does not exist', async () => {
			await expect(
				(async () =>
					nft.mint({
						token0: tokens[1].address,
						token1: tokens[2].address,
						tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
						tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
						amount0Desired: '100',
						amount1Desired: '100',
						amount0Min: '0',
						amount1Min: '0',
						recipient: sender,
						deadline: '1',
						fee: FeeAmount.MEDIUM,
					}))(),
			).rejects.toThrow();
		});

		it('creates a token', async () => {
			await nft.createAndInitializePoolIfNecessary(
				tokens[0].address,
				tokens[0].symbol(),
				parseInt(tokens[0].decimals(), 10),
				tokens[1].address,
				tokens[1].symbol(),
				parseInt(tokens[1].decimals(), 10),
				FeeAmount.MEDIUM,
				encodePriceSqrt(1, 1).toString(),
			);

			await nft.mint({
				token0: tokens[0].address,
				token1: tokens[1].address,
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				fee: FeeAmount.MEDIUM,
				recipient: other,
				amount0Desired: '15',
				amount1Desired: '15',
				amount0Min: '0',
				amount1Min: '0',
				deadline: '10',
			});
			expect(NFTRegistry.balanceOf.get(other.toString('hex'))).toBe('1');
			const { fee, token0, token1, tickLower, tickUpper, liquidity, tokensOwed0, tokensOwed1, feeGrowthInside0LastX128, feeGrowthInside1LastX128 } = await nft.getPositions('0');
			expect(token0.toString('hex')).toBe(tokens[0].address.toString('hex'));
			expect(token1.toString('hex')).toBe(tokens[1].address.toString('hex'));
			expect(fee).toBe(FeeAmount.MEDIUM);
			expect(tickLower).toBe(getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString());
			expect(tickUpper).toBe(getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString());
			expect(liquidity).toBe('15');
			expect(tokensOwed0).toBe('0');
			expect(tokensOwed1).toBe('0');
			expect(feeGrowthInside0LastX128).toBe('0');
			expect(feeGrowthInside1LastX128).toBe('0');
		});
	});

	describe('#increaseLiquidity', () => {
		const tokenId = '0';
		beforeEach(async () => {
			await nft.createAndInitializePoolIfNecessary(
				tokens[0].address,
				tokens[0].symbol(),
				parseInt(tokens[0].decimals(), 10),
				tokens[1].address,
				tokens[1].symbol(),
				parseInt(tokens[1].decimals(), 10),
				FeeAmount.MEDIUM,
				encodePriceSqrt(1, 1).toString(),
			);

			await nft.mint({
				token0: tokens[0].address,
				token1: tokens[1].address,
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				fee: FeeAmount.MEDIUM,
				recipient: other,
				amount0Desired: '1000',
				amount1Desired: '1000',
				amount0Min: '0',
				amount1Min: '0',
				deadline: '1',
			});

			nft.setSender(sender);
		});

		it('increases position liquidity', async () => {
			await nft.increaseLiquidity({
				poolAddress: pool.address,
				tokenId,
				amount0Desired: '100',
				amount1Desired: '100',
				amount0Min: '0',
				amount1Min: '0',
				deadline: '1',
			});
			const { liquidity } = await nft.getPositions(tokenId);
			expect(liquidity).toBe('1100');
		});
	});

	describe('#decreaseLiquidity', () => {
		const tokenId = '0';
		beforeEach(async () => {
			await nft.createAndInitializePoolIfNecessary(
				tokens[0].address,
				tokens[0].symbol(),
				parseInt(tokens[0].decimals(), 10),
				tokens[1].address,
				tokens[1].symbol(),
				parseInt(tokens[1].decimals(), 10),
				FeeAmount.MEDIUM,
				encodePriceSqrt(1, 1).toString(),
			);

			await nft.mint({
				token0: tokens[0].address,
				token1: tokens[1].address,
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				fee: FeeAmount.MEDIUM,
				recipient: other,
				amount0Desired: '100',
				amount1Desired: '100',
				amount0Min: '0',
				amount1Min: '0',
				deadline: '1',
			});

			nft.setSender(sender);
		});

		it('fails if past deadline', async () => {
			setTime.bind(nft)('2');
			await expect(
				(async () => {
					nft.setSender(other);
					await nft.decreaseLiquidity({
						poolAddress: pool.address,
						tokenId,
						liquidity: '50',
						amount0Min: '0',
						amount1Min: '0',
						deadline: '1',
					});
				})(),
			).rejects.toThrow('Transaction too old');
		});

		it('cannot be called by other addresses', async () => {
			await expect(
				(async () =>
					nft.decreaseLiquidity({
						poolAddress: pool.address,
						tokenId,
						liquidity: '50',
						amount0Min: '0',
						amount1Min: '0',
						deadline: '1',
					}))(),
			).rejects.toThrow('Not approved');
		});

		it('decreases position liquidity', async () => {
			nft.setSender(other);
			await nft.decreaseLiquidity({
				poolAddress: pool.address,
				tokenId,
				liquidity: '25',
				amount0Min: '0',
				amount1Min: '0',
				deadline: '1',
			});
			const { liquidity } = await nft.getPositions(tokenId);
			expect(liquidity).toBe('75');
		});

		it('accounts for tokens owed', async () => {
			nft.setSender(other);
			await nft.decreaseLiquidity({
				poolAddress: pool.address,
				tokenId,
				liquidity: '25',
				amount0Min: '0',
				amount1Min: '0',
				deadline: '1',
			});
			const { tokensOwed0, tokensOwed1 } = await nft.getPositions(tokenId);
			expect(tokensOwed0).toBe('24');
			expect(tokensOwed1).toBe('24');
		});

		it('can decrease for all the liquidity', async () => {
			nft.setSender(other);
			await nft.decreaseLiquidity({
				poolAddress: pool.address,
				tokenId,
				liquidity: '100',
				amount0Min: '0',
				amount1Min: '0',
				deadline: '1',
			});
			const { liquidity } = await nft.getPositions(tokenId);
			expect(liquidity).toBe('0');
		});

		it('cannot decrease for more than all the liquidity', async () => {
			await expect(
				(async () => {
					nft.setSender(other);
					await nft.decreaseLiquidity({
						poolAddress: pool.address,
						tokenId,
						liquidity: '101',
						amount0Min: '0',
						amount1Min: '0',
						deadline: '1',
					});
				})(),
			).rejects.toThrow();
		});

		it('cannot decrease for more than the liquidity of the nft position', async () => {
			await nft.mint({
				token0: tokens[0].address,
				token1: tokens[1].address,
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				fee: FeeAmount.MEDIUM,
				recipient: other,
				amount0Desired: '200',
				amount1Desired: '200',
				amount0Min: '0',
				amount1Min: '0',
				deadline: '1',
			});
			await expect(
				(async () => {
					nft.setSender(other);
					await nft.decreaseLiquidity({
						poolAddress: pool.address,
						tokenId,
						liquidity: '101',
						amount0Min: '0',
						amount1Min: '0',
						deadline: '1',
					});
				})(),
			).rejects.toThrow();
		});
	});

	describe('#collect', () => {
		const tokenId = '0';
		beforeEach(async () => {
			await nft.createAndInitializePoolIfNecessary(
				tokens[0].address,
				tokens[0].symbol(),
				parseInt(tokens[0].decimals(), 10),
				tokens[1].address,
				tokens[1].symbol(),
				parseInt(tokens[1].decimals(), 10),
				FeeAmount.MEDIUM,
				encodePriceSqrt(1, 1).toString(),
			);

			await nft.mint({
				token0: tokens[0].address,
				token1: tokens[1].address,
				fee: FeeAmount.MEDIUM,
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				recipient: other,
				amount0Desired: '100',
				amount1Desired: '100',
				amount0Min: '0',
				amount1Min: '0',
				deadline: '1',
			});

			nft.setSender(sender);
		});

		it('cannot be called by other addresses', async () => {
			await expect(
				(async () =>
					nft.collect({
						poolAddress: pool.address,
						tokenId,
						recipient: sender,
						amount0Max: MaxUint128.toString(),
						amount1Max: MaxUint128.toString(),
					}))(),
			).rejects.toThrow('Not approved');
		});

		it('cannot be called with 0 for both amounts', async () => {
			await expect(
				(async () => {
					nft.setSender(other);
					await nft.collect({
						poolAddress: pool.address,
						tokenId,
						recipient: sender,
						amount0Max: '0',
						amount1Max: '0',
					});
				})(),
			).rejects.toThrow();
		});

		it('transfers tokens owed from burn', async () => {
			nft.setSender(other);
			await nft.decreaseLiquidity({
				poolAddress: pool.address,
				tokenId,
				liquidity: '50',
				amount0Min: '0',
				amount1Min: '0',
				deadline: '1',
			});
			const poolAddress = computePoolAddress([tokens[0].address, tokens[1].address], FeeAmount.MEDIUM);
			nft.setSender(other);
			await nft.collect({
				poolAddress: pool.address,
				tokenId,
				recipient: sender,
				amount0Max: MaxUint128.toString(),
				amount1Max: MaxUint128.toString(),
			});
			expect(mock_token_transfer).toHaveBeenCalledWith(poolAddress.toString('hex'), sender.toString('hex'), '49');
		});
	});

	describe('#burn', () => {
		const tokenId = '0';
		beforeEach(async () => {
			await nft.createAndInitializePoolIfNecessary(
				tokens[0].address,
				tokens[0].symbol(),
				parseInt(tokens[0].decimals(), 10),
				tokens[1].address,
				tokens[1].symbol(),
				parseInt(tokens[1].decimals(), 10),
				FeeAmount.MEDIUM,
				encodePriceSqrt(1, 1).toString(),
			);

			await nft.mint({
				token0: tokens[0].address,
				token1: tokens[1].address,
				fee: FeeAmount.MEDIUM,
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				recipient: other,
				amount0Desired: '100',
				amount1Desired: '100',
				amount0Min: '0',
				amount1Min: '0',
				deadline: '1',
			});

			nft.setSender(sender);
		});

		it('cannot be called by other addresses', async () => {
			await expect((async () => nft.burn(tokenId))()).rejects.toThrow('Not approved');
		});

		it('cannot be called while there is still liquidity', async () => {
			nft.setSender(other);
			await expect((async () => nft.burn(tokenId))()).rejects.toThrow('Not cleared');
		});

		it('cannot be called while there is still partial liquidity', async () => {
			nft.setSender(other);
			await nft.decreaseLiquidity({
				poolAddress: pool.address,
				tokenId,
				liquidity: '50',
				amount0Min: '0',
				amount1Min: '0',
				deadline: '1',
			});
			await expect((async () => nft.burn(tokenId))()).rejects.toThrow('Not cleared');
		});

		it('cannot be called while there is still tokens owed', async () => {
			nft.setSender(other);
			await nft.decreaseLiquidity({
				poolAddress: pool.address,
				tokenId,
				liquidity: '100',
				amount0Min: '0',
				amount1Min: '0',
				deadline: '1',
			});
			await expect((async () => nft.burn(tokenId))()).rejects.toThrow('Not cleared');
		});

		it('deletes the token', async () => {
			nft.setSender(other);
			await nft.decreaseLiquidity({
				poolAddress: pool.address,
				tokenId,
				liquidity: '100',
				amount0Min: '0',
				amount1Min: '0',
				deadline: '1',
			});
			await nft.collect({
				poolAddress: pool.address,
				tokenId,
				recipient: sender,
				amount0Max: MaxUint128.toString(),
				amount1Max: MaxUint128.toString(),
			});
			await nft.burn(tokenId);
			await expect((async () => nft.getPositions(tokenId))()).rejects.toThrow('NFT doesnt exist');
		});
	});

	describe('#tokenURI', () => {
		const tokenId = '0';
		beforeEach(async () => {
			await nft.createAndInitializePoolIfNecessary(
				tokens[0].address,
				tokens[0].symbol(),
				parseInt(tokens[0].decimals(), 10),
				tokens[1].address,
				tokens[1].symbol(),
				parseInt(tokens[1].decimals(), 10),
				FeeAmount.MEDIUM,
				encodePriceSqrt(1, 1).toString(),
			);

			await nft.mint({
				token0: tokens[0].address,
				token1: tokens[1].address,
				fee: FeeAmount.MEDIUM,
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				recipient: other,
				amount0Desired: '100',
				amount1Desired: '100',
				amount0Min: '0',
				amount1Min: '0',
				deadline: '1',
			});

			nft.setSender(sender);
		});

		it('reverts for invalid token id', async () => {
			await expect((async () => nft.tokenURI(`${tokenId}1`))()).rejects.toThrow();
		});

		it('content is valid IPFS url', async () => {
			const content = await nft.tokenURI(tokenId);
			expect(content.startsWith('ipfs://')).toBe(true);
		});
	});

	describe('fees accounting', () => {
		beforeEach(async () => {
			await nft.createAndInitializePoolIfNecessary(
				tokens[0].address,
				tokens[0].symbol(),
				parseInt(tokens[0].decimals(), 10),
				tokens[1].address,
				tokens[1].symbol(),
				parseInt(tokens[1].decimals(), 10),
				FeeAmount.MEDIUM,
				encodePriceSqrt(1, 1).toString(),
			);
			// nft 1 earns 25% of fees
			await nft.mint({
				token0: tokens[0].address,
				token1: tokens[1].address,
				fee: FeeAmount.MEDIUM,
				tickLower: getMinTick(FeeAmount.MEDIUM).toString(),
				tickUpper: getMaxTick(FeeAmount.MEDIUM).toString(),
				amount0Desired: '100',
				amount1Desired: '100',
				amount0Min: '0',
				amount1Min: '0',
				deadline: '1',
				recipient: sender,
			});
			// nft 2 earns 75% of fees
			await nft.mint({
				token0: tokens[0].address,
				token1: tokens[1].address,
				fee: FeeAmount.MEDIUM,
				tickLower: getMinTick(FeeAmount.MEDIUM).toString(),
				tickUpper: getMaxTick(FeeAmount.MEDIUM).toString(),
				amount0Desired: '300',
				amount1Desired: '300',
				amount0Min: '0',
				amount1Min: '0',
				deadline: '1',
				recipient: sender,
			});

			nft.setSender(sender);
		});

		describe('10k of token0 fees collect', () => {
			beforeEach(async () => {
				const swapAmount = '3333333';
				await router.exactInput({
					recipient: sender,
					deadline: '1',
					path: encodePath([tokens[0].address, tokens[1].address], [FeeAmount.MEDIUM]),
					amountIn: swapAmount,
					amountOutMinimum: '0',
				});
			});

			it('expected amounts', async () => {
				const [nft1Amount0, nft1Amount1] = await nft.collect({
					poolAddress: pool.address,
					tokenId: '0',
					recipient: sender,
					amount0Max: MaxUint128.toString(),
					amount1Max: MaxUint128.toString(),
				});
				expect(nft1Amount0).toBe('2501');
				expect(nft1Amount1).toBe('0');
			});

			it('expected amounts - 2', async () => {
				const [nft2Amount0, nft2Amount1] = await nft.collect({
					poolAddress: pool.address,
					tokenId: '1',
					recipient: sender,
					amount0Max: MaxUint128.toString(),
					amount1Max: MaxUint128.toString(),
				});
				expect(nft2Amount0).toBe('7503');
				expect(nft2Amount1).toBe('0');
			});

			it('actually collected', async () => {
				const poolAddress = computePoolAddress([tokens[0].address, tokens[1].address], FeeAmount.MEDIUM);

				nft.setSender(sender);

				await nft.collect({
					poolAddress: pool.address,
					tokenId: '0',
					recipient: sender,
					amount0Max: MaxUint128.toString(),
					amount1Max: MaxUint128.toString(),
				});

				expect(mock_token_transfer).toHaveBeenCalledWith(poolAddress.toString('hex'), sender.toString('hex'), '2501');

				await nft.collect({
					poolAddress: pool.address,
					tokenId: '1',
					recipient: sender,
					amount0Max: MaxUint128.toString(),
					amount1Max: MaxUint128.toString(),
				});

				expect(mock_token_transfer).toHaveBeenCalledWith(poolAddress.toString('hex'), sender.toString('hex'), '7503');
			});
		});
	});
});
