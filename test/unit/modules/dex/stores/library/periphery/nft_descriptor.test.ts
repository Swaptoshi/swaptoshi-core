/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable prefer-destructuring */
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { MethodContext } from 'lisk-sdk';
import { Uint } from '../../../../../../../src/app/modules/dex/stores/library/int';
import { methodContextFixture } from '../../shared/module';
import { TEST_POOL_START_TIME, poolFixture } from '../../shared/pool';
import { methodSwapContext } from '../../../../../../../src/app/modules/dex/stores/context';
import { DexModule } from '../../../../../../../src/app/modules/dex/module';
import {
	FeeAmount,
	TICK_SPACINGS,
	encodePriceSqrt,
	getMaxTick,
	getMinTick,
} from '../../shared/utilities';
import { extractJSONFromURI } from '../../shared/extractJSONFromURI';
import { formatSqrtRatioX96 } from '../../shared/formatSqrtRatioX96';

import * as nftDescriptor from '../../../../../../../src/app/modules/dex/stores/library/periphery/nft_descriptor';
import * as NFTSVG from '../../../../../../../src/app/modules/dex/stores/library/periphery/nft_svg';

type Fixture<T> = (sender: Buffer) => Promise<T>;

const TEN = Uint.from(10);
const LOWEST_SQRT_RATIO = 4310618292;
const HIGHEST_SQRT_RATIO = Uint.from(33849).mul(TEN.pow(34));

const sender = Buffer.from('0000000000000000000000000000000000000000', 'hex');

function isSvg(string) {
	if (typeof string !== 'string') {
		throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
	}

	const _string = string.trim();

	if (_string.length === 0) {
		return false;
	}

	// Has to be `!==` as it can also return an object with error info.
	if (XMLValidator.validate(_string) !== true) {
		return false;
	}

	let jsonObject;
	const parser = new XMLParser();

	try {
		jsonObject = parser.parse(_string);
	} catch {
		return false;
	}

	if (!jsonObject) {
		return false;
	}

	if (!('svg' in jsonObject)) {
		return false;
	}

	return true;
}

interface Tokens {
	address: Buffer;
	symbol: () => string;
	decimals: () => string;
}

describe('NFTDescriptor', () => {
	let module: DexModule;
	let createMethodContext: () => MethodContext;

	const nftDescriptorFixture: Fixture<{ tokens: [Tokens, Tokens, Tokens, Tokens] }> = async (
		_sender: Buffer,
	) => {
		({ createMethodContext, module } = await methodContextFixture());
		const context = methodSwapContext(
			createMethodContext(),
			sender,
			parseInt(TEST_POOL_START_TIME, 10),
		);
		const {
			token0,
			token1,
			token2,
			token3,
			token0Decimal,
			token0Symbol,
			token1Decimal,
			token1Symbol,
			token2Decimal,
			token2Symbol,
			token3Decimal,
			token3Symbol,
		} = await poolFixture(context, module);

		const tokens: [Tokens, Tokens, Tokens, Tokens] = [
			{ address: token0, symbol: () => token0Symbol, decimals: () => token0Decimal },
			{ address: token1, symbol: () => token1Symbol, decimals: () => token1Decimal },
			{ address: token2, symbol: () => token2Symbol, decimals: () => token2Decimal },
			{ address: token3, symbol: () => token3Symbol, decimals: () => token3Decimal },
		];

		tokens.sort((a, b) =>
			a.address.toString('hex').toLowerCase() < b.address.toString('hex').toLowerCase() ? -1 : 1,
		);
		return { tokens };
	};

	let tokens: [Tokens, Tokens, Tokens, Tokens];

	beforeEach(async () => {
		({ tokens } = await nftDescriptorFixture(sender));
	});

	describe('#constructTokenURI', () => {
		let tokenId: string;
		let baseTokenAddress: Buffer;
		let quoteTokenAddress: Buffer;
		let baseTokenSymbol: string;
		let quoteTokenSymbol: string;
		let baseTokenDecimals: string;
		let quoteTokenDecimals: string;
		let flipRatio: boolean;
		let tickLower: string;
		let tickUpper: string;
		let tickCurrent: string;
		let tickSpacing: string;
		let fee: string;
		let poolAddress: Buffer;

		beforeEach(async () => {
			tokenId = '123';
			baseTokenAddress = tokens[0].address;
			quoteTokenAddress = tokens[1].address;
			baseTokenSymbol = tokens[0].symbol();
			quoteTokenSymbol = tokens[1].symbol();
			baseTokenDecimals = tokens[0].decimals();
			quoteTokenDecimals = tokens[1].decimals();
			flipRatio = false;
			tickLower = getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString();
			tickUpper = getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString();
			tickCurrent = '0';
			tickSpacing = TICK_SPACINGS[FeeAmount.MEDIUM];
			fee = '3000';
			poolAddress = Buffer.from(`${'b'.repeat(40)}`, 'hex');
		});

		it('returns the valid JSON string with min and max ticks', async () => {
			const json = extractJSONFromURI(
				nftDescriptor.constructTokenURI({
					tokenId,
					baseTokenAddress,
					quoteTokenAddress,
					baseTokenSymbol,
					quoteTokenSymbol,
					baseTokenDecimals,
					quoteTokenDecimals,
					flipRatio,
					tickLower,
					tickUpper,
					tickCurrent,
					tickSpacing,
					fee,
					poolAddress,
				}),
			);

			const tokenUri = constructTokenMetadata(
				tokenId,
				quoteTokenAddress,
				baseTokenAddress,
				poolAddress,
				quoteTokenSymbol,
				baseTokenSymbol,
				flipRatio,
				tickLower,
				tickUpper,
				tickCurrent,
				'0.3%',
				'MIN<>MAX',
			);

			expect(json.description).toBe(tokenUri.description);
			expect(json.name).toBe(tokenUri.name);
		});

		it('returns the valid JSON string with mid ticks', async () => {
			tickLower = '-10';
			tickUpper = '10';
			tickSpacing = TICK_SPACINGS[FeeAmount.MEDIUM];
			fee = '3000';

			const json = extractJSONFromURI(
				nftDescriptor.constructTokenURI({
					tokenId,
					baseTokenAddress,
					quoteTokenAddress,
					baseTokenSymbol,
					quoteTokenSymbol,
					baseTokenDecimals,
					quoteTokenDecimals,
					flipRatio,
					tickLower,
					tickUpper,
					tickCurrent,
					tickSpacing,
					fee,
					poolAddress,
				}),
			);

			const tokenMetadata = constructTokenMetadata(
				tokenId,
				quoteTokenAddress,
				baseTokenAddress,
				poolAddress,
				quoteTokenSymbol,
				baseTokenSymbol,
				flipRatio,
				tickLower,
				tickUpper,
				tickCurrent,
				'0.3%',
				'0.99900<>1.0010',
			);

			expect(json.description).toBe(tokenMetadata.description);
			expect(json.name).toBe(tokenMetadata.name);
		});

		it('returns valid JSON when token symbols contain quotes', async () => {
			quoteTokenSymbol = '"TES"T1"';
			const json = extractJSONFromURI(
				nftDescriptor.constructTokenURI({
					tokenId,
					baseTokenAddress,
					quoteTokenAddress,
					baseTokenSymbol,
					quoteTokenSymbol,
					baseTokenDecimals,
					quoteTokenDecimals,
					flipRatio,
					tickLower,
					tickUpper,
					tickCurrent,
					tickSpacing,
					fee,
					poolAddress,
				}),
			);

			const tokenMetadata = constructTokenMetadata(
				tokenId,
				quoteTokenAddress,
				baseTokenAddress,
				poolAddress,
				quoteTokenSymbol,
				baseTokenSymbol,
				flipRatio,
				tickLower,
				tickUpper,
				tickCurrent,
				'0.3%',
				'MIN<>MAX',
			);

			expect(json.description).toBe(tokenMetadata.description);
			expect(json.name).toBe(tokenMetadata.name);
		});

		describe('when the token ratio is flipped', () => {
			it('returns the valid JSON for mid ticks', async () => {
				flipRatio = true;
				tickLower = '-10';
				tickUpper = '10';

				const json = extractJSONFromURI(
					nftDescriptor.constructTokenURI({
						tokenId,
						baseTokenAddress,
						quoteTokenAddress,
						baseTokenSymbol,
						quoteTokenSymbol,
						baseTokenDecimals,
						quoteTokenDecimals,
						flipRatio,
						tickLower,
						tickUpper,
						tickCurrent,
						tickSpacing,
						fee,
						poolAddress,
					}),
				);

				const tokenMetadata = constructTokenMetadata(
					tokenId,
					quoteTokenAddress,
					baseTokenAddress,
					poolAddress,
					quoteTokenSymbol,
					baseTokenSymbol,
					flipRatio,
					tickLower,
					tickUpper,
					tickCurrent,
					'0.3%',
					'0.99900<>1.0010',
				);

				expect(json.description).toBe(tokenMetadata.description);
				expect(json.name).toBe(tokenMetadata.name);
			});

			it('returns the valid JSON for min/max ticks', async () => {
				flipRatio = true;

				const json = extractJSONFromURI(
					nftDescriptor.constructTokenURI({
						tokenId,
						baseTokenAddress,
						quoteTokenAddress,
						baseTokenSymbol,
						quoteTokenSymbol,
						baseTokenDecimals,
						quoteTokenDecimals,
						flipRatio,
						tickLower,
						tickUpper,
						tickCurrent,
						tickSpacing,
						fee,
						poolAddress,
					}),
				);

				const tokenMetadata = constructTokenMetadata(
					tokenId,
					quoteTokenAddress,
					baseTokenAddress,
					poolAddress,
					quoteTokenSymbol,
					baseTokenSymbol,
					flipRatio,
					tickLower,
					tickUpper,
					tickCurrent,
					'0.3%',
					'MIN<>MAX',
				);

				expect(json.description).toBe(tokenMetadata.description);
				expect(json.name).toBe(tokenMetadata.name);
			});
		});

		it('snapshot matches', async () => {
			// get snapshot with super rare special sparkle
			tokenId = '1';
			poolAddress = Buffer.from(`${'b'.repeat(40)}`, 'hex');
			// get a snapshot with svg fade
			tickCurrent = '-1';
			tickLower = '0';
			tickUpper = '1000';
			tickSpacing = TICK_SPACINGS[FeeAmount.LOW];
			fee = FeeAmount.LOW;
			quoteTokenAddress = Buffer.from('abcdeabcdefabcdefabcdefabcdefabcdefabcdf', 'hex');
			baseTokenAddress = Buffer.from('1234567890123456789123456789012345678901', 'hex');
			quoteTokenSymbol = 'UNI';
			baseTokenSymbol = 'WETH';
			expect(
				nftDescriptor.constructTokenURI({
					tokenId,
					quoteTokenAddress,
					baseTokenAddress,
					quoteTokenSymbol,
					baseTokenSymbol,
					baseTokenDecimals,
					quoteTokenDecimals,
					flipRatio,
					tickLower,
					tickUpper,
					tickCurrent,
					tickSpacing,
					fee,
					poolAddress,
				}),
			).toMatchSnapshot();
		});
	});

	describe('#addressToString', () => {
		it('returns the correct string for a given address', async () => {
			let addressStr = nftDescriptor.addressToString(
				Buffer.from(`${'1234abcdef'.repeat(4)}`, 'hex'),
			);
			expect(addressStr).toBe('1234abcdef1234abcdef1234abcdef1234abcdef');
			addressStr = nftDescriptor.addressToString(Buffer.from(`${'1'.repeat(40)}`, 'hex'));
			expect(addressStr).toBe(`${'1'.repeat(40)}`);
		});
	});

	describe('#tickToDecimalString', () => {
		let tickSpacing: string;
		let minTick: string;
		let maxTick: string;

		describe('when tickspacing is 10', () => {
			beforeAll(() => {
				tickSpacing = TICK_SPACINGS[FeeAmount.LOW];
				minTick = getMinTick(tickSpacing).toString();
				maxTick = getMaxTick(tickSpacing).toString();
			});

			it('returns MIN on lowest tick', async () => {
				expect(nftDescriptor.tickToDecimalString(minTick, tickSpacing, '18', '18', false)).toBe(
					'MIN',
				);
			});

			it('returns MAX on the highest tick', async () => {
				expect(nftDescriptor.tickToDecimalString(maxTick, tickSpacing, '18', '18', false)).toBe(
					'MAX',
				);
			});

			it('returns the correct decimal string when the tick is in range', async () => {
				expect(nftDescriptor.tickToDecimalString('1', tickSpacing, '18', '18', false)).toBe(
					'1.0001',
				);
			});

			it('returns the correct decimal string when tick is mintick for different tickspace', async () => {
				const otherMinTick = getMinTick(TICK_SPACINGS[FeeAmount.HIGH]).toString();
				expect(
					nftDescriptor.tickToDecimalString(otherMinTick, tickSpacing, '18', '18', false),
				).toBe('0.0000000000000000000000000000000000000029387');
			});
		});

		describe('when tickspacing is 60', () => {
			beforeAll(() => {
				tickSpacing = TICK_SPACINGS[FeeAmount.MEDIUM];
				minTick = getMinTick(tickSpacing).toString();
				maxTick = getMaxTick(tickSpacing).toString();
			});

			it('returns MIN on lowest tick', async () => {
				expect(nftDescriptor.tickToDecimalString(minTick, tickSpacing, '18', '18', false)).toBe(
					'MIN',
				);
			});

			it('returns MAX on the highest tick', async () => {
				expect(nftDescriptor.tickToDecimalString(maxTick, tickSpacing, '18', '18', false)).toBe(
					'MAX',
				);
			});

			it('returns the correct decimal string when the tick is in range', async () => {
				expect(nftDescriptor.tickToDecimalString('-1', tickSpacing, '18', '18', false)).toBe(
					'0.99990',
				);
			});

			it('returns the correct decimal string when tick is mintick for different tickspace', async () => {
				const otherMinTick = getMinTick(TICK_SPACINGS[FeeAmount.HIGH]).toString();
				expect(
					nftDescriptor.tickToDecimalString(otherMinTick, tickSpacing, '18', '18', false),
				).toBe('0.0000000000000000000000000000000000000029387');
			});
		});

		describe('when tickspacing is 200', () => {
			beforeAll(() => {
				tickSpacing = TICK_SPACINGS[FeeAmount.HIGH];
				minTick = getMinTick(tickSpacing).toString();
				maxTick = getMaxTick(tickSpacing).toString();
			});

			it('returns MIN on lowest tick', async () => {
				expect(nftDescriptor.tickToDecimalString(minTick, tickSpacing, '18', '18', false)).toBe(
					'MIN',
				);
			});

			it('returns MAX on the highest tick', async () => {
				expect(nftDescriptor.tickToDecimalString(maxTick, tickSpacing, '18', '18', false)).toBe(
					'MAX',
				);
			});

			it('returns the correct decimal string when the tick is in range', async () => {
				expect(nftDescriptor.tickToDecimalString('0', tickSpacing, '18', '18', false)).toBe(
					'1.0000',
				);
			});

			it('returns the correct decimal string when tick is mintick for different tickspace', async () => {
				const otherMinTick = getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString();
				expect(
					nftDescriptor.tickToDecimalString(otherMinTick, tickSpacing, '18', '18', false),
				).toBe('0.0000000000000000000000000000000000000029387');
			});
		});

		describe('when token ratio is flipped', () => {
			it('returns the inverse of default ratio for medium sized numbers', async () => {
				const _tickSpacing = TICK_SPACINGS[FeeAmount.HIGH];
				expect(nftDescriptor.tickToDecimalString('10', _tickSpacing, '18', '18', false)).toBe(
					'1.0010',
				);
				expect(nftDescriptor.tickToDecimalString('10', _tickSpacing, '18', '18', true)).toBe(
					'0.99900',
				);
			});

			it('returns the inverse of default ratio for large numbers', async () => {
				const _tickSpacing = TICK_SPACINGS[FeeAmount.HIGH];
				expect(nftDescriptor.tickToDecimalString('487272', _tickSpacing, '18', '18', false)).toBe(
					'1448400000000000000000',
				);
				expect(nftDescriptor.tickToDecimalString('487272', _tickSpacing, '18', '18', true)).toBe(
					'0.00000000000000000000069041',
				);
			});

			it('returns the inverse of default ratio for small numbers', async () => {
				const _tickSpacing = TICK_SPACINGS[FeeAmount.HIGH];
				expect(nftDescriptor.tickToDecimalString('-387272', _tickSpacing, '18', '18', false)).toBe(
					'0.000000000000000015200',
				);
				expect(nftDescriptor.tickToDecimalString('-387272', _tickSpacing, '18', '18', true)).toBe(
					'65791000000000000',
				);
			});

			it('returns the correct string with differing token decimals', async () => {
				const _tickSpacing = TICK_SPACINGS[FeeAmount.HIGH];
				expect(nftDescriptor.tickToDecimalString('1000', _tickSpacing, '18', '18', true)).toBe(
					'0.90484',
				);
				expect(nftDescriptor.tickToDecimalString('1000', _tickSpacing, '18', '10', true)).toBe(
					'90484000',
				);
				expect(nftDescriptor.tickToDecimalString('1000', _tickSpacing, '10', '18', true)).toBe(
					'0.0000000090484',
				);
			});

			it('returns MIN for highest tick', async () => {
				const _tickSpacing = TICK_SPACINGS[FeeAmount.HIGH];
				const lowestTick = getMinTick(TICK_SPACINGS[FeeAmount.HIGH]).toString();
				expect(nftDescriptor.tickToDecimalString(lowestTick, _tickSpacing, '18', '18', true)).toBe(
					'MAX',
				);
			});

			it('returns MAX for lowest tick', async () => {
				const _tickSpacing = TICK_SPACINGS[FeeAmount.HIGH];
				const highestTick = getMaxTick(TICK_SPACINGS[FeeAmount.HIGH]).toString();
				expect(nftDescriptor.tickToDecimalString(highestTick, _tickSpacing, '18', '18', true)).toBe(
					'MIN',
				);
			});
		});
	});

	describe('#fixedPointToDecimalString', () => {
		describe('returns the correct string for', () => {
			it('the highest possible price', async () => {
				const ratio = encodePriceSqrt(33849, 1 / 10 ** 34).toString();
				expect(nftDescriptor.fixedPointToDecimalString(ratio, '18', '18')).toBe(
					'338490000000000000000000000000000000000',
				);
			});

			it('large numbers', async () => {
				let ratio = encodePriceSqrt(25811, 1 / 10 ** 11).toString();
				expect(nftDescriptor.fixedPointToDecimalString(ratio, '18', '18')).toBe('2581100000000000');
				ratio = encodePriceSqrt(17662, 1 / 10 ** 5).toString();
				expect(nftDescriptor.fixedPointToDecimalString(ratio, '18', '18')).toBe('1766200000');
			});

			it('exactly 5 sigfig whole number', async () => {
				const ratio = encodePriceSqrt(42026, 1).toString();
				expect(nftDescriptor.fixedPointToDecimalString(ratio, '18', '18')).toBe('42026');
			});

			it('when the decimal is at index 4', async () => {
				const ratio = encodePriceSqrt(12087, 10).toString();
				expect(nftDescriptor.fixedPointToDecimalString(ratio, '18', '18')).toBe('1208.7');
			});

			it('when the decimal is at index 3', async () => {
				const ratio = encodePriceSqrt(12087, 100).toString();
				expect(nftDescriptor.fixedPointToDecimalString(ratio, '18', '18')).toBe('120.87');
			});

			it('when the decimal is at index 2', async () => {
				const ratio = encodePriceSqrt(12087, 1000).toString();
				expect(nftDescriptor.fixedPointToDecimalString(ratio, '18', '18')).toBe('12.087');
			});

			it('when the decimal is at index 1', async () => {
				const ratio = encodePriceSqrt(12345, 10000).toString();
				// const bla = nftDescriptor.fixedPointToDecimalString(ratio, '18', '18');
				expect(nftDescriptor.fixedPointToDecimalString(ratio, '18', '18')).toBe('1.2345');
			});

			it('when sigfigs have trailing 0s after the decimal', async () => {
				const ratio = encodePriceSqrt(1, 1).toString();
				expect(nftDescriptor.fixedPointToDecimalString(ratio, '18', '18')).toBe('1.0000');
			});

			it('when there are exactly 5 numbers after the decimal', async () => {
				const ratio = encodePriceSqrt(12345, 100000).toString();
				expect(nftDescriptor.fixedPointToDecimalString(ratio, '18', '18')).toBe('0.12345');
			});

			it('very small numbers', async () => {
				let ratio = encodePriceSqrt(38741, 10 ** 20).toString();
				expect(nftDescriptor.fixedPointToDecimalString(ratio, '18', '18')).toBe(
					'0.00000000000000038741',
				);
				ratio = encodePriceSqrt(88498, 10 ** 35).toString();
				expect(nftDescriptor.fixedPointToDecimalString(ratio, '18', '18')).toBe(
					'0.00000000000000000000000000000088498',
				);
			});

			it('smallest number', async () => {
				const ratio = encodePriceSqrt(39000, 10 ** 43).toString();
				expect(nftDescriptor.fixedPointToDecimalString(ratio, '18', '18')).toBe(
					'0.0000000000000000000000000000000000000029387',
				);
			});
		});

		describe('when tokens have different decimal precision', () => {
			describe('when baseToken has more precision decimals than quoteToken', () => {
				it('returns the correct string when the decimal difference is even', async () => {
					expect(
						nftDescriptor.fixedPointToDecimalString(encodePriceSqrt(1, 1).toString(), '18', '16'),
					).toBe('100.00');
				});

				it('returns the correct string when the decimal difference is odd', async () => {
					const tenRatio = encodePriceSqrt(10, 1).toString();
					expect(nftDescriptor.fixedPointToDecimalString(tenRatio, '18', '17')).toBe('100.00');
				});

				it('does not account for higher token0 precision if difference is more than 18', async () => {
					expect(
						nftDescriptor.fixedPointToDecimalString(encodePriceSqrt(1, 1).toString(), '24', '5'),
					).toBe('1.0000');
				});
			});

			describe('when quoteToken has more precision decimals than baseToken', () => {
				it('returns the correct string when the decimal difference is even', async () => {
					expect(
						nftDescriptor.fixedPointToDecimalString(encodePriceSqrt(1, 1).toString(), '10', '18'),
					).toBe('0.000000010000');
				});

				it('returns the correct string when the decimal difference is odd', async () => {
					expect(
						nftDescriptor.fixedPointToDecimalString(encodePriceSqrt(1, 1).toString(), '7', '18'),
					).toBe('0.000000000010000');
				});

				// provide compatibility token prices that breach minimum price due to token decimal differences
				// NOTE: this tests also failing on original uniswap repo

				// eslint-disable-next-line jest/no-commented-out-tests
				// it.skip('returns the correct string when the decimal difference brings ratio below the minimum', async () => {
				//   const lowRatio = encodePriceSqrt(88498, 10 ** 35);
				//   expect(nftDescriptor.fixedPointToDecimalString(lowRatio, '10', '20')).toBe(
				//     '0.000000000000000000000000000000000000000088498',
				//   );
				// });

				it('does not account for higher token1 precision if difference is more than 18', async () => {
					expect(
						nftDescriptor.fixedPointToDecimalString(encodePriceSqrt(1, 1).toString(), '24', '5'),
					).toBe('1.0000');
				});
			});

			it('some fuzz', async () => {
				const random = (min: number, max: number): number => {
					return Math.floor(min + ((Math.random() * 100) % (max + 1 - min)));
				};

				const inputs: [Uint, number, number][] = [];
				let i = 0;
				while (i <= 20) {
					const ratio = Uint.from(`0x${randomBytes(random(7, 20)).toString('hex')}`);
					const decimals0 = random(3, 21);
					const decimals1 = random(3, 21);
					const decimalDiff = Math.abs(decimals0 - decimals1);

					if (
						ratio.div(TEN.pow(decimalDiff)).gt(LOWEST_SQRT_RATIO) &&
						ratio.mul(TEN.pow(decimalDiff)).lt(HIGHEST_SQRT_RATIO)
					) {
						inputs.push([ratio, decimals0, decimals1]);
						i += 1;
					}
				}

				// eslint-disable-next-line no-restricted-syntax, @typescript-eslint/no-for-in-array, guard-for-in
				for (const x in inputs) {
					const [ratio, decimals0, decimals1] = inputs[x];
					const result = nftDescriptor.fixedPointToDecimalString(
						ratio.toString(),
						decimals0.toString(),
						decimals1.toString(),
					);
					expect(formatSqrtRatioX96(ratio.toString(), decimals0, decimals1)).toBe(result);
				}
			}, 300_000);
		});
	});

	describe('#feeToPercentString', () => {
		it('returns the correct fee for 0', async () => {
			expect(nftDescriptor.feeToPercentString('0')).toBe('0%');
		});

		it('returns the correct fee for 1', async () => {
			expect(nftDescriptor.feeToPercentString('1')).toBe('0.0001%');
		});

		it('returns the correct fee for 30', async () => {
			expect(nftDescriptor.feeToPercentString('30')).toBe('0.003%');
		});

		it('returns the correct fee for 33', async () => {
			expect(nftDescriptor.feeToPercentString('33')).toBe('0.0033%');
		});

		it('returns the correct fee for 500', async () => {
			expect(nftDescriptor.feeToPercentString('500')).toBe('0.05%');
		});

		it('returns the correct fee for 2500', async () => {
			expect(nftDescriptor.feeToPercentString('2500')).toBe('0.25%');
		});

		it('returns the correct fee for 3000', async () => {
			expect(nftDescriptor.feeToPercentString('3000')).toBe('0.3%');
		});

		it('returns the correct fee for 10000', async () => {
			expect(nftDescriptor.feeToPercentString('10000')).toBe('1%');
		});

		it('returns the correct fee for 17000', async () => {
			expect(nftDescriptor.feeToPercentString('17000')).toBe('1.7%');
		});

		it('returns the correct fee for 100000', async () => {
			expect(nftDescriptor.feeToPercentString('100000')).toBe('10%');
		});

		it('returns the correct fee for 150000', async () => {
			expect(nftDescriptor.feeToPercentString('150000')).toBe('15%');
		});

		it('returns the correct fee for 102000', async () => {
			expect(nftDescriptor.feeToPercentString('102000')).toBe('10.2%');
		});

		it('returns the correct fee for 10000000', async () => {
			expect(nftDescriptor.feeToPercentString('1000000')).toBe('100%');
		});

		it('returns the correct fee for 1005000', async () => {
			expect(nftDescriptor.feeToPercentString('1005000')).toBe('100.5%');
		});

		it('returns the correct fee for 10000000 - 2', async () => {
			expect(nftDescriptor.feeToPercentString('10000000')).toBe('1000%');
		});

		it('returns the correct fee for 12300000', async () => {
			expect(nftDescriptor.feeToPercentString('12300000')).toBe('1230%');
		});
	});

	describe('#tokenToColorHex', () => {
		it('returns the correct hash for the first 3 bytes of the token address', async () => {
			expect(nftDescriptor.tokenToColorHex(tokens[0].address, '136')).toBe('c0cac3');
			expect(nftDescriptor.tokenToColorHex(tokens[1].address, '136')).toBe('371f1f');
		});

		it('returns the correct hash for the last 3 bytes of the address', async () => {
			expect(nftDescriptor.tokenToColorHex(tokens[0].address, '0')).toBe('d00a50');
			expect(nftDescriptor.tokenToColorHex(tokens[1].address, '0')).toBe('e77f70');
		});
	});

	describe('#rangeLocation', () => {
		it('returns the correct coordinates when range midpoint under -125_000', async () => {
			const coords = NFTSVG.rangeLocation('-887272', '-887100');
			expect(coords[0]).toBe('8');
			expect(coords[1]).toBe('7');
		});

		it('returns the correct coordinates when range midpoint is between -125_000 and -75_000', async () => {
			const coords = NFTSVG.rangeLocation('-100000', '-90000');
			expect(coords[0]).toBe('8');
			expect(coords[1]).toBe('10.5');
		});

		it('returns the correct coordinates when range midpoint is between -75_000 and -25_000', async () => {
			const coords = NFTSVG.rangeLocation('-50000', '-20000');
			expect(coords[0]).toBe('8');
			expect(coords[1]).toBe('14.25');
		});

		it('returns the correct coordinates when range midpoint is between -25_000 and -5_000', async () => {
			const coords = NFTSVG.rangeLocation('-10000', '-5000');
			expect(coords[0]).toBe('10');
			expect(coords[1]).toBe('18');
		});

		it('returns the correct coordinates when range midpoint is between -5_000 and 0', async () => {
			const coords = NFTSVG.rangeLocation('-5000', '-4000');
			expect(coords[0]).toBe('11');
			expect(coords[1]).toBe('21');
		});

		it('returns the correct coordinates when range midpoint is between 0 and 5_000', async () => {
			const coords = NFTSVG.rangeLocation('4000', '5000');
			expect(coords[0]).toBe('13');
			expect(coords[1]).toBe('23');
		});

		it('returns the correct coordinates when range midpoint is between 5_000 and 25_000', async () => {
			const coords = NFTSVG.rangeLocation('10000', '15000');
			expect(coords[0]).toBe('15');
			expect(coords[1]).toBe('25');
		});

		it('returns the correct coordinates when range midpoint is between 25_000 and 75_000', async () => {
			const coords = NFTSVG.rangeLocation('25000', '50000');
			expect(coords[0]).toBe('18');
			expect(coords[1]).toBe('26');
		});

		it('returns the correct coordinates when range midpoint is between 75_000 and 125_000', async () => {
			const coords = NFTSVG.rangeLocation('100000', '125000');
			expect(coords[0]).toBe('21');
			expect(coords[1]).toBe('27');
		});

		it('returns the correct coordinates when range midpoint is above 125_000', async () => {
			const coords = NFTSVG.rangeLocation('200000', '100000');
			expect(coords[0]).toBe('24');
			expect(coords[1]).toBe('27');
		});

		it('math does not overflow on max value', async () => {
			const coords = NFTSVG.rangeLocation('887272', '887272');
			expect(coords[0]).toBe('24');
			expect(coords[1]).toBe('27');
		});
	});

	describe('#svgImage', () => {
		let tokenId: string;
		let baseTokenAddress: Buffer;
		let quoteTokenAddress: Buffer;
		let baseTokenSymbol: string;
		let quoteTokenSymbol: string;
		let baseTokenDecimals: string;
		let quoteTokenDecimals: string;
		let flipRatio: boolean;
		let tickLower: string;
		let tickUpper: string;
		let tickCurrent: string;
		let tickSpacing: string;
		let fee: string;
		let poolAddress: Buffer;

		beforeEach(async () => {
			tokenId = '123';
			quoteTokenAddress = Buffer.from('1234567890123456789123456789012345678901', 'hex');
			baseTokenAddress = Buffer.from('abcdeabcdefabcdefabcdefabcdefabcdefabcdf', 'hex');
			quoteTokenSymbol = 'UNI';
			baseTokenSymbol = 'WETH';
			tickLower = '-1000';
			tickUpper = '2000';
			tickCurrent = '40';
			fee = '500';
			baseTokenDecimals = tokens[0].decimals();
			quoteTokenDecimals = tokens[1].decimals();
			flipRatio = false;
			tickSpacing = TICK_SPACINGS[FeeAmount.MEDIUM];
			poolAddress = Buffer.from(`${'b'.repeat(40)}`, 'hex');
		});

		it('matches the current snapshot', async () => {
			const svg = nftDescriptor.generateSVGImage({
				tokenId,
				baseTokenAddress,
				quoteTokenAddress,
				baseTokenSymbol,
				quoteTokenSymbol,
				baseTokenDecimals,
				quoteTokenDecimals,
				flipRatio,
				tickLower,
				tickUpper,
				tickCurrent,
				tickSpacing,
				fee,
				poolAddress,
			});

			expect(svg).toMatchSnapshot();
			fs.writeFileSync(
				'./test/unit/modules/dex/stores/library/periphery/__snapshots__/nft_descriptor.svg',
				svg,
			);
		});

		it('returns a valid SVG', async () => {
			const svg = nftDescriptor.generateSVGImage({
				tokenId,
				baseTokenAddress,
				quoteTokenAddress,
				baseTokenSymbol,
				quoteTokenSymbol,
				baseTokenDecimals,
				quoteTokenDecimals,
				flipRatio,
				tickLower,
				tickUpper,
				tickCurrent,
				tickSpacing,
				fee,
				poolAddress,
			});
			expect(isSvg(svg)).toBe(true);
		});
	});

	describe('#isRare', () => {
		it('returns true sometimes', async () => {
			expect(NFTSVG.isRare('0', Buffer.from(`${'b'.repeat(40)}`, 'hex'))).toBe(true);
		});

		it('returns false sometimes', async () => {
			expect(NFTSVG.isRare('2', Buffer.from(`${'b'.repeat(40)}`, 'hex'))).toBe(false);
		});
	});

	function constructTokenMetadata(
		tokenId: string,
		quoteTokenAddress: Buffer,
		baseTokenAddress: Buffer,
		poolAddress: Buffer,
		quoteTokenSymbol: string,
		baseTokenSymbol: string,
		_flipRatio: boolean,
		_tickLower: string,
		_tickUpper: string,
		_tickCurrent: string,
		feeTier: string,
		prices: string,
	): { name: string; description: string } {
		const _quoteTokenSymbol = quoteTokenSymbol.replace(/"/gi, '"');
		const _baseTokenSymbol = baseTokenSymbol.replace(/"/gi, '"');
		return {
			name: `Swaptoshi - ${feeTier} - ${_quoteTokenSymbol}/${_baseTokenSymbol} - ${prices}`,
			description: `This NFT represents a liquidity position in a Swaptoshi ${_quoteTokenSymbol}-${_baseTokenSymbol} pool. The owner of this NFT can modify or redeem the position.\n\
\nPool Address: ${poolAddress.toString('hex')}\n${_quoteTokenSymbol} Address: ${quoteTokenAddress
				.toString('hex')
				.toLowerCase()}\n${_baseTokenSymbol} Address: ${baseTokenAddress
				.toString('hex')
				.toLowerCase()}\n\
Fee Tier: ${feeTier}\nToken ID: ${tokenId}\n\n⚠️ DISCLAIMER: Due diligence is imperative when assessing this NFT. Make sure token addresses match the expected tokens, as \
token symbols may be imitated.`,
		};
	}
});
