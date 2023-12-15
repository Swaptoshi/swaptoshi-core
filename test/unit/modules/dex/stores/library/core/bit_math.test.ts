/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/await-thenable */
import * as bitMath from '../../../../../../../src/app/modules/dex/stores/library/core/bit_math';

describe('BitMath', () => {
	describe('#mostSignificantBit', () => {
		it('0', async () => {
			const func = async () => {
				bitMath.mostSignificantBit('0');
			};
			await expect(func()).rejects.toThrow();
		});
		it('1', () => {
			expect(bitMath.mostSignificantBit('1')).toBe('0');
		});
		it('2', () => {
			expect(bitMath.mostSignificantBit('2')).toBe('1');
		});
		it('all powers of 2', async () => {
			const results = await Promise.all(
				[...Array(255)].map((_, i) =>
					bitMath.mostSignificantBit((BigInt(2) ** BigInt(i)).toString()),
				),
			);
			expect(results).toStrictEqual([...Array(255)].map((_, i) => i.toString()));
		});
		it('uint256(-1)', () => {
			expect(bitMath.mostSignificantBit((BigInt(2) ** BigInt(256) - BigInt(1)).toString())).toBe(
				'255',
			);
		});
	});

	describe('#leastSignificantBit', () => {
		it('0', async () => {
			const func = async () => {
				bitMath.leastSignificantBit('0');
			};
			await expect(func()).rejects.toThrow();
		});
		it('1', () => {
			expect(bitMath.leastSignificantBit('1')).toBe('0');
		});
		it('2', () => {
			expect(bitMath.leastSignificantBit('2')).toBe('1');
		});
		it('all powers of 2', async () => {
			const results = await Promise.all(
				[...Array(255)].map((_, i) =>
					bitMath.leastSignificantBit((BigInt(2) ** BigInt(i)).toString()),
				),
			);
			expect(results).toStrictEqual([...Array(255)].map((_, i) => i.toString()));
		});
		it('uint256(-1)', () => {
			expect(bitMath.leastSignificantBit((BigInt(2) ** BigInt(256) - BigInt(1)).toString())).toBe(
				'0',
			);
		});
	});
});
