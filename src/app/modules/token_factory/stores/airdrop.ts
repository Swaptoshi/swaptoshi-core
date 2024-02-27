/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable import/no-cycle */
import {
	AirdropStoreData,
	ImmutableFactoryContext,
	MutableFactoryContext,
	StoreInstance,
} from '../types';
import { airdropStoreSchema } from '../schema/stores/airdrop';
import { ADDRESS_LENGTH, TOKEN_ID_LENGTH } from '../constants';
import { Airdrop } from './instances/airdrop';
import { BaseStoreWithInstance } from './base';

export class AirdropStore extends BaseStoreWithInstance<AirdropStoreData> {
	// eslint-disable-next-line @typescript-eslint/require-await
	public async getMutableEmptyAirdrop(ctx: MutableFactoryContext): Promise<StoreInstance<Airdrop>> {
		this._checkDependencies();

		const airdrop = new Airdrop(
			this.stores,
			this.events,
			this.genesisConfig!,
			this.factoryConfig!,
			this.moduleName,
			this.default,
			Buffer.alloc(0),
			Buffer.alloc(0),
		);

		airdrop.addMutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			feeMethod: this.feeMethod!,
		});

		return airdrop;
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async getImmutableEmptyAirdrop(
		ctx: ImmutableFactoryContext,
	): Promise<StoreInstance<Airdrop>> {
		this._checkDependencies();

		const airdrop = new Airdrop(
			this.stores,
			this.events,
			this.genesisConfig!,
			this.factoryConfig!,
			this.moduleName,
			this.default,
			Buffer.alloc(0),
			Buffer.alloc(0),
		);

		airdrop.addImmutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			feeMethod: this.feeMethod!,
		});

		return airdrop;
	}

	public async getMutableAirdrop(
		ctx: MutableFactoryContext,
		tokenId: Buffer,
		providerAddress: Buffer,
	): Promise<StoreInstance<Airdrop>> {
		this._checkDependencies();

		const airdropData = await this.get(ctx.context, this._getKey(tokenId, providerAddress));

		const airdrop = new Airdrop(
			this.stores,
			this.events,
			this.genesisConfig!,
			this.factoryConfig!,
			this.moduleName,
			airdropData,
			tokenId,
			providerAddress,
		);

		airdrop.addMutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			feeMethod: this.feeMethod!,
		});

		return airdrop;
	}

	public async getImmutableAirdrop(
		ctx: ImmutableFactoryContext,
		tokenId: Buffer,
		providerAddress: Buffer,
	): Promise<StoreInstance<Airdrop>> {
		this._checkDependencies();

		const airdropData = await this.get(ctx.context, this._getKey(tokenId, providerAddress));

		const airdrop = new Airdrop(
			this.stores,
			this.events,
			this.genesisConfig!,
			this.factoryConfig!,
			this.moduleName,
			airdropData,
			tokenId,
			providerAddress,
		);

		airdrop.addImmutableDependencies({
			context: ctx,
			tokenMethod: this.tokenMethod!,
			feeMethod: this.feeMethod!,
		});

		return airdrop;
	}

	private _getKey(tokenId: Buffer, providerAddress: Buffer) {
		if (tokenId.length !== TOKEN_ID_LENGTH) {
			throw new Error('invalid token id');
		}
		if (providerAddress.length !== ADDRESS_LENGTH) {
			throw new Error('invalid providerAddress');
		}
		return Buffer.concat([tokenId, providerAddress]);
	}

	public schema = airdropStoreSchema;
	protected readonly default = { recipients: [] };
}
