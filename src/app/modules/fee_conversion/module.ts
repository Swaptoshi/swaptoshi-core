/* eslint-disable */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import { BaseModule, FeeMethod, ModuleInitArgs, ModuleMetadata, TokenMethod, TransactionExecuteContext, TransactionVerifyContext, VerificationResult, VerifyStatus, utils } from 'klayr-sdk';
import { FeeConversionEndpoint } from './endpoint';
import { FeeConversionMethod } from './method';
import { FeeConversionMethodRegistry } from './registry';
import { getConfigEndpointRequestSchema, getConfigEndpointResponseSchema, getRegisteredHandlersEndpointRequestSchema, getRegisteredHandlersEndpointResponseSchema } from './schema';
import { FeeConvertedEvent } from './events/fee_converted';
import { InternalFeeConversionMethod } from './internal_method';
import { DexMethod } from '../dex/method';
import { defaultConfig } from './constants';
import { FeeConversionModuleConfig } from './types';

export class FeeConversionModule extends BaseModule {
	public endpoint = new FeeConversionEndpoint(this.stores, this.offchainStores);
	public method = new FeeConversionMethod(this.stores, this.events);
	public commands = [];

	private _config: FeeConversionModuleConfig | undefined;
	private _handler = new FeeConversionMethodRegistry();
	private _internalMethod = new InternalFeeConversionMethod(this.stores, this.events);

	public constructor() {
		super();
		this.events.register(FeeConvertedEvent, new FeeConvertedEvent(this.name));
	}

	public metadata(): ModuleMetadata {
		return {
			...this.baseMetadata(),
			endpoints: [
				{
					name: this.endpoint.getConfig.name,
					request: getConfigEndpointRequestSchema,
					response: getConfigEndpointResponseSchema,
				},
				{
					name: this.endpoint.getRegisteredHandlers.name,
					request: getRegisteredHandlersEndpointRequestSchema,
					response: getRegisteredHandlersEndpointResponseSchema,
				},
			],
			assets: [],
		};
	}

	// Lifecycle hooks
	public async init(_args: ModuleInitArgs): Promise<void> {
		this._config = utils.objects.mergeDeep({}, defaultConfig, _args.moduleConfig) as FeeConversionModuleConfig;
		this.method.init(this._handler);
		this.endpoint.init(this._handler, this._config);
		await this._internalMethod.init(this._handler, _args, this._config);
	}

	public addDependencies(tokenMethod: TokenMethod, feeMethod: FeeMethod, dexMethod: DexMethod) {
		this._internalMethod.addDependencies(feeMethod, tokenMethod, dexMethod);
	}

	public async verifyTransaction(_context: TransactionVerifyContext): Promise<VerificationResult> {
		try {
			await this._internalMethod.verify(_context);
		} catch (error: unknown) {
			return {
				status: VerifyStatus.FAIL,
				error: new Error((error as { message: string }).message),
			};
		}
		return { status: VerifyStatus.OK };
	}

	public async beforeCommandExecute(_context: TransactionExecuteContext): Promise<void> {
		await this._internalMethod.execute(_context);
	}
}
