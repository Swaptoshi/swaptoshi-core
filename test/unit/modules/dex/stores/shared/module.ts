/* eslint-disable import/no-cycle */
/* eslint-disable import/no-extraneous-dependencies */
import { FeeMethod, MainchainInteroperabilityMethod, Schema, SidechainInteroperabilityMethod, TokenMethod, Transaction, codec, cryptography, testing } from 'klayr-sdk';
import { PrefixedStateReadWriter } from 'klayr-framework/dist-node/state_machine/prefixed_state_read_writer';
import { DexModule } from '../../../../../../src/app/modules/dex/module';
import { ObservationStore } from '../../../../../../src/app/modules/dex/stores/observation';
import { PoolStore } from '../../../../../../src/app/modules/dex/stores/pool';
import { PositionInfoStore } from '../../../../../../src/app/modules/dex/stores/position_info';
import { PositionManagerStore } from '../../../../../../src/app/modules/dex/stores/position_manager';
import { TickBitmapStore } from '../../../../../../src/app/modules/dex/stores/tick_bitmap';
import { TickInfoStore } from '../../../../../../src/app/modules/dex/stores/tick_info';
import { TokenSymbolStore } from '../../../../../../src/app/modules/dex/stores/token_symbol';
import { MockedTokenMethod } from './token';
import { MockedNFTMethod } from './nft/index';
import { DexModuleConfig } from '../../../../../../src/app/modules/dex/types';
import { DEFAULT_TREASURY_ADDRESS } from '../../../../../../src/app/modules/dex/constants';
import { MockedFeeMethod } from './fee';
import { SupportedTokenStore } from '../../../../../../src/app/modules/dex/stores/supported_token';
import { TokenFactoryMethod } from '../../../../../../src/app/modules/token_factory/method';
import { NFTMethod } from '../../../../../../src/app/modules/nft';
import { MockedFeeConversionMethod } from './fee_conversion';
import { FeeConversionMethod } from '../../../../../../src/app/modules/fee_conversion';

export const chainID = Buffer.from('00000001', 'hex');
export const tokenID = Buffer.concat([chainID, Buffer.alloc(4, 0)]);
export const moduleConfig: DexModuleConfig = {
	feeAmountTickSpacing: [
		['500', '10'],
		['3000', '60'],
		['10000', '200'],
	],
	feeProtocol: 0,
	feeProtocolPool: cryptography.address.getKlayr32AddressFromAddress(DEFAULT_TREASURY_ADDRESS),
	feeConversionEnabled: true,
	supportAllTokens: true,
	minTransactionFee: {
		createPool: '0',
		mint: '0',
		burn: '0',
		collect: '0',
		increaseLiquidity: '0',
		decreaseLiquidity: '0',
		exactInput: '0',
		exactInputSingle: '0',
		exactOutput: '0',
		exactOutputSingle: '0',
		treasurify: '0',
	},
	baseFee: {
		createPool: '0',
		mint: '0',
		burn: '0',
		collect: '0',
		increaseLiquidity: '0',
		decreaseLiquidity: '0',
		exactInput: '0',
		exactInputSingle: '0',
		exactOutput: '0',
		exactOutputSingle: '0',
		treasurify: '0',
	},
	nftPositionMetadata: {
		dex: {
			name: 'Swaptoshi',
			symbol: 'SWX',
			decimal: 8,
		},
		mainchain: {
			symbol: 'KLY',
			decimal: 8,
		},
	},
};

export async function storeFixture() {
	const module = new DexModule();
	const tokenMethod = new MockedTokenMethod() as TokenMethod;
	const nftMethod = new MockedNFTMethod() as NFTMethod;
	const feeMethod = new MockedFeeMethod() as FeeMethod;
	const feeConversionMethod = new MockedFeeConversionMethod() as FeeConversionMethod;
	const tokenFactoryMethod = {
		isFeeConversion: () => ({ status: false, payload: undefined }),
	} as unknown as TokenFactoryMethod;
	const interoperabilityMethod = {} as SidechainInteroperabilityMethod | MainchainInteroperabilityMethod;
	const stateStore = new PrefixedStateReadWriter(new testing.InMemoryPrefixedStateDB());

	await module.init({ moduleConfig: moduleConfig as any, genesisConfig: { chainID } as any });
	module.addDependencies(tokenMethod, nftMethod, feeMethod, tokenFactoryMethod, interoperabilityMethod, feeConversionMethod);

	const observationStore = module.stores.get(ObservationStore);
	const positionInfoStore = module.stores.get(PositionInfoStore);
	const tickBitmapStore = module.stores.get(TickBitmapStore);
	const tickInfoStore = module.stores.get(TickInfoStore);
	const tokenSymbolStore = module.stores.get(TokenSymbolStore);

	const supportedTokenStore = module.stores.get(SupportedTokenStore);
	supportedTokenStore.addDependencies(tokenMethod);
	await supportedTokenStore.apply(stateStore);

	const poolStore = module.stores.get(PoolStore);
	poolStore.addDependencies(tokenMethod);

	const positionManagerStore = module.stores.get(PositionManagerStore);
	positionManagerStore.addDependencies(tokenMethod, nftMethod);

	return {
		config: moduleConfig,
		module,
		tokenMethod,
		nftMethod,
		feeMethod,
		feeConversionMethod,
		tokenFactoryMethod,
		interoperabilityMethod,
		stateStore,
		observationStore,
		positionInfoStore,
		tickBitmapStore,
		tickInfoStore,
		tokenSymbolStore,
		poolStore,
		positionManagerStore,
	};
}

export async function commandContextFixture<T extends object>(command: string, commandSchema: Schema, senderPublicKey: Buffer) {
	const {
		config,
		module,
		tokenMethod,
		tokenFactoryMethod,
		interoperabilityMethod,
		nftMethod,
		stateStore,
		observationStore,
		positionInfoStore,
		tickBitmapStore,
		tickInfoStore,
		tokenSymbolStore,
		poolStore,
		positionManagerStore,
	} = await storeFixture();

	function createCommandContext(param: T) {
		const encodedTransactionParams = codec.encode(commandSchema, param);
		const transaction = new Transaction({
			module: module.name,
			command,
			senderPublicKey,
			nonce: BigInt(0),
			fee: BigInt(1000000000),
			params: encodedTransactionParams,
			signatures: [senderPublicKey],
		});
		return testing.createTransactionContext({ chainID, stateStore, transaction });
	}

	function createCommandVerifyContext(param: T) {
		const context = createCommandContext(param);
		return context.createCommandVerifyContext<T>(commandSchema);
	}

	function createCommandExecuteContext(param: T) {
		const context = createCommandContext(param);
		return context.createCommandExecuteContext<T>(commandSchema);
	}

	return {
		config,
		module,
		tokenMethod,
		nftMethod,
		tokenFactoryMethod,
		interoperabilityMethod,
		stateStore,
		observationStore,
		positionInfoStore,
		tickBitmapStore,
		tickInfoStore,
		tokenSymbolStore,
		poolStore,
		positionManagerStore,
		createCommandContext,
		createCommandVerifyContext,
		createCommandExecuteContext,
	};
}

export async function hookContextFixture() {
	const {
		config,
		module,
		tokenMethod,
		nftMethod,
		feeMethod,
		feeConversionMethod,
		tokenFactoryMethod,
		interoperabilityMethod,
		stateStore,
		observationStore,
		positionInfoStore,
		tickBitmapStore,
		tickInfoStore,
		tokenSymbolStore,
		poolStore,
		positionManagerStore,
	} = await storeFixture();

	function createTransactionVerifyContext(transaction: Transaction) {
		return testing
			.createBlockContext({ chainID, stateStore, transactions: [transaction] })
			.getTransactionContext(transaction)
			.createTransactionVerifyContext();
	}

	function createTransactionExecuteContext(transaction: Transaction) {
		return testing
			.createBlockContext({ chainID, stateStore, transactions: [transaction] })
			.getTransactionContext(transaction)
			.createTransactionExecuteContext();
	}

	return {
		config,
		module,
		tokenMethod,
		nftMethod,
		feeMethod,
		feeConversionMethod,
		tokenFactoryMethod,
		interoperabilityMethod,
		stateStore,
		observationStore,
		positionInfoStore,
		tickBitmapStore,
		tickInfoStore,
		tokenSymbolStore,
		poolStore,
		positionManagerStore,
		createTransactionVerifyContext,
		createTransactionExecuteContext,
	};
}

export async function methodContextFixture() {
	const {
		config,
		module,
		tokenMethod,
		nftMethod,
		interoperabilityMethod,
		stateStore,
		observationStore,
		positionInfoStore,
		tickBitmapStore,
		tickInfoStore,
		tokenSymbolStore,
		poolStore,
		positionManagerStore,
	} = await storeFixture();

	function createMethodContext() {
		return testing.createTransientMethodContext({ stateStore });
	}

	return {
		config,
		module,
		tokenMethod,
		nftMethod,
		interoperabilityMethod,
		stateStore,
		observationStore,
		positionInfoStore,
		tickBitmapStore,
		tickInfoStore,
		tokenSymbolStore,
		poolStore,
		positionManagerStore,
		createMethodContext,
	};
}
