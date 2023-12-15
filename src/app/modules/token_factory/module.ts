/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import {
	BaseModule,
	FeeMethod,
	ModuleInitArgs,
	ModuleMetadata,
	TokenMethod,
	TransactionVerifyContext,
	VerificationResult,
	VerifyStatus,
} from 'lisk-sdk';
import { BurnCommand } from './commands/burn_command';
import { CreateCommand } from './commands/create_command';
import { MintCommand } from './commands/mint_command';
import { TokenFactoryEndpoint } from './endpoint';
import { TokenFactoryMethod } from './method';
import { defaultConfig } from './constants';
import { TokenFactoryModuleConfig } from './types';
import { NextAvailableTokenIdStore } from './stores/next_available_token_id';
import { FactoryStore } from './stores/factory';
import { CreateTokenFactoryEvent } from './events/create_token_factory';
import { verifyMinimumFee } from './hooks';
import {
	getFactoryEndpointRequestSchema,
	getFactoryEndpointResponseSchema,
} from './schema/endpoint/get_factory';
import {
	getNextIdEndpointRequestSchema,
	getNextIdEndpointResponseSchema,
} from './schema/endpoint/get_next_available_id';

export class TokenFactoryModule extends BaseModule {
	public _config: TokenFactoryModuleConfig | undefined;
	public _tokenMethod: TokenMethod | undefined;
	public _feeMethod: FeeMethod | undefined;

	public endpoint = new TokenFactoryEndpoint(this.stores, this.offchainStores);
	public method = new TokenFactoryMethod(this.stores, this.events);

	public _createCommand = new CreateCommand(this.stores, this.events);
	public _mintCommand = new MintCommand(this.stores, this.events);
	public _burnCommand = new BurnCommand(this.stores, this.events);

	public commands = [this._createCommand, this._mintCommand, this._burnCommand];

	public constructor() {
		super();
		this.stores.register(NextAvailableTokenIdStore, new NextAvailableTokenIdStore(this.name, 0));
		this.stores.register(FactoryStore, new FactoryStore(this.name, 1));

		this.events.register(CreateTokenFactoryEvent, new CreateTokenFactoryEvent(this.name));
	}

	public addDependencies(tokenMethod: TokenMethod, feeMethod: FeeMethod) {
		this._createCommand.addDependencies(tokenMethod, feeMethod);
		this._mintCommand.addDependencies(tokenMethod);
		this._burnCommand.addDependencies(tokenMethod);
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	public async init(_args: ModuleInitArgs): Promise<void> {
		this._config = { ...defaultConfig, ..._args.moduleConfig };
		this._createCommand.init(this._config);
	}

	public metadata(): ModuleMetadata {
		return {
			...this.baseMetadata(),
			endpoints: [
				{
					name: this.endpoint.getFactory.name,
					request: getFactoryEndpointRequestSchema,
					response: getFactoryEndpointResponseSchema,
				},
				{
					name: this.endpoint.getNextAvailableTokenId.name,
					request: getNextIdEndpointRequestSchema,
					response: getNextIdEndpointResponseSchema,
				},
			],
			assets: [],
		};
	}

	public async verifyTransaction(_context: TransactionVerifyContext): Promise<VerificationResult> {
		try {
			await verifyMinimumFee(_context, this._config!);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}
}
