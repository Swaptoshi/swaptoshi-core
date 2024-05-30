import { Schema } from 'klayr-sdk';
import {
	commandSwapContext,
	methodSwapContext,
} from '../../../../../src/app/modules/dex/stores/context';
import { PositionManagerStore } from '../../../../../src/app/modules/dex/stores/position_manager';
import { commandContextFixture, methodContextFixture } from '../stores/shared/module';
import { completeFixture } from '../stores/shared/pool';
import {
	FeeAmount,
	TICK_SPACINGS,
	encodePriceSqrt,
	getMaxTick,
	getMinTick,
} from '../stores/shared/utilities';

interface Token {
	address: Buffer;
	symbol: () => string;
	decimals: () => string;
}

export type Tokens = [Token, Token, Token];

export async function commandFixture<T extends object>(
	command: string,
	commandSchema: Schema,
	senderPublicKey: Buffer,
	param: T,
) {
	const fixture = await commandContextFixture<T>(command, commandSchema, senderPublicKey);
	const context = commandSwapContext(fixture.createCommandExecuteContext(param));
	const {
		token0,
		token1,
		token2,
		token0Decimal,
		token0Symbol,
		token1Decimal,
		token1Symbol,
		token2Decimal,
		token2Symbol,
	} = await completeFixture(context, fixture.module);

	const pool = await fixture.poolStore.createPool(
		context,
		token0,
		token0Symbol,
		parseInt(token0Decimal, 10),
		token1,
		token1Symbol,
		parseInt(token1Decimal, 10),
		FeeAmount.MEDIUM,
	);
	await pool.initialize(encodePriceSqrt(1, 1).toString());

	const positionManagerStore = fixture.module.stores.get(PositionManagerStore);
	const nft = await positionManagerStore.getMutablePositionManager(context, pool.address);

	const tokens: Tokens = [
		{ address: token0, symbol: () => token0Symbol, decimals: () => token0Decimal },
		{ address: token1, symbol: () => token1Symbol, decimals: () => token1Decimal },
		{ address: token2, symbol: () => token2Symbol, decimals: () => token2Decimal },
	];

	tokens.sort((a, b) =>
		a.address.toString('hex').toLowerCase() < b.address.toString('hex').toLowerCase() ? -1 : 1,
	);

	return {
		...fixture,
		tokens,
		token0,
		token1,
		fee: FeeAmount.MEDIUM,
		nft,
		pool,
	};
}

export async function endpointFixture() {
	const timestamp = Date.now();
	const fixture = await methodContextFixture();
	const context = methodSwapContext(fixture.createMethodContext(), Buffer.alloc(20), timestamp);
	const {
		token0,
		token1,
		token2,
		token0Decimal,
		token0Symbol,
		token1Decimal,
		token1Symbol,
		token2Decimal,
		token2Symbol,
	} = await completeFixture(context, fixture.module);

	let pool = await fixture.poolStore.createPool(
		context,
		token2,
		token2Symbol,
		parseInt(token2Decimal, 10),
		token1,
		token1Symbol,
		parseInt(token1Decimal, 10),
		FeeAmount.MEDIUM,
	);
	await pool.initialize(encodePriceSqrt(1, 1).toString());

	const positionManagerStore = fixture.module.stores.get(PositionManagerStore);
	const nft = await positionManagerStore.getMutablePositionManager(context, pool.address);

	const liquidityParams = {
		token0: token2,
		token1,
		fee: FeeAmount.MEDIUM,
		tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
		tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]).toString(),
		recipient: Buffer.alloc(20),
		amount0Desired: '1000000',
		amount1Desired: '1000000',
		amount0Min: '0',
		amount1Min: '0',
		deadline: timestamp.toString(),
	};

	await nft.mint(liquidityParams);

	pool = await fixture.poolStore.getMutablePool(context, token2, token1, FeeAmount.MEDIUM);

	const tokens: Tokens = [
		{ address: token0, symbol: () => token0Symbol, decimals: () => token0Decimal },
		{ address: token1, symbol: () => token1Symbol, decimals: () => token1Decimal },
		{ address: token2, symbol: () => token2Symbol, decimals: () => token2Decimal },
	];

	tokens.sort((a, b) =>
		a.address.toString('hex').toLowerCase() < b.address.toString('hex').toLowerCase() ? -1 : 1,
	);

	return {
		...fixture,
		tokens,
		token0,
		token1,
		token2,
		fee: FeeAmount.MEDIUM,
		nft,
		pool,
	};
}

export const methodFixture = endpointFixture;
