import * as HexStrings from '../../../../../../../src/app/modules/dex/stores/library/periphery/hex_strings';

const TO_HEX_STRING_NO_PREFIX_TESTS: { value: number; length: number; expected: string }[] = [
	{ value: 525, length: 2, expected: '020d' },
];

describe('toHexString', () => {
	TO_HEX_STRING_NO_PREFIX_TESTS.forEach(test => {
		it(`should return ${test.expected} for toHexString(${test.value}, ${test.length})`, () => {
			expect(HexStrings.toHexString(test.value, test.length)).toStrictEqual(test.expected);
		});
	});
});
