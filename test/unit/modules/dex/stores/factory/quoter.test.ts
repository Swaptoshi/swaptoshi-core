import { methodSwapContext } from '../../../../../../src/app/modules/dex/stores/context';
import { NonfungiblePositionManager, SwapRouter } from '../../../../../../src/app/modules/dex/stores/factory';
import { Quoter } from '../../../../../../src/app/modules/dex/stores/library/lens/quoter';
import { methodContextFixture, moduleConfig } from '../shared/module';
import { completeFixture } from '../shared/pool';
import { MutableSwapContext, TokenMethod } from '../../../../../../src/app/modules/dex/types';
import { PoolStore } from '../../../../../../src/app/modules/dex/stores/pool';
import { FeeAmount, MaxUint128, encodePriceSqrt, expandTo18Decimals } from '../shared/utilities';
import { PositionManagerStore } from '../../../../../../src/app/modules/dex/stores/position_manager';
import { createPool, createPoolWithMultiplePositions, createPoolWithZeroTickInitialized } from '../shared/quoter';
import { encodePath } from '../shared/path';
import { DexModule } from '../../../../../../src/app/modules/dex/module';

const sender = Buffer.from('0000000000000000000000000000000000000005', 'hex');
const trader = Buffer.from('0000000000000000000000000000000000000006', 'hex');

type Fixture<T> = (sender: Buffer) => Promise<T>;

interface Tokens {
	address: Buffer;
	symbol: () => string;
	decimals: () => string;
}

describe('QuoterV2', () => {
	const swapRouterFixture: Fixture<{
		context: MutableSwapContext;
		nft: NonfungiblePositionManager;
		tokens: [Tokens, Tokens, Tokens];
		module: DexModule;
	}> = async (_sender: Buffer) => {
		const { module, createMethodContext, poolStore: _poolStore, tokenMethod: _tokenMethod } = await methodContextFixture();
		tokenMethod = _tokenMethod;
		poolStore = _poolStore;
		context = methodSwapContext(createMethodContext(), _sender, 0);
		const { token0, token1, token2, token0Decimal, token0Symbol, token1Decimal, token1Symbol, token2Decimal, token2Symbol } = await completeFixture(context, module);

		const _pool = await poolStore.createPool(
			context,
			Buffer.from('0000000000000000', 'hex'),
			moduleConfig.nftPositionMetadata.mainchain.symbol.toUpperCase(),
			parseInt(token0Decimal, 10),
			Buffer.from('0010000000000000', 'hex'),
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

		_tokens.sort((a, b) => (a.address.toString('hex').toLowerCase() < b.address.toString('hex').toLowerCase() ? -1 : 1));

		for (const token of _tokens) {
			await tokenMethod.transfer(context.context, _sender, trader, token.address, expandTo18Decimals(1_000_000).toBigInt());
		}

		return {
			context,
			router,
			tokens: _tokens,
			nft,
			module,
		} as any;
	};

	let tokenMethod: TokenMethod;
	let context: MutableSwapContext;
	let poolStore: PoolStore;
	let router: SwapRouter;
	let nft: NonfungiblePositionManager;
	let tokens: [Tokens, Tokens, Tokens];
	let quoter: Quoter;
	let module: DexModule;

	// helper for getting weth and token balances
	beforeEach(async () => {
		({ tokens, nft, context, module } = await swapRouterFixture(sender));
		quoter = new Quoter(context, module.stores);
	});

	describe('quotes', () => {
		beforeEach(async () => {
			await createPool(nft, sender, tokens[0].address, tokens[1].address);
			await createPool(nft, sender, tokens[1].address, tokens[2].address);
			await createPoolWithMultiplePositions(nft, sender, tokens[0].address, tokens[2].address);
		});

		describe('#quoteExactInput', () => {
			it('0 -> 2 cross 2 tick', async () => {
				const { amountOut, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactInput(encodePath([tokens[0].address, tokens[2].address], [FeeAmount.MEDIUM]), '10000');

				expect(sqrtPriceX96AfterList).toHaveLength(1);
				expect(sqrtPriceX96AfterList[0]).toBe('78461846509168490764501028180');
				expect(initializedTicksCrossedList[0]).toBe('2');
				expect(amountOut).toBe('9871');
			});

			it('0 -> 2 cross 2 tick where after is initialized', async () => {
				// The swap amount is set such that the active tick after the swap is -120.
				// -120 is an initialized tick for this pool. We check that we don't count it.
				const { amountOut, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactInput(encodePath([tokens[0].address, tokens[2].address], [FeeAmount.MEDIUM]), '6200');

				expect(sqrtPriceX96AfterList).toHaveLength(1);
				expect(sqrtPriceX96AfterList[0]).toBe('78757224507315167622282810783');
				expect(initializedTicksCrossedList).toHaveLength(1);
				expect(initializedTicksCrossedList[0]).toBe('1');
				expect(amountOut).toBe('6143');
			});

			it('0 -> 2 cross 1 tick', async () => {
				const { amountOut, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactInput(encodePath([tokens[0].address, tokens[2].address], [FeeAmount.MEDIUM]), '4000');

				expect(initializedTicksCrossedList[0]).toBe('1');
				expect(sqrtPriceX96AfterList).toHaveLength(1);
				expect(sqrtPriceX96AfterList[0]).toBe('78926452400586371254602774705');
				expect(amountOut).toBe('3971');
			});

			it('0 -> 2 cross 0 tick, starting tick not initialized', async () => {
				// Tick before 0, tick after -1.
				const { amountOut, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactInput(encodePath([tokens[0].address, tokens[2].address], [FeeAmount.MEDIUM]), '10');

				expect(initializedTicksCrossedList[0]).toBe('0');
				expect(sqrtPriceX96AfterList).toHaveLength(1);
				expect(sqrtPriceX96AfterList[0]).toBe('79227483487511329217250071027');
				expect(amountOut).toBe('8');
			});

			it('0 -> 2 cross 0 tick, starting tick initialized', async () => {
				// Tick before 0, tick after -1. Tick 0 initialized.
				await createPoolWithZeroTickInitialized(nft, sender, tokens[0].address, tokens[2].address);

				const { amountOut, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactInput(encodePath([tokens[0].address, tokens[2].address], [FeeAmount.MEDIUM]), '10');

				expect(initializedTicksCrossedList[0]).toBe('1');
				expect(sqrtPriceX96AfterList).toHaveLength(1);
				expect(sqrtPriceX96AfterList[0]).toBe('79227817515327498931091950511');
				expect(amountOut).toBe('8');
			});

			it('2 -> 0 cross 2', async () => {
				const { amountOut, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactInput(encodePath([tokens[2].address, tokens[0].address], [FeeAmount.MEDIUM]), '10000');

				expect(initializedTicksCrossedList[0]).toBe('2');
				expect(sqrtPriceX96AfterList).toHaveLength(1);
				expect(sqrtPriceX96AfterList[0]).toBe('80001962924147897865541384515');
				expect(initializedTicksCrossedList).toHaveLength(1);
				expect(amountOut).toBe('9871');
			});

			it('2 -> 0 cross 2 where tick after is initialized', async () => {
				// The swap amount is set such that the active tick after the swap is 120.
				// 120 is an initialized tick for this pool. We check we don't count it.
				const { amountOut, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactInput(encodePath([tokens[2].address, tokens[0].address], [FeeAmount.MEDIUM]), '6250');

				expect(initializedTicksCrossedList[0]).toBe('2');
				expect(sqrtPriceX96AfterList).toHaveLength(1);
				expect(sqrtPriceX96AfterList[0]).toBe('79705728824507063507279123685');
				expect(initializedTicksCrossedList).toHaveLength(1);
				expect(amountOut).toBe('6190');
			});

			it('2 -> 0 cross 0 tick, starting tick initialized', async () => {
				// Tick 0 initialized. Tick after = 1
				await createPoolWithZeroTickInitialized(nft, sender, tokens[0].address, tokens[2].address);

				const { amountOut, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactInput(encodePath([tokens[2].address, tokens[0].address], [FeeAmount.MEDIUM]), '200');

				expect(initializedTicksCrossedList[0]).toBe('0');
				expect(sqrtPriceX96AfterList).toHaveLength(1);
				expect(sqrtPriceX96AfterList[0]).toBe('79235729830182478001034429156');
				expect(initializedTicksCrossedList).toHaveLength(1);
				expect(amountOut).toBe('198');
			});

			it('2 -> 0 cross 0 tick, starting tick not initialized', async () => {
				// Tick 0 initialized. Tick after = 1
				const { amountOut, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactInput(encodePath([tokens[2].address, tokens[0].address], [FeeAmount.MEDIUM]), '103');

				expect(initializedTicksCrossedList[0]).toBe('0');
				expect(sqrtPriceX96AfterList).toHaveLength(1);
				expect(sqrtPriceX96AfterList[0]).toBe('79235858216754624215638319723');
				expect(initializedTicksCrossedList).toHaveLength(1);
				expect(amountOut).toBe('101');
			});

			it('2 -> 1', async () => {
				const { amountOut, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactInput(encodePath([tokens[2].address, tokens[1].address], [FeeAmount.MEDIUM]), '10000');

				expect(sqrtPriceX96AfterList).toHaveLength(1);
				expect(sqrtPriceX96AfterList[0]).toBe('80018067294531553039351583520');
				expect(initializedTicksCrossedList[0]).toBe('0');
				expect(amountOut).toBe('9871');
			});

			it('0 -> 2 -> 1', async () => {
				const { amountOut, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactInput(
					encodePath([tokens[0].address, tokens[2].address, tokens[1].address], [FeeAmount.MEDIUM, FeeAmount.MEDIUM]),
					'10000',
				);

				expect(sqrtPriceX96AfterList).toHaveLength(2);
				expect(sqrtPriceX96AfterList[0]).toBe('78461846509168490764501028180');
				expect(sqrtPriceX96AfterList[1]).toBe('80007846861567212939802016351');
				expect(initializedTicksCrossedList[0]).toBe('2');
				expect(initializedTicksCrossedList[1]).toBe('0');
				expect(amountOut).toBe('9745');
			});
		});

		describe('#quoteExactInputSingle', () => {
			it('0 -> 2', async () => {
				const {
					amountOut: quote,
					sqrtPriceX96After,
					initializedTicksCrossed,
				} = await quoter.quoteExactInputSingle({
					tokenIn: tokens[0].address.toString('hex'),
					tokenOut: tokens[2].address.toString('hex'),
					fee: FeeAmount.MEDIUM,
					amountIn: '10000',
					// -2%
					sqrtPriceLimitX96: encodePriceSqrt(100, 102).toString(),
				});

				expect(initializedTicksCrossed).toBe('2');
				expect(quote).toBe('9871');
				expect(sqrtPriceX96After).toBe('78461846509168490764501028180');
			});

			it('2 -> 0', async () => {
				const {
					amountOut: quote,
					sqrtPriceX96After,
					initializedTicksCrossed,
				} = await quoter.quoteExactInputSingle({
					tokenIn: tokens[2].address.toString('hex'),
					tokenOut: tokens[0].address.toString('hex'),
					fee: FeeAmount.MEDIUM,
					amountIn: '10000',
					// +2%
					sqrtPriceLimitX96: encodePriceSqrt(102, 100).toString(),
				});

				expect(initializedTicksCrossed).toBe('2');
				expect(quote).toBe('9871');
				expect(sqrtPriceX96After).toBe('80001962924147897865541384515');
			});
		});

		describe('#quoteExactOutput', () => {
			it('0 -> 2 cross 2 tick', async () => {
				const { amountIn, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactOutput(encodePath([tokens[2].address, tokens[0].address], [FeeAmount.MEDIUM]), '15000');

				expect(initializedTicksCrossedList).toHaveLength(1);
				expect(initializedTicksCrossedList[0]).toBe('2');
				expect(amountIn).toBe('15273');

				expect(sqrtPriceX96AfterList).toHaveLength(1);
				expect(sqrtPriceX96AfterList[0]).toBe('78055527257643669242286029831');
			});

			it('0 -> 2 cross 2 where tick after is initialized', async () => {
				// The swap amount is set such that the active tick after the swap is -120.
				// -120 is an initialized tick for this pool. We check that we count it.
				const { amountIn, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactOutput(encodePath([tokens[2].address, tokens[0].address], [FeeAmount.MEDIUM]), '6143');

				expect(sqrtPriceX96AfterList).toHaveLength(1);
				expect(sqrtPriceX96AfterList[0]).toBe('78757225449310403327341205211');
				expect(initializedTicksCrossedList).toHaveLength(1);
				expect(initializedTicksCrossedList[0]).toBe('1');
				expect(amountIn).toBe('6200');
			});

			it('0 -> 2 cross 1 tick', async () => {
				const { amountIn, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactOutput(encodePath([tokens[2].address, tokens[0].address], [FeeAmount.MEDIUM]), '4000');

				expect(initializedTicksCrossedList).toHaveLength(1);
				expect(initializedTicksCrossedList[0]).toBe('1');
				expect(amountIn).toBe('4029');

				expect(sqrtPriceX96AfterList).toHaveLength(1);
				expect(sqrtPriceX96AfterList[0]).toBe('78924219757724709840818372098');
			});

			it('0 -> 2 cross 0 tick starting tick initialized', async () => {
				// Tick before 0, tick after 1. Tick 0 initialized.
				await createPoolWithZeroTickInitialized(nft, sender, tokens[0].address, tokens[2].address);
				const { amountIn, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactOutput(encodePath([tokens[2].address, tokens[0].address], [FeeAmount.MEDIUM]), '100');

				expect(initializedTicksCrossedList).toHaveLength(1);
				expect(initializedTicksCrossedList[0]).toBe('1');
				expect(amountIn).toBe('102');

				expect(sqrtPriceX96AfterList).toHaveLength(1);
				expect(sqrtPriceX96AfterList[0]).toBe('79224329176051641448521403903');
			});

			it('0 -> 2 cross 0 tick starting tick not initialized', async () => {
				const { amountIn, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactOutput(encodePath([tokens[2].address, tokens[0].address], [FeeAmount.MEDIUM]), '10');

				expect(initializedTicksCrossedList).toHaveLength(1);
				expect(initializedTicksCrossedList[0]).toBe('0');
				expect(amountIn).toBe('12');

				expect(sqrtPriceX96AfterList).toHaveLength(1);
				expect(sqrtPriceX96AfterList[0]).toBe('79227408033628034983534698435');
			});

			it('2 -> 0 cross 2 ticks', async () => {
				const { amountIn, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactOutput(encodePath([tokens[0].address, tokens[2].address], [FeeAmount.MEDIUM]), '15000');

				expect(initializedTicksCrossedList).toHaveLength(1);
				expect(initializedTicksCrossedList[0]).toBe('2');
				expect(amountIn).toBe('15273');
				expect(sqrtPriceX96AfterList).toHaveLength(1);
				expect(sqrtPriceX96AfterList[0]).toBe('80418414376567919517220409857');
			});

			it('2 -> 0 cross 2 where tick after is initialized', async () => {
				// The swap amount is set such that the active tick after the swap is 120.
				// 120 is an initialized tick for this pool. We check that we don't count it.
				const { amountIn, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactOutput(encodePath([tokens[0].address, tokens[2].address], [FeeAmount.MEDIUM]), '6223');

				expect(initializedTicksCrossedList[0]).toBe('2');
				expect(sqrtPriceX96AfterList).toHaveLength(1);
				expect(sqrtPriceX96AfterList[0]).toBe('79708304437530892332449657932');
				expect(initializedTicksCrossedList).toHaveLength(1);
				expect(amountIn).toBe('6283');
			});

			it('2 -> 0 cross 1 tick', async () => {
				const { amountIn, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactOutput(encodePath([tokens[0].address, tokens[2].address], [FeeAmount.MEDIUM]), '6000');

				expect(initializedTicksCrossedList[0]).toBe('1');
				expect(sqrtPriceX96AfterList).toHaveLength(1);
				expect(sqrtPriceX96AfterList[0]).toBe('79690640184021170956740081887');
				expect(initializedTicksCrossedList).toHaveLength(1);
				expect(amountIn).toBe('6055');
			});

			it('2 -> 1', async () => {
				const { amountIn, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactOutput(encodePath([tokens[1].address, tokens[2].address], [FeeAmount.MEDIUM]), '9871');

				expect(sqrtPriceX96AfterList).toHaveLength(1);
				expect(sqrtPriceX96AfterList[0]).toBe('80018020393569259756601362385');
				expect(initializedTicksCrossedList[0]).toBe('0');
				expect(amountIn).toBe('10000');
			});

			it('0 -> 2 -> 1', async () => {
				const { amountIn, sqrtPriceX96AfterList, initializedTicksCrossedList } = await quoter.quoteExactOutput(
					encodePath([tokens[0].address, tokens[2].address, tokens[1].address].reverse(), [FeeAmount.MEDIUM, FeeAmount.MEDIUM]),
					'9745',
				);

				expect(sqrtPriceX96AfterList).toHaveLength(2);
				expect(sqrtPriceX96AfterList[0]).toBe('80007838904387594703933785072');
				expect(sqrtPriceX96AfterList[1]).toBe('78461888503179331029803316753');
				expect(initializedTicksCrossedList[0]).toBe('0');
				expect(initializedTicksCrossedList[1]).toBe('2');
				expect(amountIn).toBe('10000');
			});
		});

		describe('#quoteExactOutputSingle', () => {
			it('0 -> 1', async () => {
				const { amountIn, sqrtPriceX96After, initializedTicksCrossed } = await quoter.quoteExactOutputSingle({
					tokenIn: tokens[0].address.toString('hex'),
					tokenOut: tokens[1].address.toString('hex'),
					fee: FeeAmount.MEDIUM,
					amount: MaxUint128.toString(),
					sqrtPriceLimitX96: encodePriceSqrt(100, 102).toString(),
				});

				expect(amountIn).toBe('9981');
				expect(initializedTicksCrossed).toBe('0');
				expect(sqrtPriceX96After).toBe('78447570448055484695608110440');
			});

			it('1 -> 0', async () => {
				const { amountIn, sqrtPriceX96After, initializedTicksCrossed } = await quoter.quoteExactOutputSingle({
					tokenIn: tokens[1].address.toString('hex'),
					tokenOut: tokens[0].address.toString('hex'),
					fee: FeeAmount.MEDIUM,
					amount: MaxUint128.toString(),
					sqrtPriceLimitX96: encodePriceSqrt(102, 100).toString(),
				});

				expect(amountIn).toBe('9981');
				expect(initializedTicksCrossed).toBe('0');
				expect(sqrtPriceX96After).toBe('80016521857016594389520272648');
			});
		});
	});
});
