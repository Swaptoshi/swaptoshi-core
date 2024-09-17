/* eslint-disable */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import { Modules, StateMachine } from 'klayr-sdk';
import { LiquidPosEndpoint } from './endpoint';
import { LiquidPosMethod } from './method';
import { LiquidStakingTokenMintEvent } from './events/lst_mint';
import { LiquidStakingTokenBurnEvent } from './events/lst_burn';
import { getConfigEndpointRequestSchema, getConfigEndpointResponseSchema, getLSTTokenIDEndpointRequestSchema, getLSTTokenIDEndpointResponseSchema } from './schema';
import { InternalLiquidPosMethod } from './internal_method';
import { LiquidPosModuleDependencies, TokenMethod } from './types';
import { GovernanceMethod } from '../governance';
import { LiquidPosGovernableConfig } from './config';

export class LiquidPosModule extends Modules.BaseModule {
	public _config = new LiquidPosGovernableConfig(this.name, 0);
	public _tokenMethod: TokenMethod | undefined;
	public _governanceMethod: GovernanceMethod | undefined;
	private _internalMethod: InternalLiquidPosMethod = new InternalLiquidPosMethod(this.stores, this.events);

	public endpoint = new LiquidPosEndpoint(this.stores, this.offchainStores);
	public method = new LiquidPosMethod(this.stores, this.events);
	public commands = [];

	public constructor() {
		super();
		this.stores.register(LiquidPosGovernableConfig, this._config);

		this.events.register(LiquidStakingTokenMintEvent, new LiquidStakingTokenMintEvent(this.name));
		this.events.register(LiquidStakingTokenBurnEvent, new LiquidStakingTokenBurnEvent(this.name));
	}

	public addDependencies(dependencies: LiquidPosModuleDependencies) {
		this._tokenMethod = dependencies.tokenMethod;
		this._governanceMethod = dependencies.governanceMethod;
		this._internalMethod.addDependencies(dependencies.tokenMethod);
		this.endpoint.addDependencies(this._internalMethod);
		this.method.addDependencies(this._internalMethod);
	}

	public metadata(): Modules.ModuleMetadata {
		return {
			...this.baseMetadata(),
			endpoints: [
				{
					name: this.endpoint.getConfig.name,
					request: getConfigEndpointRequestSchema,
					response: getConfigEndpointResponseSchema,
				},
				{
					name: this.endpoint.getLSTTokenID.name,
					request: getLSTTokenIDEndpointRequestSchema,
					response: getLSTTokenIDEndpointResponseSchema,
				},
			],
			assets: [],
		};
	}

	public async init(_args: Modules.ModuleInitArgs): Promise<void> {
		if (this._governanceMethod) {
			this._governanceMethod.registerGovernableConfig(_args, this.name, this._config);
		} else {
			this._config.init(_args);
		}

		this._internalMethod.init(this._config.default, _args.genesisConfig);
		this._internalMethod.checkDependencies();
	}

	public async afterCommandExecute(_context: StateMachine.TransactionExecuteContext): Promise<void> {
		await this._internalMethod.handleAfterCommandExecute(_context);
	}

	public async initGenesisState(context: StateMachine.GenesisBlockExecuteContext): Promise<void> {
		await this._internalMethod.handleInitGenesisState(context);
	}
}
