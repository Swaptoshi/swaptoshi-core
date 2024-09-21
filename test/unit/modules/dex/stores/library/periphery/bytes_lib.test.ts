import * as BytesLib from '../../../../../../../src/app/modules/dex/stores/library/periphery/bytes_lib';

const sliceBytes = Buffer.from('f00d0000000000000000000000000000000000000000000000000000000000feedf00d00000000000000000000000000000000000000000000000000000000feed', 'hex');

const SLICE_TESTS: { input?: Buffer; start: number; length: number; expected: string }[] = [
	{ start: 0, length: 2, expected: 'f00d' },
	{ start: 1, length: 0, expected: '' },
	{ start: 0, length: 0, expected: '' },
	{ start: 31, length: 2, expected: 'feed' },
	{
		start: 0,
		length: 33,
		expected: 'f00d0000000000000000000000000000000000000000000000000000000000feed',
	},
	{
		start: 0,
		length: 32,
		expected: 'f00d0000000000000000000000000000000000000000000000000000000000fe',
	},
	{
		start: 0,
		length: 64,
		expected: 'f00d0000000000000000000000000000000000000000000000000000000000feedf00d00000000000000000000000000000000000000000000000000000000fe',
	},
];

describe('slice', () => {
	SLICE_TESTS.forEach(test => {
		it(`should return ${test.expected} for slice(${test.start}, ${test.length})`, () => {
			expect(BytesLib.slice(test.input ?? sliceBytes, test.start, test.length).toString('hex')).toStrictEqual(test.expected);
		});
	});
});

const toAddressBytes = Buffer.from('f00dfeed383Fa3B60f9B4AB7fBf6835d3c26C3765cD2B2e2f00dfeed', 'hex');

const TO_ADDRESS_TESTS: { input?: Buffer; start: number; expected: string }[] = [
	{ start: 4, expected: '383fa3b60f9b4ab7' },
	{ start: 6, expected: 'a3b60f9b4ab7fbf6' },
	{ start: 8, expected: '0f9b4ab7fbf6835d' },
	{ start: 5, expected: '3fa3b60f9b4ab7fb' },
	{ start: 1, expected: '0dfeed383fa3b60f' },
];

describe('toAddress', () => {
	TO_ADDRESS_TESTS.forEach(test => {
		it(`should return ${test.expected} for toAddress(${test.start})`, () => {
			expect(BytesLib.toAddress(test.input ?? toAddressBytes, test.start)).toStrictEqual(Buffer.from(test.expected, 'hex'));
		});
	});
});

const toUint24Bytes = Buffer.from('f00d1020feed', 'hex');

const TO_UINT24_TESTS: { input?: Buffer; start: number; expected: number }[] = [
	{ start: 1, expected: 856096 },
	{ start: 2, expected: 1057022 },
	{ start: 3, expected: 2162413 },
];

describe('toUint24', () => {
	TO_UINT24_TESTS.forEach(test => {
		it(`should return ${test.expected} for toUint24(${test.start})`, () => {
			expect(BytesLib.toUint24(test.input ?? toUint24Bytes, test.start)).toStrictEqual(test.expected);
		});
	});
});
