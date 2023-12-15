/* eslint-disable @typescript-eslint/require-await */
import * as addressStringUtil from '../../../../../../../src/app/modules/dex/stores/library/periphery/address_string_util';

const example = Buffer.from('C257274276a4E539741Ca11b590B9447B26A8051', 'hex');

describe('AddressStringUtil', () => {
	describe('#toAsciiString', () => {
		it('zero address', () => {
			expect(addressStringUtil.toAsciiString(Buffer.alloc(20), '40')).toBe(
				Buffer.alloc(20).toString('hex'),
			);
		});
		it('random address', async () => {
			expect(addressStringUtil.toAsciiString(example, '40')).toBe(
				example.toString('hex').toUpperCase(),
			);
		});

		it('reverts if len % 2 != 0', async () => {
			await expect((async () => addressStringUtil.toAsciiString(example, '39'))()).rejects.toThrow(
				'AddressStringUtil: INVALID_LEN',
			);
		});

		it('reverts if len >= 40', async () => {
			await expect((async () => addressStringUtil.toAsciiString(example, '42'))()).rejects.toThrow(
				'AddressStringUtil: INVALID_LEN',
			);
		});

		it('reverts if len == 0', async () => {
			await expect((async () => addressStringUtil.toAsciiString(example, '0'))()).rejects.toThrow(
				'AddressStringUtil: INVALID_LEN',
			);
		});

		it('produces len characters', async () => {
			expect(addressStringUtil.toAsciiString(example, '4')).toBe(
				example.toString('hex').substring(0, 4).toUpperCase(),
			);
			expect(addressStringUtil.toAsciiString(example, '10')).toBe(
				example.toString('hex').substring(0, 10).toUpperCase(),
			);
			expect(addressStringUtil.toAsciiString(example, '16')).toBe(
				example.toString('hex').substring(0, 16).toUpperCase(),
			);
		});
	});
});
