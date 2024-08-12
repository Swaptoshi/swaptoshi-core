import { BaseEndpoint, cryptography, ModuleEndpointContext } from 'klayr-sdk';
import { endpointSwapContext } from './stores/context';
import { Quoter } from './stores/library/lens';
import {
	verifyQuoteExactInputParam,
	verifyQuoteExactOutputParam,
	verifyQuoteExactInputSingleParam,
	verifyQuoteExactOutputSingleParam,
	verifyGetPoolParam,
	verifyGetPositionParam,
	verifyGetTokenURIParam,
	serializer,
	verifyGetPoolAddressFromCollectionIdParam,
	verifyObserveParam,
	verifyGetMetadataParam,
	verifyPriceParam,
} from './utils';
import {
	GetMetadataParams,
	GetPoolParams,
	GetPositionParams,
	GetTokenURIParams,
	ObserveParams,
	QuoteExactInputParams,
	QuoteExactInputSingleParams,
	QuoteExactOutputParams,
	QuoteExactOutputSingleParams,
	QuotePriceParams,
	GetPoolAddressFromCollectionIdParams,
} from './types';
import { PoolStore } from './stores/pool';
import { PositionManagerStore } from './stores/position_manager';
import { PoolAddress } from './stores/library/periphery';
import { DexGovernableConfig } from './config';
import {
	getConfigEndpointResponseSchema,
	getMetadataEndpointResponseSchema,
	getPoolEndpointResponseSchema,
	getPositionEndpointResponseSchema,
	getTokenURIEndpointResponseSchema,
	observeEndpointResponseSchema,
	quoteExactInputEndpointResponseSchema,
	quoteExactInputSingleEndpointResponseSchema,
	quoteExactOutputEndpointResponseSchema,
	quoteExactOutputSingleEndpointResponseSchema,
	quotePriceEndpointResponseSchema,
} from './schema';

export class DexEndpoint extends BaseEndpoint {
	public async getConfig(_context: ModuleEndpointContext) {
		const configStore = this.stores.get(DexGovernableConfig);
		const config = await configStore.getConfig(_context);
		return serializer(config, getConfigEndpointResponseSchema);
	}

	public async quoteExactInput(context: ModuleEndpointContext) {
		const param = context.params as unknown as QuoteExactInputParams;
		verifyQuoteExactInputParam(param);

		const _context = endpointSwapContext(context);
		const quoter = new Quoter(_context, this.stores);
		return serializer(await quoter.quoteExactInput(Buffer.from(param.path, 'hex'), param.amountIn), quoteExactInputEndpointResponseSchema);
	}

	public async quoteExactInputSingle(context: ModuleEndpointContext) {
		const param = context.params as unknown as QuoteExactInputSingleParams;
		verifyQuoteExactInputSingleParam(param);

		const _context = endpointSwapContext(context);
		const quoter = new Quoter(_context, this.stores);
		return serializer(await quoter.quoteExactInputSingle(param), quoteExactInputSingleEndpointResponseSchema);
	}

	public async quoteExactOutput(context: ModuleEndpointContext) {
		const param = context.params as unknown as QuoteExactOutputParams;
		verifyQuoteExactOutputParam(param);

		const _context = endpointSwapContext(context);
		const quoter = new Quoter(_context, this.stores);
		return serializer(await quoter.quoteExactOutput(Buffer.from(param.path, 'hex'), param.amountOut), quoteExactOutputEndpointResponseSchema);
	}

	public async quoteExactOutputSingle(context: ModuleEndpointContext) {
		const param = context.params as unknown as QuoteExactOutputSingleParams;
		verifyQuoteExactOutputSingleParam(param);

		const _context = endpointSwapContext(context);
		const quoter = new Quoter(_context, this.stores);
		return serializer(await quoter.quoteExactOutputSingle(param), quoteExactOutputSingleEndpointResponseSchema);
	}

	public async quotePrice(context: ModuleEndpointContext) {
		const param = context.params as unknown as QuotePriceParams;
		verifyPriceParam(param);

		const _context = endpointSwapContext(context);
		const quoter = new Quoter(_context, this.stores);
		return serializer(await quoter.quotePrice(Buffer.from(param.path, 'hex')), quotePriceEndpointResponseSchema);
	}

	public async getPoolAddressFromCollectionId(context: ModuleEndpointContext) {
		const param = context.params as unknown as GetPoolAddressFromCollectionIdParams;
		verifyGetPoolAddressFromCollectionIdParam(param);

		const positionManagerStore = this.stores.get(PositionManagerStore);
		const positionManager = await positionManagerStore.get(context, Buffer.from(param.collectionId, 'hex'));

		return { poolAddress: positionManager.poolAddress.toString('hex') };
	}

	public async getPool(context: ModuleEndpointContext) {
		const param = context.params as unknown as GetPoolParams;
		verifyGetPoolParam(param);

		const _context = endpointSwapContext(context);
		const poolStore = this.stores.get(PoolStore);
		const pool = await poolStore.getImmutablePool(_context, Buffer.from(param.tokenA, 'hex'), Buffer.from(param.tokenB, 'hex'), param.fee);
		return serializer(
			{
				...pool.toJSON(),
				address: pool.address,
				collectionId: pool.collectionId,
			},
			getPoolEndpointResponseSchema,
		);
	}

	public async getPosition(context: ModuleEndpointContext) {
		const param = context.params as unknown as GetPositionParams;
		verifyGetPositionParam(param);

		const _context = endpointSwapContext(context);
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const positionManager = await positionManagerStore.getImmutablePositionManager(_context, cryptography.address.getAddressFromKlayr32Address(param.poolAddress));
		const poolStore = this.stores.get(PoolStore);
		const { token0, token1, fee } = PoolAddress.decodePoolAddress(cryptography.address.getAddressFromKlayr32Address(param.poolAddress));
		const pool = await poolStore.getImmutablePool(_context, token0, token1, fee);
		const position = await positionManager.getPositions(param.tokenId);
		const [principal0, principal1] = await positionManager.principal(param.tokenId, pool.slot0.sqrtPriceX96);
		const [fees0, fees1] = await positionManager.fees(param.tokenId);
		return serializer(
			{
				...position,
				value: {
					principal0,
					principal1,
					fees0,
					fees1,
				},
			},
			getPositionEndpointResponseSchema,
		);
	}

	public async getTokenURI(context: ModuleEndpointContext) {
		const param = context.params as unknown as GetTokenURIParams;
		verifyGetTokenURIParam(param);

		const _context = endpointSwapContext(context);
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const positionManager = await positionManagerStore.getImmutablePositionManager(_context, cryptography.address.getAddressFromKlayr32Address(param.poolAddress));
		return serializer({ tokenURI: await positionManager.tokenURI(param.tokenId) }, getTokenURIEndpointResponseSchema);
	}

	public async getMetadata(context: ModuleEndpointContext) {
		const param = context.params as unknown as GetMetadataParams;
		verifyGetMetadataParam(param);

		const _context = endpointSwapContext(context);
		const positionManagerStore = this.stores.get(PositionManagerStore);
		const positionManager = await positionManagerStore.getImmutablePositionManager(_context, cryptography.address.getAddressFromKlayr32Address(param.poolAddress));
		return serializer(await positionManager.getMetadata(param.tokenId), getMetadataEndpointResponseSchema);
	}

	public async observe(context: ModuleEndpointContext) {
		const param = context.params as unknown as ObserveParams;
		verifyObserveParam(param);

		const _context = endpointSwapContext(context);
		const poolStore = this.stores.get(PoolStore);
		const key = PoolAddress.decodePoolAddress(cryptography.address.getAddressFromKlayr32Address(param.poolAddress));
		const pool = await poolStore.getImmutablePool(_context, key.token0, key.token1, key.fee);
		return serializer(await pool.observe(param.secondsAgos), observeEndpointResponseSchema);
	}
}
