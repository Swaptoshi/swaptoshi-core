/* eslint-disable */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/member-ordering */

import { BaseModule, FeeMethod, ModuleInitArgs, ModuleMetadata, TransactionExecuteContext, TransactionVerifyContext, VerificationResult, VerifyStatus } from 'klayr-sdk';
import { FeeConversionEndpoint } from './endpoint';
import { FeeConversionMethod } from './method';
import { FeeConversionMethodRegistry } from './registry';
import {
	dryRunTransactionEndpointRequestSchema,
	dryRunTransactionEndpointResponseSchema,
	getConfigEndpointRequestSchema,
	getConfigEndpointResponseSchema,
	getRegisteredHandlersEndpointRequestSchema,
	getRegisteredHandlersEndpointResponseSchema,
} from './schema';
import { FeeConvertedEvent } from './events/fee_converted';
import { InternalFeeConversionMethod } from './internal_method';
import { FeeConversionGovernableConfig } from './config';
import { GovernanceMethod } from '../governance';
import { FeeConversionModuleDependencies } from './types';
import { CONTEXT_STORE_KEY_AVAILABLE_FEE } from './constants';

export class FeeConversionModule extends BaseModule {
	public endpoint = new FeeConversionEndpoint(this.stores, this.offchainStores);
	public method = new FeeConversionMethod(this.stores, this.events);
	public commands = [];

	private _config = new FeeConversionGovernableConfig(this.name, 0);
	private _handler = new FeeConversionMethodRegistry();
	private _internalMethod = new InternalFeeConversionMethod(this.stores, this.events);
	private _governanceMethod: GovernanceMethod | undefined;
	private _feeMethod: FeeMethod | undefined;

	public constructor() {
		super();
		this.stores.register(FeeConversionGovernableConfig, this._config);

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
				{
					name: this.endpoint.dryRunTransaction.name,
					request: dryRunTransactionEndpointRequestSchema,
					response: dryRunTransactionEndpointResponseSchema,
				},
			],
			assets: [],
		};
	}

	// Lifecycle hooks
	public async init(_args: ModuleInitArgs): Promise<void> {
		this.method.init(this._handler);
		this.endpoint.init(this._handler);
		await this._internalMethod.init(this._handler);
		await this._internalMethod.checkDependencies();

		if (this._governanceMethod) {
			this._governanceMethod.registerGovernableConfig(_args, this.name, this._config);
		} else {
			this._config.init(_args);
		}
	}

	public addDependencies(dependencies: FeeConversionModuleDependencies) {
		this._feeMethod = dependencies.feeMethod;
		this._governanceMethod = dependencies.governanceMethod;
		this._internalMethod.addDependencies(dependencies.feeMethod, dependencies.tokenMethod, dependencies.dexMethod);
		this.endpoint.addDependencies(this._internalMethod);
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
		const { transaction, header } = _context;

		const minFee = this._getMinFee(header.height, transaction.getBytes().length);
		const availableFee = transaction.fee - minFee;

		_context.contextStore.set(CONTEXT_STORE_KEY_AVAILABLE_FEE, availableFee);

		await this._internalMethod.execute(_context);
	}

	public _getMinFee(blockHeight: number, transactionByteLength: number): bigint {
		const feeConfig = this._feeMethod!.getConfig();
		if (blockHeight < feeConfig.maxBlockHeightZeroFeePerByte) {
			return BigInt(0);
		}
		return BigInt(feeConfig.minFeePerByte) * BigInt(transactionByteLength);
	}
}
