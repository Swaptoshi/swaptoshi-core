/* eslint-disable jest/expect-expect */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { methodSwapContext } from '../../../../../../../src/app/modules/dex/stores/context';
import { BigIntAble, Uint } from '../../../../../../../src/app/modules/dex/stores/library/int';
import * as oracle from '../../../../../../../src/app/modules/dex/stores/library/periphery/oracle_library';
import { MockObservable } from '../../shared/fixtures/MockObservable';
import { MockObservations } from '../../shared/fixtures/MockObservations';
import { methodContextFixture } from '../../shared/module';
import { TEST_POOL_START_TIME, completeFixture } from '../../shared/pool';
import { expandTo18Decimals } from '../../shared/utilities';

const sender = Buffer.from('0000000000000000000000000000000000000005', 'hex');
const blockTimestamp = Math.floor(new Date().getTime() / 1000);

interface Tokens {
	address: Buffer;
	symbol: () => string;
	decimals: () => string;
}

describe('OracleLibrary', () => {
	let tokens: Tokens[];

	const BN0 = Uint.from(0);

	const oracleTestFixture = async () => {
		const { module, createMethodContext } = await methodContextFixture();
		const context = methodSwapContext(createMethodContext(), sender, parseInt(TEST_POOL_START_TIME, 10));

		const { token0, token1, token2, token3, token0Decimal, token0Symbol, token1Decimal, token1Symbol, token2Decimal, token2Symbol, token3Decimal, token3Symbol } = await completeFixture(
			context,
			module,
		);

		const _tokens: [Tokens, Tokens, Tokens, Tokens] = [
			{ address: token0, symbol: () => token0Symbol, decimals: () => token0Decimal },
			{ address: token1, symbol: () => token1Symbol, decimals: () => token1Decimal },
			{ address: token2, symbol: () => token2Symbol, decimals: () => token2Decimal },
			{ address: token3, symbol: () => token3Symbol, decimals: () => token3Decimal },
		];

		_tokens.sort((a, b) => (a.address.toString('hex').toLowerCase() < b.address.toString('hex').toLowerCase() ? -1 : 1));

		return {
			tokens: _tokens,
		};
	};

	beforeEach(async () => {
		const fixtures = await oracleTestFixture();
		tokens = fixtures['tokens'];
	});

	describe('#consult', () => {
		it('reverts when period is 0', async () => {
			await expect(async () => oracle.consult(oracle as any, '0')).rejects.toThrow('BP');
		});

		it('correct output when tick is 0', async () => {
			const period = 3;
			const secondsPerLiqCumulatives: [BigIntAble, BigIntAble] = [10, 20];
			const mockObservable = observableWith({
				period,
				tickCumulatives: [12, 12],
				secondsPerLiqCumulatives,
			});
			const [arithmeticMeanTick, harmonicMeanLiquidity] = oracle.consult(mockObservable, period.toString());

			expect(arithmeticMeanTick).toBe('0');
			expect(harmonicMeanLiquidity).toBe(calculateHarmonicAvgLiq(period, secondsPerLiqCumulatives).toString());
		});

		it('correct rounding for .5 negative tick', async () => {
			const period = 4;

			const secondsPerLiqCumulatives: [BigIntAble, BigIntAble] = [10, 15];
			const mockObservable = observableWith({
				period,
				tickCumulatives: [-10, -12],
				secondsPerLiqCumulatives,
			});

			const [arithmeticMeanTick, harmonicMeanLiquidity] = oracle.consult(mockObservable, period.toString());

			// Always round to negative infinity
			// In this case, we need to subtract one because integer division rounds to 0
			expect(arithmeticMeanTick).toBe('-1');
			expect(harmonicMeanLiquidity).toBe(calculateHarmonicAvgLiq(period, secondsPerLiqCumulatives).toString());
		});

		it('correct output for liquidity overflow', async () => {
			const period = 1;

			const secondsPerLiqCumulatives: [BigIntAble, BigIntAble] = [10, 11];
			const mockObservable = observableWith({
				period,
				tickCumulatives: [12, 12],
				secondsPerLiqCumulatives,
			});

			const [arithmeticMeanTick, harmonicMeanLiquidity] = oracle.consult(mockObservable, period.toString());

			expect(arithmeticMeanTick).toBe('0');
			// Make sure liquidity doesn't overflow uint128
			expect(harmonicMeanLiquidity).toBe(Uint.from(2).pow(128).sub(1).toString());
		});

		function calculateHarmonicAvgLiq(period: number, secondsPerLiqCumulatives: [BigIntAble, BigIntAble]) {
			const [secondsPerLiq0, secondsPerLiq1] = secondsPerLiqCumulatives.map(t => Uint.from(t));
			const delta = secondsPerLiq1.sub(secondsPerLiq0);

			const maxUint160 = Uint.from(2).pow(160).sub(1);
			return maxUint160.mul(period).div(delta.shl(32)).toString();
		}

		function observableWith({ period, tickCumulatives, secondsPerLiqCumulatives }: { period: number; tickCumulatives: [BigIntAble, BigIntAble]; secondsPerLiqCumulatives: [BigIntAble, BigIntAble] }) {
			return new MockObservable(
				[period.toString(), '0'],
				tickCumulatives.map(t => t.toString()),
				secondsPerLiqCumulatives.map(t => t.toString()),
			);
		}
	});

	describe('#getQuoteAtTick', () => {
		// sanity check
		it('token0: returns correct value when tick = 0', async () => {
			const quoteAmount = oracle.getQuoteAtTick(BN0.toString(), expandTo18Decimals(1).toString(), tokens[0].address, tokens[1].address);

			expect(quoteAmount).toBe(expandTo18Decimals(1).toString());
		});

		// sanity check
		it('token1: returns correct value when tick = 0', async () => {
			const quoteAmount = oracle.getQuoteAtTick(BN0.toString(), expandTo18Decimals(1).toString(), tokens[1].address, tokens[0].address);

			expect(quoteAmount).toBe(expandTo18Decimals(1).toString());
		});

		it('token0: returns correct value when at min tick | 0 < sqrtRatioX96 <= type(uint128).max', async () => {
			const quoteAmount = oracle.getQuoteAtTick(Uint.from(-887272).toString(), Uint.from(2).pow(128).sub(1).toString(), tokens[0].address, tokens[1].address);
			expect(quoteAmount).toBe(Uint.from('1').toString());
		});

		it('token1: returns correct value when at min tick | 0 < sqrtRatioX96 <= type(uint128).max', async () => {
			const quoteAmount = oracle.getQuoteAtTick(Uint.from(-887272).toString(), Uint.from(2).pow(128).sub(1).toString(), tokens[1].address, tokens[0].address);
			expect(quoteAmount).toBe(Uint.from('115783384738768196242144082653949453838306988932806144552194799290216044976282').toString());
		});

		it('token0: returns correct value when at max tick | sqrtRatioX96 > type(uint128).max', async () => {
			const quoteAmount = oracle.getQuoteAtTick(Uint.from(887272).toString(), Uint.from(2).pow(128).sub(1).toString(), tokens[0].address, tokens[1].address);
			expect(quoteAmount).toBe(Uint.from('115783384785599357996676985412062652720342362943929506828539444553934033845703').toString());
		});

		it('token1: returns correct value when at max tick | sqrtRatioX96 > type(uint128).max', async () => {
			const quoteAmount = oracle.getQuoteAtTick(Uint.from(887272).toString(), Uint.from(2).pow(128).sub(1).toString(), tokens[1].address, tokens[0].address);
			expect(quoteAmount).toBe(Uint.from('1').toString());
		});
	});

	describe('#getOldestObservationSecondsAgo', () => {
		// some empty tick values as this function does not use them
		const emptySPL = [0, 0, 0, 0];
		const emptyTickCumulatives = [0, 0, 0, 0];
		const emptyTick = 0;
		const emptyLiquidity = 0;

		// helper function to run each test case identically
		const runOldestObservationsTest = async (blockTimestamps: number[], initializeds: boolean[], observationCardinality: number, observationIndex: number) => {
			const mockObservations = new MockObservations(
				blockTimestamps.map(t => t.toString()),
				emptyTickCumulatives.map(t => t.toString()),
				emptySPL.map(t => t.toString()),
				initializeds,
				emptyTick.toString(),
				observationCardinality.toString(),
				observationIndex.toString(),
				false,
				emptyLiquidity.toString(),
			);

			const result = oracle.getOldestObservationSecondsAgo(mockObservations, blockTimestamp.toString());

			// calculate seconds ago
			let secondsAgo = 0;
			if (initializeds[(observationIndex + 1) % observationCardinality]) {
				secondsAgo = blockTimestamp - blockTimestamps[(observationIndex + 1) % observationCardinality];
			} else {
				secondsAgo = blockTimestamp - blockTimestamps[0];
			}

			if (secondsAgo < 0) {
				secondsAgo += 2 ** 32;
			}

			expect(result).toBe(secondsAgo.toString());
		};

		it('fetches the oldest timestamp from the slot after observationIndex', async () => {
			// set up test case
			const blockTimestamps = [2, 3, 1, 0];
			const initializeds = [true, true, true, false];
			const observationCardinality = 3;
			const observationIndex = 1;

			// run test
			await runOldestObservationsTest(blockTimestamps, initializeds, observationCardinality, observationIndex);
		});

		it('loops to fetches the oldest timestamp from index 0', async () => {
			// set up test case
			const blockTimestamps = [1, 2, 3, 0];
			const initializeds = [true, true, true, false];
			const observationCardinality = 3;
			const observationIndex = 2;

			// run test
			await runOldestObservationsTest(blockTimestamps, initializeds, observationCardinality, observationIndex);
		});

		it('fetches from index 0 if the next index is uninitialized', async () => {
			// set up test case
			const blockTimestamps = [1, 2, 0, 0];
			const initializeds = [true, true, false, false];
			const observationCardinality = 4;
			const observationIndex = 1;

			// run test
			await runOldestObservationsTest(blockTimestamps, initializeds, observationCardinality, observationIndex);
		});

		it('reverts if the pool is not initialized', async () => {
			const blockTimestamps = [0, 0, 0, 0];
			const initializeds = [false, false, false, false];
			const observationCardinality = 0;
			const observationIndex = 0;
			const mockObservations = new MockObservations(
				blockTimestamps.map(t => t.toString()),
				emptyTickCumulatives.map(t => t.toString()),
				emptySPL.map(t => t.toString()),
				initializeds,
				emptyTick.toString(),
				observationCardinality.toString(),
				observationIndex.toString(),
				false,
				emptyLiquidity.toString(),
			);

			await expect((async () => oracle.getOldestObservationSecondsAgo(mockObservations, blockTimestamp.toString()))()).rejects.toThrow('NI');
		});

		it('fetches the correct timestamp when the timestamps overflow', async () => {
			// set up test case
			const maxUint32 = 2 ** 32 - 1;
			const blockTimestamps = [maxUint32, 3, maxUint32 - 2, 0];
			const initializeds = [true, true, true, false];
			const observationCardinality = 3;
			const observationIndex = 1;

			// run test
			await runOldestObservationsTest(blockTimestamps, initializeds, observationCardinality, observationIndex);
		});
	});

	describe('#getBlockStartingTickAndLiquidity', () => {
		let mockObservations: MockObservations;
		let blockTimestamps: number[];
		let tickCumulatives: number[];
		let liquidityValues: Uint[];
		let initializeds: boolean[];
		let slot0Tick: number;
		let observationCardinality: number;
		let observationIndex: number;
		let lastObservationCurrentTimestamp: boolean;
		let liquidity: number;

		const deployMockObservationsContract = async () => {
			mockObservations = new MockObservations(
				blockTimestamps.map(t => t.toString()),
				tickCumulatives.map(t => t.toString()),
				liquidityValues.map(t => t.toString()),
				initializeds,
				slot0Tick.toString(),
				observationCardinality.toString(),
				observationIndex.toString(),
				lastObservationCurrentTimestamp,
				liquidity.toString(),
			);
		};

		it('reverts if the pool is not initialized', async () => {
			blockTimestamps = [0, 0, 0, 0];
			tickCumulatives = [0, 0, 0, 0];
			liquidityValues = [BN0, BN0, BN0, BN0];
			initializeds = [false, false, false, false];
			slot0Tick = 0;
			observationCardinality = 0;
			observationIndex = 0;
			lastObservationCurrentTimestamp = false;
			liquidity = 0;

			await deployMockObservationsContract();

			await expect((async () => oracle.getBlockStartingTickAndLiquidity(mockObservations, blockTimestamp.toString()))()).rejects.toThrow('NEO');
		});

		it('returns the tick and liquidity in storage if the latest observation was in a previous block', async () => {
			blockTimestamps = [1, 3, 4, 0];
			// 0
			// 8: 0 + (4*(3-1))
			// 13: 8 + (5*(4-3))
			tickCumulatives = [0, 8, 13, 0];
			// 0
			// (1): 0 + ((3-1)*2**128)/5000
			// (1) + ((4-3)*2**128)/7000
			liquidityValues = [BN0, Uint.from('136112946768375385385349842972707284'), Uint.from('184724713471366594451546215462959885'), BN0];
			initializeds = [true, true, true, false];
			observationCardinality = 3;
			observationIndex = 2;
			slot0Tick = 6;
			lastObservationCurrentTimestamp = false;
			liquidity = 10000;

			await deployMockObservationsContract();

			const result = oracle.getBlockStartingTickAndLiquidity(mockObservations, blockTimestamp.toString());
			expect(result[0]).toBe(slot0Tick.toString());
			expect(result[1]).toBe(liquidity.toString());
		});

		// lastObservationCurrentTimestamp behavior
		it('reverts if it needs 2 observations and doesnt have them', async () => {
			blockTimestamps = [1, 0, 0, 0];
			tickCumulatives = [8, 0, 0, 0];
			liquidityValues = [Uint.from('136112946768375385385349842972707284'), BN0, BN0, BN0];
			initializeds = [true, false, false, false];
			observationCardinality = 1;
			observationIndex = 0;
			slot0Tick = 4;
			lastObservationCurrentTimestamp = true;
			liquidity = 10000;

			await deployMockObservationsContract();

			mockObservations.observationsTimestamp(blockTimestamp.toString());
			await expect((async () => oracle.getBlockStartingTickAndLiquidity(mockObservations, blockTimestamp.toString()))()).rejects.toThrow('NEO');
		});

		// lastObservationCurrentTimestamp behavior
		it('reverts if the prior observation needed is not initialized', async () => {
			blockTimestamps = [1, 0, 0, 0];
			observationCardinality = 2;
			observationIndex = 0;
			liquidityValues = [Uint.from('136112946768375385385349842972707284'), BN0, BN0, BN0];
			initializeds = [true, false, false, false];
			tickCumulatives = [8, 0, 0, 0];
			slot0Tick = 4;
			lastObservationCurrentTimestamp = true;
			liquidity = 10000;

			await deployMockObservationsContract();

			mockObservations.observationsTimestamp(blockTimestamp.toString());
			await expect((async () => oracle.getBlockStartingTickAndLiquidity(mockObservations, blockTimestamp.toString()))()).rejects.toThrow('ONI');
		});

		// lastObservationCurrentTimestamp behavior
		it('calculates the prior tick and liquidity from the prior observations', async () => {
			blockTimestamps = [9, 5, 8, 0];
			observationCardinality = 3;
			observationIndex = 0;
			initializeds = [true, true, true, false];
			// 99: 95 + (4*1)
			// 80: 72 + (4*2)
			// 95: 80 + (5*3)
			tickCumulatives = [99, 80, 95, 0];
			// prev: 784724713471366594451546215462959885
			// (3): (2) + (1*2**128)/13212
			// (1): prev + (2*2**128)/12345
			// (2): (1) + (3*2**128)/10238
			liquidityValues = [Uint.from('965320616647837491242414421221086683'), Uint.from('839853488995212437053956034406948254'), Uint.from('939565063595995342933046073701273770'), BN0];
			slot0Tick = 3;
			lastObservationCurrentTimestamp = true;
			liquidity = 10000;

			await deployMockObservationsContract();

			mockObservations.observationsTimestamp(blockTimestamp.toString());
			const result = oracle.getBlockStartingTickAndLiquidity(mockObservations, blockTimestamp.toString());

			const actualStartingTick = (tickCumulatives[0] - tickCumulatives[2]) / (blockTimestamps[0] - blockTimestamps[2]);
			expect(result[0]).toBe(actualStartingTick.toString());

			const actualStartingLiquidity = 13212; // see comments above
			expect(result[1]).toBe(actualStartingLiquidity.toString());
		});
	});

	describe('#getWeightedArithmeticMeanTick', () => {
		it('single observation returns average tick', async () => {
			const observation = { tick: '10', weight: '10' };

			const oracleTick = oracle.getWeightedArithmeticMeanTick([observation]);

			expect(oracleTick).toBe('10');
		});

		it('multiple observations with same weight result in average across tiers', async () => {
			const observation1 = { tick: '10', weight: '10' };
			const observation2 = { tick: '20', weight: '10' };

			const oracleTick = oracle.getWeightedArithmeticMeanTick([observation1, observation2]);

			expect(oracleTick).toBe('15');
		});

		it('multiple observations with different weights are weighted correctly', async () => {
			const observation2 = { tick: '20', weight: '15' };
			const observation1 = { tick: '10', weight: '10' };

			const oracleTick = oracle.getWeightedArithmeticMeanTick([observation1, observation2]);

			expect(oracleTick).toBe('16');
		});

		it('correct rounding for .5 negative tick', async () => {
			const observation1 = { tick: '-10', weight: '10' };
			const observation2 = { tick: '-11', weight: '10' };

			const oracleTick = oracle.getWeightedArithmeticMeanTick([observation1, observation2]);

			expect(oracleTick).toBe('-11');
		});
	});
	describe('#getChainedPrice', () => {
		let ticks: string[];

		it('fails with discrepant length', async () => {
			const tokenAddresses = [tokens[0].address, tokens[2].address];
			ticks = ['5', '5'];

			await expect((async () => oracle.getChainedPrice(tokenAddresses, ticks))()).rejects.toThrow('DL');
		});
		it('add two positive ticks, sorted order', async () => {
			const tokenAddresses = [tokens[0].address, tokens[1].address, tokens[2].address];
			ticks = ['5', '5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('10');
		});
		it('add one positive and one negative tick, sorted order', async () => {
			const tokenAddresses = [tokens[0].address, tokens[1].address, tokens[2].address];
			ticks = ['5', '-5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('0');
		});
		it('add one negative and one positive tick, sorted order', async () => {
			const tokenAddresses = [tokens[0].address, tokens[1].address, tokens[2].address];
			ticks = ['-5', '5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('0');
		});
		it('add two negative ticks, sorted order', async () => {
			const tokenAddresses = [tokens[0].address, tokens[1].address, tokens[2].address];
			ticks = ['-5', '-5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('-10');
		});

		it('add two positive ticks, token0/token1 + token1/token0', async () => {
			const tokenAddresses = [tokens[0].address, tokens[2].address, tokens[1].address];
			ticks = ['5', '5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('0');
		});
		it('add one positive tick and one negative tick, token0/token1 + token1/token0', async () => {
			const tokenAddresses = [tokens[0].address, tokens[2].address, tokens[1].address];
			ticks = ['5', '-5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('10');
		});
		it('add one negative tick and one positive tick, token0/token1 + token1/token0', async () => {
			const tokenAddresses = [tokens[0].address, tokens[2].address, tokens[1].address];
			ticks = ['-5', '5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('-10');
		});
		it('add two negative ticks, token0/token1 + token1/token0', async () => {
			const tokenAddresses = [tokens[0].address, tokens[2].address, tokens[1].address];
			ticks = ['-5', '-5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('0');
		});

		it('add two positive ticks, token1/token0 + token0/token1', async () => {
			const tokenAddresses = [tokens[1].address, tokens[0].address, tokens[2].address];
			ticks = ['5', '5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('0');
		});
		it('add one positive tick and one negative tick, token1/token0 + token0/token1', async () => {
			const tokenAddresses = [tokens[1].address, tokens[0].address, tokens[2].address];
			ticks = ['5', '-5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('-10');
		});
		it('add one negative tick and one positive tick, token1/token0 + token0/token1', async () => {
			const tokenAddresses = [tokens[1].address, tokens[0].address, tokens[2].address];
			ticks = ['-5', '5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('10');
		});
		it('add two negative ticks, token1/token0 + token0/token1', async () => {
			const tokenAddresses = [tokens[1].address, tokens[0].address, tokens[2].address];
			ticks = ['-5', '-5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('0');
		});

		it('add two positive ticks, token0/token1 + token1/token0 - 2', async () => {
			const tokenAddresses = [tokens[1].address, tokens[2].address, tokens[0].address];
			ticks = ['5', '5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('0');
		});
		it('add one positive tick and one negative tick, token0/token1 + token1/token0 - 2', async () => {
			const tokenAddresses = [tokens[1].address, tokens[2].address, tokens[0].address];
			ticks = ['5', '-5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('10');
		});
		it('add one negative tick and one positive tick, token0/token1 + token1/token0 - 3', async () => {
			const tokenAddresses = [tokens[1].address, tokens[2].address, tokens[0].address];
			ticks = ['-5', '5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('-10');
		});
		it('add two negative ticks, token0/token1 + token1/token0 - 2', async () => {
			const tokenAddresses = [tokens[1].address, tokens[2].address, tokens[0].address];
			ticks = ['-5', '-5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('0');
		});

		it('add two positive ticks, token1/token0 + token0/token1 - 2', async () => {
			const tokenAddresses = [tokens[2].address, tokens[0].address, tokens[1].address];
			ticks = ['5', '5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('0');
		});
		it('add one positive tick and one negative tick, token1/token0 + token0/token1 - 2', async () => {
			const tokenAddresses = [tokens[2].address, tokens[0].address, tokens[1].address];
			ticks = ['5', '-5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('-10');
		});
		it('add one negative tick and one positive tick, token1/token0 + token0/token1 - 2', async () => {
			const tokenAddresses = [tokens[2].address, tokens[0].address, tokens[1].address];
			ticks = ['-5', '5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('10');
		});
		it('add two negative ticks, token1/token0 + token0/token1 - 2', async () => {
			const tokenAddresses = [tokens[2].address, tokens[0].address, tokens[1].address];
			ticks = ['-5', '-5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('0');
		});

		it('add two positive ticks, token1/token0 + token1/token0', async () => {
			const tokenAddresses = [tokens[2].address, tokens[1].address, tokens[0].address];
			ticks = ['5', '5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('-10');
		});
		it('add one positive tick and one negative tick, token1/token0 + token1/token0', async () => {
			const tokenAddresses = [tokens[2].address, tokens[1].address, tokens[0].address];
			ticks = ['5', '-5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('0');
		});
		it('add one negative tick and one positive tick, token1/token0 + token1/token0', async () => {
			const tokenAddresses = [tokens[2].address, tokens[1].address, tokens[0].address];
			ticks = ['-5', '5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('0');
		});
		it('add two negative ticks, token1/token0 + token1/token0', async () => {
			const tokenAddresses = [tokens[2].address, tokens[1].address, tokens[0].address];
			ticks = ['-5', '-5'];
			const oracleTick = oracle.getChainedPrice(tokenAddresses, ticks);

			expect(oracleTick).toBe('10');
		});
	});
});
