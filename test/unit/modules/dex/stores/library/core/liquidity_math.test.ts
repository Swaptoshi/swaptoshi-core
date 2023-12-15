/* eslint-disable @typescript-eslint/require-await */
import { Uint } from '../../../../../../../src/app/modules/dex/stores/library/int';
import * as liquidityMath from '../../../../../../../src/app/modules/dex/stores/library/core/liquidity_math';

describe('LiquidityMath', () => {
	describe('#addDelta', () => {
		it('1 + 0', () => {
			expect(liquidityMath.addDelta('1', '0')).toBe('1');
		});
		it('1 + -1', () => {
			expect(liquidityMath.addDelta('1', '-1')).toBe('0');
		});
		it('1 + 1', () => {
			expect(liquidityMath.addDelta('1', '1')).toBe('2');
		});
		it('2**128-15 + 15 overflows', async () => {
			const func = async () => {
				liquidityMath.addDelta(Uint.from(2).pow(128).sub(15).toString(), '15');
			};
			await expect(func()).rejects.toThrow('LA');
		});
		it('0 + -1 underflows', async () => {
			const func = async () => {
				liquidityMath.addDelta('0', '-1');
			};
			await expect(func()).rejects.toThrow('LS');
		});
		it('3 + -4 underflows', async () => {
			const func = async () => {
				liquidityMath.addDelta('3', '-4');
			};
			await expect(func()).rejects.toThrow('LS');
		});
	});
});
