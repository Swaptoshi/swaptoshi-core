/* eslint-disable @typescript-eslint/require-await */
import { BigIntAble, Uint } from '../../../../../../src/app/modules/dex/stores/library/int';
import {
	NonfungiblePositionManager,
	SwapRouter,
	SwaptoshiPool,
} from '../../../../../../src/app/modules/dex/stores/factory';
import { completeFixture } from '../shared/pool';
import { methodContextFixture } from '../shared/module';
import { methodSwapContext } from '../../../../../../src/app/modules/dex/stores/context';
import { PositionManagerStore } from '../../../../../../src/app/modules/dex/stores/position_manager';
import {
	FeeAmount,
	TICK_SPACINGS,
	encodePriceSqrt,
	expandTo18Decimals,
	getMaxTick,
	getMinTick,
} from '../shared/utilities';
import { encodePath } from '../shared/path';
import { NFTRegistry } from '../shared/nft/nft_registry';
import { PoolStore } from '../../../../../../src/app/modules/dex/stores/pool';
import { MutableSwapContext } from '../../../../../../src/app/modules/dex/types';
import { TokenRegistry } from '../shared/token/token_registry';

const sender = Buffer.from('0000000000000000000000000000000000000009', 'hex');

type Fixture<T> = (sender: Buffer) => Promise<T>;

interface Tokens {
	address: Buffer;
	symbol: () => string;
	decimals: () => string;
}

describe('PositionValue', () => {
	const positionValueCompleteFixture: Fixture<{
		pool: SwaptoshiPool;
		context: MutableSwapContext;
		tokens: [Tokens, Tokens, Tokens, Tokens];
		nft: NonfungiblePositionManager;
		router: SwapRouter;
	}> = async (_sender: Buffer) => {
		const {
			module,
			createMethodContext,
			poolStore: _poolStore,
			tokenMethod,
		} = await methodContextFixture();
		poolStore = _poolStore;
		const context = methodSwapContext(createMethodContext(), _sender, 0);
		const {
			token0,
			token1,
			token2,
			token3,
			token0Decimal,
			token0Symbol,
			token1Decimal,
			token1Symbol,
			token2Decimal,
			token2Symbol,
			token3Decimal,
			token3Symbol,
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

		const _tokens: [Tokens, Tokens, Tokens, Tokens] = [
			{ address: token0, symbol: () => token0Symbol, decimals: () => token0Decimal },
			{ address: token1, symbol: () => token1Symbol, decimals: () => token1Decimal },
			{ address: token2, symbol: () => token2Symbol, decimals: () => token2Decimal },
			{ address: token3, symbol: () => token3Symbol, decimals: () => token3Decimal },
		];

		_tokens.sort((a, b) =>
			a.address.toString('hex').toLowerCase() < b.address.toString('hex').toLowerCase() ? -1 : 1,
		);

		for (const token of _tokens) {
			await tokenMethod.mint(
				createMethodContext(),
				_sender,
				token.address,
				expandTo18Decimals(1_000_000).toBigInt(),
			);
		}

		return {
			pool: _pool,
			tokens: _tokens,
			context,
			nft,
			router,
		};
	};

	let poolStore: PoolStore;
	let context: MutableSwapContext;
	let pool: SwaptoshiPool;
	let tokens: [Tokens, Tokens, Tokens, Tokens];
	let nft: NonfungiblePositionManager;
	let router: SwapRouter;

	let amountDesired: BigIntAble;

	beforeEach(async () => {
		({ pool, tokens, nft, router, context } = await positionValueCompleteFixture(sender));
	});

	afterEach(() => {
		NFTRegistry.reset();
		TokenRegistry.reset();
	});

	describe('#total', () => {
		let sqrtRatioX96: BigIntAble;

		beforeEach(async () => {
			amountDesired = expandTo18Decimals(100_000);

			await nft.mint({
				token0: tokens[0].address,
				token1: tokens[1].address,
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				fee: FeeAmount.MEDIUM,
				recipient: sender,
				amount0Desired: amountDesired.toString(),
				amount1Desired: amountDesired.toString(),
				amount0Min: '0',
				amount1Min: '0',
				deadline: '10',
			});

			const swapAmount = expandTo18Decimals(1_000);
			// await tokens[0].approve(router.address, swapAmount);
			// await tokens[1].approve(router.address, swapAmount);

			// accmuluate token0 fees
			await router.exactInput({
				recipient: sender,
				deadline: '1',
				path: encodePath([tokens[0].address, tokens[1].address], [FeeAmount.MEDIUM]),
				amountIn: swapAmount.toString(),
				amountOutMinimum: '0',
			});

			// accmuluate token1 fees
			await router.exactInput({
				recipient: sender,
				deadline: '1',
				path: encodePath([tokens[1].address, tokens[0].address], [FeeAmount.MEDIUM]),
				amountIn: swapAmount.toString(),
				amountOutMinimum: '0',
			});

			pool = await poolStore.getMutablePool(
				context,
				tokens[0].address,
				tokens[1].address,
				FeeAmount.MEDIUM,
			);

			sqrtRatioX96 = pool.slot0.sqrtPriceX96;
		});

		it('returns the correct amount', async () => {
			const principal = await nft.principal('0', sqrtRatioX96.toString()); // [ '99990159002944606476893', '100009841965602938701146' ]
			const fees = await nft.fees('0'); // [ '2999999999999999999', '3000000000000000000' ]
			const total = await nft.total('0', sqrtRatioX96.toString()); //  [ '99993159002944606476892', '100012841965602938701146' ]

			expect(total[0]).toBe(Uint.from(principal[0]).add(fees[0]).toString());
			expect(total[1]).toBe(Uint.from(principal[1]).add(fees[1]).toString());
		});
	});

	describe('#principal', () => {
		let sqrtRatioX96: BigIntAble;

		beforeEach(async () => {
			amountDesired = expandTo18Decimals(100_000);
			sqrtRatioX96 = pool.slot0.sqrtPriceX96;
		});

		it('returns the correct values when price is in the middle of the range', async () => {
			await nft.mint({
				token0: tokens[0].address,
				token1: tokens[1].address,
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				fee: FeeAmount.MEDIUM,
				recipient: sender,
				amount0Desired: amountDesired.toString(),
				amount1Desired: amountDesired.toString(),
				amount0Min: '0',
				amount1Min: '0',
				deadline: '10',
			});

			const [amount0, amount1] = await nft.principal('0', sqrtRatioX96.toString());
			expect(amount0).toBe('99999999999999999999999');
			expect(amount1).toBe('99999999999999999999999');
		});

		it('returns the correct values when range is below current price', async () => {
			await nft.mint({
				token0: tokens[0].address,
				token1: tokens[1].address,
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				tickUpper: '-60',
				fee: FeeAmount.MEDIUM,
				recipient: sender,
				amount0Desired: amountDesired.toString(),
				amount1Desired: amountDesired.toString(),
				amount0Min: '0',
				amount1Min: '0',
				deadline: '10',
			});

			const principal = await nft.principal('0', sqrtRatioX96.toString());
			expect(principal[0]).toBe('0');
			expect(principal[1]).toBe('99999999999999999999999');
		});

		it('returns the correct values when range is below current price - 2', async () => {
			await nft.mint({
				token0: tokens[0].address,
				token1: tokens[1].address,
				tickLower: '60',
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				fee: FeeAmount.MEDIUM,
				recipient: sender,
				amount0Desired: amountDesired.toString(),
				amount1Desired: amountDesired.toString(),
				amount0Min: '0',
				amount1Min: '0',
				deadline: '10',
			});

			const principal = await nft.principal('0', sqrtRatioX96.toString());
			expect(principal[0]).toBe('99999999999999999999999');
			expect(principal[1]).toBe('0');
		});

		it('returns the correct values when range is skewed above price', async () => {
			await nft.mint({
				token0: tokens[0].address,
				token1: tokens[1].address,
				tickLower: '-6000',
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				fee: FeeAmount.MEDIUM,
				recipient: sender,
				amount0Desired: amountDesired.toString(),
				amount1Desired: amountDesired.toString(),
				amount0Min: '0',
				amount1Min: '0',
				deadline: '10',
			});

			const principal = await nft.principal('0', sqrtRatioX96.toString());
			expect(principal[0]).toBe('99999999999999999999999');
			expect(principal[1]).toBe('25917066770240321655335');
		});

		it('returns the correct values when range is skewed below price', async () => {
			await nft.mint({
				token0: tokens[0].address,
				token1: tokens[1].address,
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				tickUpper: '6000',
				fee: FeeAmount.MEDIUM,
				recipient: sender,
				amount0Desired: amountDesired.toString(),
				amount1Desired: amountDesired.toString(),
				amount0Min: '0',
				amount1Min: '0',
				deadline: '10',
			});

			const principal = await nft.principal('0', sqrtRatioX96.toString());
			expect(principal[0]).toBe('25917066770240321655335');
			expect(principal[1]).toBe('99999999999999999999999');
		});
	});

	describe('#fees', () => {
		let tokenId: string;

		beforeEach(async () => {
			amountDesired = expandTo18Decimals(100_000);
			tokenId = '1';

			await nft.mint({
				token0: tokens[0].address,
				token1: tokens[1].address,
				tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
				fee: FeeAmount.MEDIUM,
				recipient: sender,
				amount0Desired: amountDesired.toString(),
				amount1Desired: amountDesired.toString(),
				amount0Min: '0',
				amount1Min: '0',
				deadline: '10',
			});
		});

		describe('when price is within the position range', () => {
			beforeEach(async () => {
				await nft.mint({
					token0: tokens[0].address,
					token1: tokens[1].address,
					tickLower: (parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10) * -1000).toString(),
					tickUpper: (parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10) * 1000).toString(),
					fee: FeeAmount.MEDIUM,
					recipient: sender,
					amount0Desired: amountDesired.toString(),
					amount1Desired: amountDesired.toString(),
					amount0Min: '0',
					amount1Min: '0',
					deadline: '10',
				});

				const swapAmount = expandTo18Decimals(1_000);
				// await tokens[0].approve(router.address, swapAmount);
				// await tokens[1].approve(router.address, swapAmount);

				// accmuluate token0 fees
				await router.exactInput({
					recipient: sender,
					deadline: '1',
					path: encodePath([tokens[0].address, tokens[1].address], [FeeAmount.MEDIUM]),
					amountIn: swapAmount.toString(),
					amountOutMinimum: '0',
				});

				// accmuluate token1 fees
				await router.exactInput({
					recipient: sender,
					deadline: '1',
					path: encodePath([tokens[1].address, tokens[0].address], [FeeAmount.MEDIUM]),
					amountIn: swapAmount.toString(),
					amountOutMinimum: '0',
				});
			});

			it('return the correct amount of fees', async () => {
				const feeAmounts = await nft.fees(tokenId.toString());

				expect(feeAmounts[0]).toBe('1538299454151409006');
				expect(feeAmounts[1]).toBe('1538299454151409007');
			});

			it('returns the correct amount of fees if tokensOwed fields are greater than 0', async () => {
				await nft.increaseLiquidity({
					poolAddress: pool.address,
					tokenId,
					amount0Desired: '100',
					amount1Desired: '100',
					amount0Min: '0',
					amount1Min: '0',
					deadline: '1',
				});

				const swapAmount = expandTo18Decimals(1_000);
				// await tokens[0].approve(router.address, swapAmount);

				// accmuluate more token0 fees after clearing initial amount
				await router.exactInput({
					recipient: sender,
					deadline: '1',
					path: encodePath([tokens[0].address, tokens[1].address], [FeeAmount.MEDIUM]),
					amountIn: swapAmount.toString(),
					amountOutMinimum: '0',
				});

				const feeAmounts = await nft.fees(tokenId);
				expect(feeAmounts[0]).toBe('3076598908302818013');
				expect(feeAmounts[1]).toBe('1538299454151409007');
			});
		});

		describe('when price is below the position range', () => {
			beforeEach(async () => {
				await nft.mint({
					token0: tokens[0].address,
					token1: tokens[1].address,
					tickLower: (parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10) * -10).toString(),
					tickUpper: (parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10) * 10).toString(),
					fee: FeeAmount.MEDIUM,
					recipient: sender,
					amount0Desired: expandTo18Decimals(10_000).toString(),
					amount1Desired: expandTo18Decimals(10_000).toString(),
					amount0Min: '0',
					amount1Min: '0',
					deadline: '10',
				});

				// await tokens[0].approve(router.address, constants.MaxUint256);
				// await tokens[1].approve(router.address, constants.MaxUint256);

				// accumulate token1 fees
				await router.exactInput({
					recipient: sender,
					deadline: '1',
					path: encodePath([tokens[1].address, tokens[0].address], [FeeAmount.MEDIUM]),
					amountIn: expandTo18Decimals(1_000).toString(),
					amountOutMinimum: '0',
				});

				// accumulate token0 fees and push price below tickLower
				await router.exactInput({
					recipient: sender,
					deadline: '1',
					path: encodePath([tokens[0].address, tokens[1].address], [FeeAmount.MEDIUM]),
					amountIn: expandTo18Decimals(50_000).toString(),
					amountOutMinimum: '0',
				});
			});

			it('returns the correct amount of fees', async () => {
				const feeAmounts = await nft.fees(tokenId);
				expect(feeAmounts[0]).toBe('33317009320143222009');
				expect(feeAmounts[1]).toBe('2315654402504597481');
			});
		});

		describe('when price is above the position range', () => {
			beforeEach(async () => {
				await nft.mint({
					token0: tokens[0].address,
					token1: tokens[1].address,
					tickLower: (parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10) * -10).toString(),
					tickUpper: (parseInt(TICK_SPACINGS[FeeAmount.MEDIUM], 10) * 10).toString(),
					fee: FeeAmount.MEDIUM,
					recipient: sender,
					amount0Desired: expandTo18Decimals(10_000).toString(),
					amount1Desired: expandTo18Decimals(10_000).toString(),
					amount0Min: '0',
					amount1Min: '0',
					deadline: '10',
				});

				// await tokens[0].approve(router.address, constants.MaxUint256);
				// await tokens[1].approve(router.address, constants.MaxUint256);

				// accumulate token0 fees
				await router.exactInput({
					recipient: sender,
					deadline: '1',
					path: encodePath([tokens[0].address, tokens[1].address], [FeeAmount.MEDIUM]),
					amountIn: expandTo18Decimals(1_000).toString(),
					amountOutMinimum: '0',
				});

				// accumulate token1 fees and push price above tickUpper
				await router.exactInput({
					recipient: sender,
					deadline: '1',
					path: encodePath([tokens[1].address, tokens[0].address], [FeeAmount.MEDIUM]),
					amountIn: expandTo18Decimals(50_000).toString(),
					amountOutMinimum: '0',
				});
			});

			it('returns the correct amount of fees', async () => {
				const feeAmounts = await nft.fees(tokenId);
				expect(feeAmounts[0]).toBe('2315654402504597481');
				expect(feeAmounts[1]).toBe('33317009320143222009');
			});
		});
	});
});
