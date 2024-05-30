/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/prefer-for-of */
import { cryptography } from 'klayr-sdk';
import {
	Uint256String,
	Uint8String,
	Int24String,
	Uint24String,
	Uint256,
	Uint8,
	Int24,
	Uint160String,
	Int256,
	Uint160,
	Uint24,
	Int8String,
} from '../int';

import * as TickMath from '../core/tick_math';
import * as FullMath from '../core/full_math';
import * as HexStrings from './hex_strings';
import * as NFTSVG from './nft_svg';
import { DexModuleConfig } from '../../../types';

interface ConstructTokenURIParams {
	config: DexModuleConfig;
	tokenId: Uint256String;
	quoteTokenAddress: Buffer;
	baseTokenAddress: Buffer;
	quoteTokenSymbol: string;
	baseTokenSymbol: string;
	quoteTokenDecimals: Uint8String;
	baseTokenDecimals: Uint8String;
	flipRatio: boolean;
	tickLower: Int24String;
	tickUpper: Int24String;
	tickCurrent: Int24String;
	tickSpacing: Int24String;
	fee: Uint24String;
	poolAddress: Buffer;
}

interface DecimalStringParams {
	sigfigs: Uint256String;
	bufferLength: Uint8String;
	sigfigIndex: Uint8String;
	decimalIndex: Uint8String;
	zerosStartIndex: Uint8String;
	zerosEndIndex: Uint8String;
	isLessThanOne: boolean;
	isPercent: boolean;
}

const defaultDecimalStringParams: DecimalStringParams = Object.freeze({
	sigfigs: '0',
	bufferLength: '0',
	sigfigIndex: '0',
	decimalIndex: '0',
	zerosStartIndex: '0',
	zerosEndIndex: '0',
	isLessThanOne: false,
	isPercent: false,
});

const sqrt10X128 = Uint256.from('1076067327063303206878105757264492625226').toString();

export function constructTokenURI(params: ConstructTokenURIParams): string {
	const name = generateName(params, feeToPercentString(params.fee));
	const descriptionPartOne = generateDescriptionPartOne(
		params.config,
		escapeQuotes(params.quoteTokenSymbol),
		escapeQuotes(params.baseTokenSymbol),
		cryptography.address.getKlayr32AddressFromAddress(params.poolAddress),
	);
	const descriptionPartTwo = generateDescriptionPartTwo(
		params.tokenId.toString(),
		escapeQuotes(params.baseTokenSymbol),
		addressToString(params.quoteTokenAddress),
		addressToString(params.baseTokenAddress),
		feeToPercentString(params.fee),
	);
	const image = Buffer.from(generateSVGImage(params)).toString('base64');

	return [
		'data:application/json;base64,',
		Buffer.from(
			[
				'{"name":"',
				name,
				'", "description":"',
				descriptionPartOne,
				descriptionPartTwo,
				'", "image": "',
				'data:image/svg+xml;base64,',
				image,
				'"}',
			].join(''),
		).toString('base64'),
	].join('');
}

function escapeQuotes(symbol: string): string {
	const symbolBytes: number[] = [...symbol].map(char => char.charCodeAt(0));
	let quotesCount = 0;

	for (let i = 0; i < symbolBytes.length; i += 1) {
		if (symbolBytes[i] === 34) {
			quotesCount += 1;
		}
	}

	if (quotesCount > 0) {
		const escapedBytes: number[] = new Array<number>(symbolBytes.length + quotesCount);
		let index = 0;

		for (let i = 0; i < symbolBytes.length; i += 1) {
			if (symbolBytes[i] === 34) {
				escapedBytes[(index += 1)] = 92; // ASCII code for backslash
			}
			escapedBytes[(index += 1)] = symbolBytes[i];
		}

		return String.fromCharCode(...escapedBytes);
	}

	return symbol;
}

function generateDescriptionPartOne(
	config: DexModuleConfig,
	quoteTokenSymbol: string,
	baseTokenSymbol: string,
	poolAddress: string,
): string {
	return [
		`This NFT represents a liquidity position in a ${config.nftPositionMetadata.dex.name} `,
		quoteTokenSymbol,
		'-',
		baseTokenSymbol,
		' pool. ',
		'The owner of this NFT can modify or redeem the position.\\n',
		'\\nPool Address: ',
		poolAddress,
		'\\n',
		quoteTokenSymbol,
	].join('');
}

function generateDescriptionPartTwo(
	tokenId: string,
	baseTokenSymbol: string,
	quoteTokenAddress: string,
	baseTokenAddress: string,
	feeTier: string,
): string {
	return [
		' Token ID: ',
		quoteTokenAddress,
		'\\n',
		baseTokenSymbol,
		' Token ID: ',
		baseTokenAddress,
		'\\nFee Tier: ',
		feeTier,
		'\\nNFT ID: ',
		tokenId,
		'\\n\\n',
		'⚠️ DISCLAIMER: Due diligence is imperative when assessing this NFT. Make sure token addresses match the expected tokens, as token symbols may be imitated.',
	].join('');
}

function generateName(params: ConstructTokenURIParams, feeTier: string): string {
	return [
		`${params.config.nftPositionMetadata.dex.name} - `,
		feeTier,
		' - ',
		escapeQuotes(params.quoteTokenSymbol),
		'/',
		escapeQuotes(params.baseTokenSymbol),
		' - ',
		tickToDecimalString(
			!params.flipRatio ? params.tickLower : params.tickUpper,
			params.tickSpacing,
			params.baseTokenDecimals,
			params.quoteTokenDecimals,
			params.flipRatio,
		),
		'<>',
		tickToDecimalString(
			!params.flipRatio ? params.tickUpper : params.tickLower,
			params.tickSpacing,
			params.baseTokenDecimals,
			params.quoteTokenDecimals,
			params.flipRatio,
		),
	].join('');
}

function generateDecimalString(params: DecimalStringParams): string {
	const buffer = new Array(params.bufferLength).fill('0');

	if (params.isPercent) {
		buffer[buffer.length - 1] = '%';
	}

	if (params.isLessThanOne) {
		buffer[0] = '0';
		buffer[1] = '.';
	}

	// Add leading/trailing 0's
	for (
		let zerosCursor = parseInt(params.zerosStartIndex, 10);
		zerosCursor <= parseInt(params.zerosEndIndex, 10);
		zerosCursor += 1
	) {
		buffer[zerosCursor] = '0';
	}

	// Add sigfigs
	let { sigfigIndex } = params;

	while (Uint256.from(params.sigfigs).gt(0)) {
		if (Uint8.from(params.decimalIndex).gt(0) && sigfigIndex === params.decimalIndex) {
			buffer[Uint8.from(sigfigIndex).toNumber()] = '.';
			sigfigIndex = Uint8.from(sigfigIndex).sub(1).toString();
		}

		buffer[Uint8.from(sigfigIndex).toNumber()] = String.fromCharCode(
			48 + Uint256.from(params.sigfigs).mod(10).toNumber(),
		);
		sigfigIndex = Uint8.from(sigfigIndex).sub(1).toString();
		params.sigfigs = Uint256.from(params.sigfigs).div(10).toString();
	}

	return buffer.join('');
}

export function tickToDecimalString(
	tick: Int24String,
	tickSpacing: Int24String,
	baseTokenDecimals: Uint8String,
	quoteTokenDecimals: Uint8String,
	flipRatio: boolean,
): string {
	if (Int24.from(tick).eq(Int24.from(TickMath.MIN_TICK).div(tickSpacing).mul(tickSpacing))) {
		return !flipRatio ? 'MIN' : 'MAX';
	}
	if (Int24.from(tick).eq(Int24.from(TickMath.MAX_TICK).div(tickSpacing).mul(tickSpacing))) {
		return !flipRatio ? 'MAX' : 'MIN';
	}
	let sqrtRatioX96 = TickMath.getSqrtRatioAtTick(tick);
	if (flipRatio) {
		sqrtRatioX96 = Uint256.from(1).shl(192).div(sqrtRatioX96).toString();
	}
	return fixedPointToDecimalString(sqrtRatioX96, baseTokenDecimals, quoteTokenDecimals);
}

function sigfigsRounded(value: Uint256String, digits: Uint8String): [Uint256String, boolean] {
	let _value = value;
	let extraDigit = false;
	if (Uint8.from(digits).gt(5)) {
		_value = Uint256.from(_value)
			.div(Uint256.from(10).pow(Uint8.from(digits).sub(5)))
			.toString();
	}
	const roundUp = Uint256.from(_value).mod(10).gt(4);
	_value = Uint256.from(_value).div(10).toString();
	if (roundUp) {
		_value = Uint256.from(_value).add(1).toString();
	}
	if (Uint256.from(_value).eq(100000)) {
		_value = Uint256.from(_value).div(10).toString();
		extraDigit = true;
	}
	return [_value, extraDigit];
}

function adjustForDecimalPrecision(
	sqrtRatioX96: Uint160String,
	baseTokenDecimals: Uint8String,
	quoteTokenDecimals: Uint8String,
): Uint256String {
	let adjustedSqrtRatioX96: Uint256String;

	const difference = Int256.from(baseTokenDecimals).sub(quoteTokenDecimals).abs();
	if (difference.gt(0) && difference.lte(18)) {
		if (Uint8.from(baseTokenDecimals).gt(quoteTokenDecimals)) {
			adjustedSqrtRatioX96 = Uint160.from(sqrtRatioX96)
				.mul(Uint256.from(10).pow(difference.div(2)))
				.toString();
			if (difference.mod(2).toNumber() === 1) {
				adjustedSqrtRatioX96 = FullMath.mulDiv(
					adjustedSqrtRatioX96,
					sqrt10X128,
					Uint256.from(1).shl(128).toString(),
				);
			}
		} else {
			adjustedSqrtRatioX96 = Uint160.from(sqrtRatioX96)
				.div(Uint256.from(10).pow(difference.div(2)))
				.toString();
			if (difference.mod(2).toNumber() === 1) {
				adjustedSqrtRatioX96 = FullMath.mulDiv(
					adjustedSqrtRatioX96,
					Uint256.from(1).shl(128).toString(),
					sqrt10X128,
				);
			}
		}
	} else {
		adjustedSqrtRatioX96 = Uint256.from(0).add(sqrtRatioX96).toString();
	}
	return adjustedSqrtRatioX96;
}

export function fixedPointToDecimalString(
	sqrtRatioX96: Uint160String,
	baseTokenDecimals: Uint8String,
	quoteTokenDecimals: Uint8String,
): string {
	const adjustedSqrtRatioX96 = adjustForDecimalPrecision(
		sqrtRatioX96,
		baseTokenDecimals,
		quoteTokenDecimals,
	);
	let value = FullMath.mulDiv(
		adjustedSqrtRatioX96,
		adjustedSqrtRatioX96,
		Uint256.from(1).shl(64).toString(),
	);

	const priceBelow1 = Uint256.from(adjustedSqrtRatioX96).lt(Uint256.from(2).pow(96));
	if (priceBelow1) {
		value = FullMath.mulDiv(
			value,
			Uint256.from(10).pow(44).toString(),
			Uint256.from(1).shl(128).toString(),
		);
	} else {
		value = FullMath.mulDiv(
			value,
			Uint256.from(10).pow(5).toString(),
			Uint256.from(1).shl(128).toString(),
		);
	}

	let temp = Uint256.from(value);
	let digits: Uint8String = '0';
	while (!temp.eq(0)) {
		digits = Uint8.from(digits).add(1).toString();
		temp = temp.div(10);
	}

	digits = Uint8.from(digits).sub(1).toString();

	const [sigfigs, extraDigit] = sigfigsRounded(value, digits);
	if (extraDigit) digits = Uint8.from(digits).add(1).toString();

	const params: DecimalStringParams = { ...defaultDecimalStringParams };
	if (priceBelow1) {
		params.bufferLength = Uint8.from(7).add(Uint8.from(43).sub(digits)).toString();
		params.zerosStartIndex = '2';
		params.zerosEndIndex = Uint8.from(0).add(Uint256.from(43).sub(digits).add(1)).toString();
		params.sigfigIndex = Uint8.from(params.bufferLength).sub(1).toString();
	} else if (Uint8.from(digits).gte(9)) {
		params.bufferLength = Uint8.from(digits).sub(4).toString();
		params.zerosStartIndex = '5';
		params.zerosEndIndex = Uint8.from(params.bufferLength).sub(1).toString();
		params.sigfigIndex = '4';
	} else {
		params.bufferLength = '6';
		params.sigfigIndex = '5';
		params.decimalIndex = Uint8.from(digits).sub(5).add(1).toString();
	}
	params.sigfigs = sigfigs;
	params.isLessThanOne = priceBelow1;
	params.isPercent = false;

	return generateDecimalString(params);
}

export function feeToPercentString(fee: Uint24String): string {
	if (fee === '0') return '0%';
	let temp = Uint24.from(fee);
	let digits: Uint256 = Uint256.from(0);
	let numSigfigs: Uint8 = Uint8.from(0);

	while (!temp.eq(0)) {
		if (numSigfigs.gt(0)) numSigfigs = numSigfigs.add(1);
		else if (!temp.mod(10).eq(0)) numSigfigs = numSigfigs.add(1);
		digits = digits.add(1);
		temp = temp.div(10);
	}

	const params: DecimalStringParams = { ...defaultDecimalStringParams };
	let nZeros = Uint256.from(0);

	if (digits.gte(5)) {
		const decimalPlace = digits.sub(numSigfigs).gte(4) ? 0 : 1;
		nZeros = digits.sub(5).lt(numSigfigs.sub(1))
			? Uint256.from(0)
			: digits.sub(5).sub(numSigfigs.sub(1));
		params.zerosStartIndex = numSigfigs.toString();
		params.zerosEndIndex = Uint8.from(0).add(params.zerosStartIndex).add(nZeros).sub(1).toString();
		params.sigfigIndex = Uint8.from(0)
			.add(params.zerosStartIndex)
			.sub(1)
			.add(decimalPlace)
			.toString();
		params.bufferLength = Uint8.from(0)
			.add(nZeros.add(numSigfigs.add(1)).add(decimalPlace))
			.toString();
	} else {
		nZeros = Uint256.from(5).sub(digits);
		params.zerosStartIndex = '2';
		params.zerosEndIndex = Uint8.from(nZeros.add(params.zerosStartIndex).sub(1)).toString();
		params.bufferLength = Uint8.from(nZeros.add(numSigfigs.add(2))).toString();
		params.sigfigIndex = Uint8.from(params.bufferLength).sub(2).toString();
		params.isLessThanOne = true;
	}
	params.sigfigs = Uint256.from(fee)
		.div(Uint256.from(10).pow(digits.sub(numSigfigs)))
		.toString();
	params.isPercent = true;
	params.decimalIndex = digits.gt(4) ? Uint8.from(digits.sub(4)).toString() : '0';

	return `${generateDecimalString(params)}%`;
}

export function addressToString(addr: Buffer): string {
	return addr.toString('hex');
}

export function generateSVGImage(params: ConstructTokenURIParams): string {
	const svgParams: NFTSVG.SVGParams = {
		quoteToken: addressToString(params.quoteTokenAddress),
		baseToken: addressToString(params.baseTokenAddress),
		poolAddress: params.poolAddress,
		quoteTokenSymbol: params.quoteTokenSymbol,
		baseTokenSymbol: params.baseTokenSymbol,
		feeTier: feeToPercentString(params.fee),
		tickLower: params.tickLower,
		tickUpper: params.tickUpper,
		tickSpacing: params.tickSpacing,
		overRange: overRange(params.tickLower, params.tickUpper, params.tickCurrent),
		tokenId: params.tokenId,
		color0: tokenToColorHex(params.quoteTokenAddress, '136'),
		color1: tokenToColorHex(params.baseTokenAddress, '136'),
		color2: tokenToColorHex(params.quoteTokenAddress, '0'),
		color3: tokenToColorHex(params.baseTokenAddress, '0'),
		x1: scale(
			getCircleCoord(
				HexStrings.bufferToUint256String(params.quoteTokenAddress),
				'16',
				params.tokenId,
			),
			'0',
			'255',
			'16',
			'274',
		),
		y1: scale(
			getCircleCoord(
				HexStrings.bufferToUint256String(params.baseTokenAddress),
				'16',
				params.tokenId,
			),
			'0',
			'255',
			'100',
			'484',
		),
		x2: scale(
			getCircleCoord(
				HexStrings.bufferToUint256String(params.quoteTokenAddress),
				'32',
				params.tokenId,
			),
			'0',
			'255',
			'16',
			'274',
		),
		y2: scale(
			getCircleCoord(
				HexStrings.bufferToUint256String(params.baseTokenAddress),
				'32',
				params.tokenId,
			),
			'0',
			'255',
			'100',
			'484',
		),
		x3: scale(
			getCircleCoord(
				HexStrings.bufferToUint256String(params.quoteTokenAddress),
				'48',
				params.tokenId,
			),
			'0',
			'255',
			'16',
			'274',
		),
		y3: scale(
			getCircleCoord(
				HexStrings.bufferToUint256String(params.baseTokenAddress),
				'48',
				params.tokenId,
			),
			'0',
			'255',
			'100',
			'484',
		),
	};

	return NFTSVG.generateSVG(svgParams);
}

function overRange(
	tickLower: Int24String,
	tickUpper: Int24String,
	tickCurrent: Int24String,
): Int8String {
	if (Int24.from(tickCurrent).lt(tickLower)) {
		return '-1';
	}
	if (Int24.from(tickCurrent).gt(tickUpper)) {
		return '1';
	}
	return '0';
}

function scale(
	n: Uint256String,
	inMn: Uint256String,
	inMx: Uint256String,
	outMn: Uint256String,
	outMx: Uint256String,
): string {
	return Uint256.from(n)
		.sub(inMn)
		.mul(Uint256.from(outMx).sub(outMn))
		.div(Uint256.from(inMx).sub(inMn))
		.add(outMn)
		.toString();
}

export function tokenToColorHex(token: Buffer, offset: Uint256String): string {
	const hash = cryptography.utils.hash(token);
	return HexStrings.toHexString(
		Uint256.from(`0x${hash.toString('hex')}`)
			.shr(offset)
			.toString(),
		3,
	);
}

function getCircleCoord(
	tokenAddress: Uint256String,
	offset: Uint256String,
	tokenId: Uint256String,
): Uint256String {
	return Uint256.from(sliceTokenHex(tokenAddress, offset)).mul(tokenId).mod(255).toString();
}

function sliceTokenHex(token: Uint256String, offset: Uint256String): Uint256String {
	return Uint256.from(Uint8.from(0).add(Uint256.from(token).shr(offset))).toString();
}
