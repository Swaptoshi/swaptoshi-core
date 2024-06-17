/* eslint-disable */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import { BaseModule, ModuleInitArgs, ModuleMetadata, TokenMethod, TransactionExecuteContext } from 'klayr-sdk';
import { LiquidPosEndpoint } from './endpoint';
import { LiquidPosMethod } from './method';
import { LiquidStakingTokenMintEvent } from './events/lst_mint';
import { LiquidStakingTokenBurnEvent } from './events/lst_burn';
import { getLSTTokenIDEndpointRequestSchema, getLSTTokenIDEndpointResponseSchema } from './schema';
import { InternalLiquidPosMethod } from './internal_method';
import { LiquidPosModuleConfig } from './types';
import { defaultConfig } from './constants';

export class LiquidPosModule extends BaseModule {
	public _config: LiquidPosModuleConfig | undefined;
	public _tokenMethod: TokenMethod | undefined;
	private _internalMethod: InternalLiquidPosMethod = new InternalLiquidPosMethod(this.stores, this.events);

	public endpoint = new LiquidPosEndpoint(this.stores, this.offchainStores);
	public method = new LiquidPosMethod(this.stores, this.events);
	public commands = [];

	public constructor() {
		super();
		this.events.register(LiquidStakingTokenMintEvent, new LiquidStakingTokenMintEvent(this.name));
		this.events.register(LiquidStakingTokenBurnEvent, new LiquidStakingTokenBurnEvent(this.name));
	}

	public addDependencies(tokenMethod: TokenMethod) {
		this._tokenMethod = tokenMethod;
		this._internalMethod.addDependencies(tokenMethod);
		this.endpoint.addDependencies(this._internalMethod);
		this.method.addDependencies(this._internalMethod);
	}

	public metadata(): ModuleMetadata {
		return {
			...this.baseMetadata(),
			endpoints: [
				{
					name: this.endpoint.getLSTTokenID.name,
					request: getLSTTokenIDEndpointRequestSchema,
					response: getLSTTokenIDEndpointResponseSchema,
				},
			],
			assets: [],
		};
	}

	public async init(_args: ModuleInitArgs): Promise<void> {
		this._config = { ...defaultConfig, ..._args.moduleConfig };
		this._internalMethod.init(_args.genesisConfig, this._config);
	}

	public async afterCommandExecute(_context: TransactionExecuteContext): Promise<void> {
		await this._internalMethod.handleAfterCommandExecute(_context);
	}
}
