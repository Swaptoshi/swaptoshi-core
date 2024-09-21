/* eslint-disable no-param-reassign */
import { NonfungiblePositionManager } from '../../../../../../src/app/modules/dex/stores/factory';
import { FeeAmount, TICK_SPACINGS, encodePriceSqrt, getMaxTick, getMinTick } from './utilities';

const token0Symbol = 'TKNA';
const token0Decimal = 8;
const token1Symbol = 'TKNB';
const token1Decimal = 8;

export async function createPool(nft: NonfungiblePositionManager, sender: Buffer, token0: Buffer, token1: Buffer) {
	if (token0.toString('hex').toLowerCase() > token1.toString('hex').toLowerCase()) [token0, token1] = [token1, token0];

	await nft.createAndInitializePoolIfNecessary(token0, token0Symbol, token0Decimal, token1, token1Symbol, token1Decimal, FeeAmount.MEDIUM, encodePriceSqrt(1, 1).toString());

	const liquidityParams = {
		token0,
		token1,
		fee: FeeAmount.MEDIUM,
		tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
		tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
		recipient: sender,
		amount0Desired: '1000000',
		amount1Desired: '1000000',
		amount0Min: '0',
		amount1Min: '0',
		deadline: '1',
	};

	return nft.mint(liquidityParams);
}

export async function createPoolWithMultiplePositions(nft: NonfungiblePositionManager, sender: Buffer, token0: Buffer, token1: Buffer) {
	if (token0.toString('hex').toLowerCase() > token1.toString('hex').toLowerCase()) [token0, token1] = [token1, token0];

	await nft.createAndInitializePoolIfNecessary(token0, token0Symbol, token0Decimal, token1, token1Symbol, token1Decimal, FeeAmount.MEDIUM, encodePriceSqrt(1, 1).toString());

	const liquidityParams = {
		token0,
		token1,
		fee: FeeAmount.MEDIUM,
		tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
		tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
		recipient: sender,
		amount0Desired: '1000000',
		amount1Desired: '1000000',
		amount0Min: '0',
		amount1Min: '0',
		deadline: '1',
	};

	await nft.mint(liquidityParams);

	const liquidityParams2 = {
		token0,
		token1,
		fee: FeeAmount.MEDIUM,
		tickLower: '-60',
		tickUpper: '60',
		recipient: sender,
		amount0Desired: '100',
		amount1Desired: '100',
		amount0Min: '0',
		amount1Min: '0',
		deadline: '1',
	};

	await nft.mint(liquidityParams2);

	const liquidityParams3 = {
		token0,
		token1,
		fee: FeeAmount.MEDIUM,
		tickLower: '-120',
		tickUpper: '120',
		recipient: sender,
		amount0Desired: '100',
		amount1Desired: '100',
		amount0Min: '0',
		amount1Min: '0',
		deadline: '1',
	};

	return nft.mint(liquidityParams3);
}

export async function createPoolWithZeroTickInitialized(nft: NonfungiblePositionManager, sender: Buffer, token0: Buffer, token1: Buffer) {
	if (token0.toString('hex').toLowerCase() > token1.toString('hex').toLowerCase()) [token0, token1] = [token1, token0];

	await nft.createAndInitializePoolIfNecessary(token0, token0Symbol, token0Decimal, token1, token1Symbol, token1Decimal, FeeAmount.MEDIUM, encodePriceSqrt(1, 1).toString());

	const liquidityParams = {
		token0,
		token1,
		fee: FeeAmount.MEDIUM,
		tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
		tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
		recipient: sender,
		amount0Desired: '1000000',
		amount1Desired: '1000000',
		amount0Min: '0',
		amount1Min: '0',
		deadline: '1',
	};

	await nft.mint(liquidityParams);

	const liquidityParams2 = {
		token0,
		token1,
		fee: FeeAmount.MEDIUM,
		tickLower: '0',
		tickUpper: '60',
		recipient: sender,
		amount0Desired: '100',
		amount1Desired: '100',
		amount0Min: '0',
		amount1Min: '0',
		deadline: '1',
	};

	await nft.mint(liquidityParams2);

	const liquidityParams3 = {
		token0,
		token1,
		fee: FeeAmount.MEDIUM,
		tickLower: '-120',
		tickUpper: '0',
		recipient: sender,
		amount0Desired: '100',
		amount1Desired: '100',
		amount0Min: '0',
		amount1Min: '0',
		deadline: '1',
	};

	return nft.mint(liquidityParams3);
}
