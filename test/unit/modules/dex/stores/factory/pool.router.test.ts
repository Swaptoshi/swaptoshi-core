/* eslint-disable camelcase */
import { MethodContext } from 'lisk-sdk';
import {
	FeeAmount,
	TICK_SPACINGS,
	createPoolFunctions,
	PoolFunctions,
	createMultiPoolFunctions,
	encodePriceSqrt,
	getMinTick,
	getMaxTick,
	expandTo18Decimals,
} from '../shared/utilities';
import { TEST_POOL_START_TIME, poolFixture } from '../shared/pool';
import { DEXPool } from '../../../../../../src/app/modules/dex/stores/factory';
import { TestCallee } from '../shared/fixtures/TestCallee';
import { TestRouter } from '../shared/fixtures/TestRouter';
import { DexModule } from '../../../../../../src/app/modules/dex/module';
import { methodSwapContext } from '../../../../../../src/app/modules/dex/stores/context';
import { methodContextFixture } from '../shared/module';
import { mock_token_transfer } from '../shared/token';

const feeAmount = FeeAmount.MEDIUM;
const tickSpacing = TICK_SPACINGS[feeAmount];
const sender = Buffer.from('0000000000000000000000000000000000000000', 'hex');

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;

describe('Swaptoshi Pool', () => {
	let module: DexModule;
	let createMethodContext: () => MethodContext;

	let token0: Buffer;
	let token1: Buffer;
	let token2: Buffer;
	let pool0: DEXPool;
	let pool1: DEXPool;

	let pool0Functions: PoolFunctions;
	let pool1Functions: PoolFunctions;

	let minTick: number;
	let maxTick: number;

	let swapTargetCallee: TestCallee;
	let swapTargetRouter: TestRouter;

	let createPool: ThenArg<ReturnType<typeof poolFixture>>['createPool'];

	beforeEach(async () => {
		({ module, createMethodContext } = await methodContextFixture());
		const swapContext = methodSwapContext(
			createMethodContext(),
			sender,
			parseInt(TEST_POOL_START_TIME, 10),
		);
		({ token0, token1, token2, createPool, swapTargetCallee, swapTargetRouter } = await poolFixture(
			swapContext,
			module,
		));

		const createPoolWrapped = async (
			amount: number,
			spacing: number,
			firstToken: Buffer,
			secondToken: Buffer,
		): Promise<[DEXPool, any]> => {
			const pool = await createPool(amount.toString(), spacing.toString(), firstToken, secondToken);
			const poolFunctions = createPoolFunctions({
				swapTarget: swapTargetCallee,
				token0: firstToken,
				token1: secondToken,
				pool,
			});
			minTick = getMinTick(spacing.toString());
			maxTick = getMaxTick(spacing.toString());
			return [pool, poolFunctions];
		};

		// default to the 30 bips pool
		[pool0, pool0Functions] = await createPoolWrapped(
			parseInt(feeAmount, 10),
			parseInt(tickSpacing, 10),
			token0,
			token1,
		);
		[pool1, pool1Functions] = await createPoolWrapped(
			parseInt(feeAmount, 10),
			parseInt(tickSpacing, 10),
			token1,
			token2,
		);
	});

	it('constructor initializes immutables', () => {
		expect(pool0.token0).toStrictEqual(token0);
		expect(pool0.token1).toStrictEqual(token1);
		expect(pool1.token0).toStrictEqual(token1);
		expect(pool1.token1).toStrictEqual(token2);
	});

	describe('multi-swaps', () => {
		let outputToken: Buffer;

		beforeEach(async () => {
			outputToken = token2;

			await pool0.initialize(encodePriceSqrt(1, 1).toString());
			await pool1.initialize(encodePriceSqrt(1, 1).toString());

			await pool0Functions.mint(sender.toString(), minTick, maxTick, expandTo18Decimals(1));
			await pool1Functions.mint(sender.toString(), minTick, maxTick, expandTo18Decimals(1));
		});

		it('multi-swap', async () => {
			const token0OfPoolOutput = pool1.token0;
			const ForExact0 = outputToken.compare(token0OfPoolOutput) === 0;

			const { swapForExact0Multi, swapForExact1Multi } = createMultiPoolFunctions({
				inputToken: token0,
				swapTarget: swapTargetRouter,
				poolInput: pool0,
				poolOutput: pool1,
			});

			const method = ForExact0 ? swapForExact0Multi : swapForExact1Multi;
			await method(100, sender);
			expect(mock_token_transfer).toHaveBeenCalledWith(
				pool1.address.toString('hex'),
				sender.toString('hex'),
				'100',
			);
			expect(mock_token_transfer).toHaveBeenCalledWith(
				pool0.address.toString('hex'),
				pool1.address.toString('hex'),
				'102',
			);
			expect(mock_token_transfer).toHaveBeenCalledWith(
				sender.toString('hex'),
				pool0.address.toString('hex'),
				'104',
			);
		});
	});
});
