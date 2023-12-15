import { formatSqrtRatioX96 } from './formatSqrtRatioX96';
import { encodePriceSqrt } from './utilities';

describe('#formatSqrtRatioX96', () => {
	it('is correct for 9_999_999/10_000_000', () => {
		expect(formatSqrtRatioX96(encodePriceSqrt(9_999_999, 10_000_000).toString())).toBe('1.0000');
	});
	it('is correct for 9_999_999/1', () => {
		expect(formatSqrtRatioX96(encodePriceSqrt(9_999_999, 1).toString())).toBe('10000000');
	});
	it('is correct for 1/3', () => {
		expect(formatSqrtRatioX96(encodePriceSqrt(1, 3).toString())).toBe('0.33333');
	});
	it('is correct for 100/3', () => {
		expect(formatSqrtRatioX96(encodePriceSqrt(100, 3).toString())).toBe('33.333');
	});
	it('is correct for 1_000_000/3', () => {
		expect(formatSqrtRatioX96(encodePriceSqrt(1_000_000, 3).toString())).toBe('333330');
	});
	it('1e-18 still prints 5 sig figs', () => {
		expect(formatSqrtRatioX96(encodePriceSqrt(1, 1e18).toString(), 18, 18)).toBe(
			'0.0000000000000000010000',
		);
	});
	it('accounts for decimal differences', () => {
		expect(formatSqrtRatioX96(encodePriceSqrt(1e6, 1e18).toString(), 18, 6)).toBe('1.0000');
	});
	it('accounts for decimal differences in reverse', () => {
		expect(formatSqrtRatioX96(encodePriceSqrt(1e18, 1e6).toString(), 6, 18)).toBe('1.0000');
	});
});
