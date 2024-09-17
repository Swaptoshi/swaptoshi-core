/* eslint-disable no-return-assign */
import { StateMachine } from 'klayr-sdk';
import * as tickTest from '../../../../../../../src/app/modules/dex/stores/library/core/tick';
import { TickInfoStore } from '../../../../../../../src/app/modules/dex/stores/tick_info';
import { TickInfo } from '../../../../../../../src/app/modules/dex/types';
import { methodContextFixture } from '../../shared/module';
import { FeeAmount, MaxUint128, TICK_SPACINGS, getMaxLiquidityPerTick } from '../../shared/utilities';
import { Uint256 } from '../../../../../../../src/app/modules/dex/stores/library/int';

const POOL_ADDRESS = Buffer.from('0000000000000000000000000000000000000000', 'hex');

describe('Tick', () => {
	let tickInfoStore: TickInfoStore;
	let createMethodContext: () => StateMachine.MethodContext;
	let methodContext: StateMachine.MethodContext;

	async function setTick(tickNumber: string, info: TickInfo) {
		await tickInfoStore.set(methodContext, tickInfoStore.getKey(POOL_ADDRESS, tickNumber), info);
	}

	async function getTick(tickNumber: string) {
		return tickInfoStore.getOrDefault(methodContext, tickInfoStore.getKey(POOL_ADDRESS, tickNumber));
	}

	beforeEach(async () => {
		({ tickInfoStore, createMethodContext } = await methodContextFixture());
		methodContext = createMethodContext();
	});

	describe('#tickSpacingToMaxLiquidityPerTick', () => {
		it('returns the correct value for low fee', () => {
			const maxLiquidityPerTick = tickTest.tickSpacingToMaxLiquidityPerTick(TICK_SPACINGS[FeeAmount.LOW]);
			expect(maxLiquidityPerTick).toBe('1917569901783203986719870431555990'); // 110.8 bits
			expect(maxLiquidityPerTick).toBe(getMaxLiquidityPerTick(TICK_SPACINGS[FeeAmount.LOW]));
		});
		it('returns the correct value for medium fee', () => {
			const maxLiquidityPerTick = tickTest.tickSpacingToMaxLiquidityPerTick(TICK_SPACINGS[FeeAmount.MEDIUM]);
			expect(maxLiquidityPerTick).toBe('11505743598341114571880798222544994'); // 113.1 bits
			expect(maxLiquidityPerTick).toBe(getMaxLiquidityPerTick(TICK_SPACINGS[FeeAmount.MEDIUM]));
		});
		it('returns the correct value for high fee', () => {
			const maxLiquidityPerTick = tickTest.tickSpacingToMaxLiquidityPerTick(TICK_SPACINGS[FeeAmount.HIGH]);
			expect(maxLiquidityPerTick).toBe('38350317471085141830651933667504588'); // 114.7 bits
			expect(maxLiquidityPerTick).toBe(getMaxLiquidityPerTick(TICK_SPACINGS[FeeAmount.HIGH]));
		});
		it('returns the correct value for entire range', () => {
			const maxLiquidityPerTick = tickTest.tickSpacingToMaxLiquidityPerTick('887272');
			expect(maxLiquidityPerTick).toBe(MaxUint128.div(3).toString()); // 126 bits
			expect(maxLiquidityPerTick).toBe(getMaxLiquidityPerTick('887272'));
		});
		it('returns the correct value for 2302', () => {
			const maxLiquidityPerTick = tickTest.tickSpacingToMaxLiquidityPerTick('2302');
			expect(maxLiquidityPerTick).toBe('441351967472034323558203122479595605'); // 118 bits
			expect(maxLiquidityPerTick).toBe(getMaxLiquidityPerTick('2302'));
		});
	});

	describe('#getFeeGrowthInside', () => {
		it('returns all for two uninitialized ticks if tick is inside', async () => {
			const [feeGrowthInside0X128, feeGrowthInside1X128] = await tickTest.getFeeGrowthInside(tickInfoStore, methodContext, POOL_ADDRESS, '-2', '2', '0', '15', '15');
			expect(feeGrowthInside0X128).toBe('15');
			expect(feeGrowthInside1X128).toBe('15');
		});
		it('returns 0 for two uninitialized ticks if tick is above', async () => {
			const [feeGrowthInside0X128, feeGrowthInside1X128] = await tickTest.getFeeGrowthInside(tickInfoStore, methodContext, POOL_ADDRESS, '-2', '2', '4', '15', '15');
			expect(feeGrowthInside0X128).toBe('0');
			expect(feeGrowthInside1X128).toBe('0');
		});
		it('returns 0 for two uninitialized ticks if tick is below', async () => {
			const [feeGrowthInside0X128, feeGrowthInside1X128] = await tickTest.getFeeGrowthInside(tickInfoStore, methodContext, POOL_ADDRESS, '-2', '2', '-4', '15', '15');
			expect(feeGrowthInside0X128).toBe('0');
			expect(feeGrowthInside1X128).toBe('0');
		});

		it('subtracts upper tick if below', async () => {
			await setTick('2', {
				feeGrowthOutside0X128: '2',
				feeGrowthOutside1X128: '3',
				liquidityGross: '0',
				liquidityNet: '0',
				secondsPerLiquidityOutsideX128: '0',
				tickCumulativeOutside: '0',
				secondsOutside: '0',
				initialized: true,
			});
			const [feeGrowthInside0X128, feeGrowthInside1X128] = await tickTest.getFeeGrowthInside(tickInfoStore, methodContext, POOL_ADDRESS, '-2', '2', '0', '15', '15');
			expect(feeGrowthInside0X128).toBe('13');
			expect(feeGrowthInside1X128).toBe('12');
		});

		it('subtracts lower tick if above', async () => {
			await setTick('-2', {
				feeGrowthOutside0X128: '2',
				feeGrowthOutside1X128: '3',
				liquidityGross: '0',
				liquidityNet: '0',
				secondsPerLiquidityOutsideX128: '0',
				tickCumulativeOutside: '0',
				secondsOutside: '0',
				initialized: true,
			});
			const [feeGrowthInside0X128, feeGrowthInside1X128] = await tickTest.getFeeGrowthInside(tickInfoStore, methodContext, POOL_ADDRESS, '-2', '2', '0', '15', '15');
			expect(feeGrowthInside0X128).toBe('13');
			expect(feeGrowthInside1X128).toBe('12');
		});

		it('subtracts upper and lower tick if inside', async () => {
			await setTick('-2', {
				feeGrowthOutside0X128: '2',
				feeGrowthOutside1X128: '3',
				liquidityGross: '0',
				liquidityNet: '0',
				secondsPerLiquidityOutsideX128: '0',
				tickCumulativeOutside: '0',
				secondsOutside: '0',
				initialized: true,
			});
			await setTick('2', {
				feeGrowthOutside0X128: '4',
				feeGrowthOutside1X128: '1',
				liquidityGross: '0',
				liquidityNet: '0',
				secondsPerLiquidityOutsideX128: '0',
				tickCumulativeOutside: '0',
				secondsOutside: '0',
				initialized: true,
			});
			const [feeGrowthInside0X128, feeGrowthInside1X128] = await tickTest.getFeeGrowthInside(tickInfoStore, methodContext, POOL_ADDRESS, '-2', '2', '0', '15', '15');
			expect(feeGrowthInside0X128).toBe('9');
			expect(feeGrowthInside1X128).toBe('11');
		});

		it('works correctly with overflow on inside tick', async () => {
			await setTick('-2', {
				feeGrowthOutside0X128: Uint256.from(Uint256.MAX).sub(3).toString(),
				feeGrowthOutside1X128: Uint256.from(Uint256.MAX).sub(2).toString(),
				liquidityGross: '0',
				liquidityNet: '0',
				secondsPerLiquidityOutsideX128: '0',
				tickCumulativeOutside: '0',
				secondsOutside: '0',
				initialized: true,
			});
			await setTick('2', {
				feeGrowthOutside0X128: '3',
				feeGrowthOutside1X128: '5',
				liquidityGross: '0',
				liquidityNet: '0',
				secondsPerLiquidityOutsideX128: '0',
				tickCumulativeOutside: '0',
				secondsOutside: '0',
				initialized: true,
			});
			const [feeGrowthInside0X128, feeGrowthInside1X128] = await tickTest.getFeeGrowthInside(tickInfoStore, methodContext, POOL_ADDRESS, '-2', '2', '0', '15', '15');
			expect(feeGrowthInside0X128).toBe('16');
			expect(feeGrowthInside1X128).toBe('13');
		});
	});

	describe('#update', () => {
		it('flips from zero to nonzero', async () => {
			expect((await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '0', '0', '1', '0', '0', '0', '0', '0', false, '3'))[0]).toBe(true);
		});
		it('does not flip from nonzero to greater nonzero', async () => {
			await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '0', '0', '1', '0', '0', '0', '0', '0', false, '3');
			expect((await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '0', '0', '1', '0', '0', '0', '0', '0', false, '3'))[0]).toBe(false);
		});
		it('flips from nonzero to zero', async () => {
			await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '0', '0', '1', '0', '0', '0', '0', '0', false, '3');
			expect((await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '0', '0', '-1', '0', '0', '0', '0', '0', false, '3'))[0]).toBe(true);
		});
		it('does not flip from nonzero to lesser nonzero', async () => {
			await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '0', '0', '2', '0', '0', '0', '0', '0', false, '3');
			expect((await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '0', '0', '-1', '0', '0', '0', '0', '0', false, '3'))[0]).toBe(false);
		});
		it('does not flip from nonzero to lesser nonzero - 2', async () => {
			await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '0', '0', '2', '0', '0', '0', '0', '0', false, '3');
			expect((await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '0', '0', '-1', '0', '0', '0', '0', '0', false, '3'))[0]).toBe(false);
		});
		it('reverts if total liquidity gross is greater than max', async () => {
			const func = async () => {
				await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '0', '0', '2', '0', '0', '0', '0', '0', false, '3');
				await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '0', '0', '1', '0', '0', '0', '0', '0', true, '3');
				await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '0', '0', '1', '0', '0', '0', '0', '0', false, '3');
			};
			await expect(func()).rejects.toThrow('LO');
		});
		it('nets the liquidity based on upper flag', async () => {
			await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '0', '0', '2', '0', '0', '0', '0', '0', false, '10');
			await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '0', '0', '1', '0', '0', '0', '0', '0', true, '10');
			await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '0', '0', '3', '0', '0', '0', '0', '0', true, '10');
			await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '0', '0', '1', '0', '0', '0', '0', '0', false, '10');
			const { liquidityGross, liquidityNet } = await getTick('0');
			expect(liquidityGross).toBe((2 + 1 + 3 + 1).toString());
			expect(liquidityNet).toBe((2 - 1 - 3 + 1).toString());
		});
		it('reverts on overflow liquidity gross', async () => {
			const func = async () => {
				await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '0', '0', MaxUint128.div(2).sub(1).toString(), '0', '0', '0', '0', '0', false, MaxUint128.toString());

				await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '0', '0', MaxUint128.div(2).sub(1).toString(), '0', '0', '0', '0', '0', false, MaxUint128.toString());
			};
			await expect(func()).rejects.toThrow();
		});
		it('assumes all growth happens below ticks lte current tick', async () => {
			await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '1', '1', '1', '1', '2', '3', '4', '5', false, MaxUint128.toString());
			const { feeGrowthOutside0X128, feeGrowthOutside1X128, secondsOutside, secondsPerLiquidityOutsideX128, tickCumulativeOutside, initialized } = await getTick('1');
			expect(feeGrowthOutside0X128).toBe('1');
			expect(feeGrowthOutside1X128).toBe('2');
			expect(secondsPerLiquidityOutsideX128).toBe('3');
			expect(tickCumulativeOutside).toBe('4');
			expect(secondsOutside).toBe('5');
			expect(initialized).toBe(true);
		});
		it('does not set any growth fields if tick is already initialized', async () => {
			await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '1', '1', '1', '1', '2', '3', '4', '5', false, MaxUint128.toString());
			await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '1', '1', '1', '6', '7', '8', '9', '10', false, MaxUint128.toString());
			const { feeGrowthOutside0X128, feeGrowthOutside1X128, secondsOutside, secondsPerLiquidityOutsideX128, tickCumulativeOutside, initialized } = await getTick('1');
			expect(feeGrowthOutside0X128).toBe('1');
			expect(feeGrowthOutside1X128).toBe('2');
			expect(secondsPerLiquidityOutsideX128).toBe('3');
			expect(tickCumulativeOutside).toBe('4');
			expect(secondsOutside).toBe('5');
			expect(initialized).toBe(true);
		});
		it('does not set any growth fields for ticks gt current tick', async () => {
			await tickTest.update(tickInfoStore, methodContext, POOL_ADDRESS, '2', '1', '1', '1', '2', '3', '4', '5', false, MaxUint128.toString());
			const { feeGrowthOutside0X128, feeGrowthOutside1X128, secondsOutside, secondsPerLiquidityOutsideX128, tickCumulativeOutside, initialized } = await getTick('2');
			expect(feeGrowthOutside0X128).toBe('0');
			expect(feeGrowthOutside1X128).toBe('0');
			expect(secondsPerLiquidityOutsideX128).toBe('0');
			expect(tickCumulativeOutside).toBe('0');
			expect(secondsOutside).toBe('0');
			expect(initialized).toBe(true);
		});
	});

	// this is skipped because the presence of the method causes slither to fail
	describe('#clear', () => {
		it('deletes all the data in the tick', async () => {
			await setTick('2', {
				feeGrowthOutside0X128: '1',
				feeGrowthOutside1X128: '2',
				liquidityGross: '3',
				liquidityNet: '4',
				secondsPerLiquidityOutsideX128: '5',
				tickCumulativeOutside: '6',
				secondsOutside: '7',
				initialized: true,
			});
			await tickTest.clear(tickInfoStore, methodContext, POOL_ADDRESS, '2');
			const { feeGrowthOutside0X128, feeGrowthOutside1X128, secondsOutside, secondsPerLiquidityOutsideX128, liquidityGross, tickCumulativeOutside, liquidityNet, initialized } = await getTick('2');
			expect(feeGrowthOutside0X128).toBe('0');
			expect(feeGrowthOutside1X128).toBe('0');
			expect(secondsOutside).toBe('0');
			expect(secondsPerLiquidityOutsideX128).toBe('0');
			expect(tickCumulativeOutside).toBe('0');
			expect(liquidityGross).toBe('0');
			expect(liquidityNet).toBe('0');
			expect(initialized).toBe(false);
		});
	});

	describe('#cross', () => {
		it('flips the growth variables', async () => {
			await setTick('2', {
				feeGrowthOutside0X128: '1',
				feeGrowthOutside1X128: '2',
				liquidityGross: '3',
				liquidityNet: '4',
				secondsPerLiquidityOutsideX128: '5',
				tickCumulativeOutside: '6',
				secondsOutside: '7',
				initialized: true,
			});
			await tickTest.cross(tickInfoStore, methodContext, POOL_ADDRESS, '2', '7', '9', '8', '15', '10');
			const { feeGrowthOutside0X128, feeGrowthOutside1X128, secondsOutside, tickCumulativeOutside, secondsPerLiquidityOutsideX128 } = await getTick('2');
			expect(feeGrowthOutside0X128).toBe('6');
			expect(feeGrowthOutside1X128).toBe('7');
			expect(secondsPerLiquidityOutsideX128).toBe('3');
			expect(tickCumulativeOutside).toBe('9');
			expect(secondsOutside).toBe('3');
		});
		it('two flips are no op', async () => {
			await setTick('2', {
				feeGrowthOutside0X128: '1',
				feeGrowthOutside1X128: '2',
				liquidityGross: '3',
				liquidityNet: '4',
				secondsPerLiquidityOutsideX128: '5',
				tickCumulativeOutside: '6',
				secondsOutside: '7',
				initialized: true,
			});
			await tickTest.cross(tickInfoStore, methodContext, POOL_ADDRESS, '2', '7', '9', '8', '15', '10');
			await tickTest.cross(tickInfoStore, methodContext, POOL_ADDRESS, '2', '7', '9', '8', '15', '10');
			const { feeGrowthOutside0X128, feeGrowthOutside1X128, secondsOutside, tickCumulativeOutside, secondsPerLiquidityOutsideX128 } = await getTick('2');
			expect(feeGrowthOutside0X128).toBe('1');
			expect(feeGrowthOutside1X128).toBe('2');
			expect(secondsPerLiquidityOutsideX128).toBe('5');
			expect(tickCumulativeOutside).toBe('6');
			expect(secondsOutside).toBe('7');
		});
	});
});
