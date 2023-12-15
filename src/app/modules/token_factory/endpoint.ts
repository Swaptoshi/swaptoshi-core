import { BaseEndpoint, ModuleEndpointContext } from 'lisk-sdk';
import { NextAvailableTokenIdStore } from './stores/next_available_token_id';
import { serializer } from './utils';
import { FactoryStore } from './stores/factory';
import { GetFactoryParams } from './types';

export class TokenFactoryEndpoint extends BaseEndpoint {
	public async getFactory(context: ModuleEndpointContext) {
		const param = context.params as unknown as GetFactoryParams;

		const factoryStore = this.stores.get(FactoryStore);
		const factory = await factoryStore.getOrDefault(context, Buffer.from(param.tokenId, 'hex'));
		return serializer(factory);
	}

	public async getNextAvailableTokenId(context: ModuleEndpointContext) {
		const nextIdStore = this.stores.get(NextAvailableTokenIdStore);
		const nextId = await nextIdStore.getOrDefault(context);
		return serializer(nextId);
	}
}
