/* eslint-disable */
import { BaseEndpoint, ModuleEndpointContext, Transaction, TransactionVerifyContext, codec, cryptography, transactionSchema } from 'klayr-sdk';
import { FeeConversionMethodRegistry } from './registry';
import { DryRunTransactionResponse, FeeConversionVerifyStatus, RegisteredMethod, RegisteredMethodResponse } from './types';
import { serializer } from './utils';
import { InternalFeeConversionMethod } from './internal_method';
import { TOKEN_ID_LENGTH } from './constants';
import { FeeConversionGovernableConfig } from './config';
import { dryRunTransactionEndpointResponseSchema, getConfigEndpointResponseSchema, getRegisteredHandlersEndpointResponseSchema } from './schema';

export class FeeConversionEndpoint extends BaseEndpoint {
	protected _handler: FeeConversionMethodRegistry | undefined;
	protected _internalMethod: InternalFeeConversionMethod | undefined;

	public async init(handler: FeeConversionMethodRegistry) {
		this._handler = handler;
	}

	public async addDependencies(internalMethod: InternalFeeConversionMethod) {
		this._internalMethod = internalMethod;
	}

	public async getConfig(_context: ModuleEndpointContext) {
		const configStore = this.stores.get(FeeConversionGovernableConfig);
		const config = await configStore.getConfig(_context);
		return serializer(config, getConfigEndpointResponseSchema);
	}

	public getRegisteredHandlers(_context: ModuleEndpointContext): RegisteredMethodResponse {
		if (!this._handler) throw new Error('FeeConversionEndpoint is not initialized');
		const handlers: RegisteredMethod[] = [];
		const keys = this._handler.keys();

		for (const key of keys) {
			handlers.push({ module: key, method: this._handler.get(key).map(t => t.name) });
		}

		return serializer({ handlers }, getRegisteredHandlersEndpointResponseSchema);
	}

	public async dryRunTransaction(_context: ModuleEndpointContext): Promise<DryRunTransactionResponse> {
		if (!this._internalMethod) throw new Error('FeeConversionEndpoint is not initialized');

		const result: DryRunTransactionResponse = {
			status: FeeConversionVerifyStatus.NO_CONVERSION,
			data: { moduleCommand: '', path: '', token: '', amount: '' },
			errorMessage: '',
		};

		try {
			const tx = codec.decode<Transaction>(transactionSchema, Buffer.from(_context.params.transaction as string, 'hex'));
			const transaction = { ...tx, senderAddress: cryptography.address.getAddressFromPublicKey(tx.senderPublicKey) };
			const context = { ..._context, transaction } as unknown as TransactionVerifyContext;
			const handlerResult = await this._internalMethod.executeHandlers(context);

			if (handlerResult.status === FeeConversionVerifyStatus.WITH_CONVERSION && handlerResult.payload) {
				result.status = handlerResult.status;
				result.data = {
					moduleCommand: `${context.transaction.module}:${context.transaction.command}`,
					path: handlerResult.payload.path.toString('hex'),
					token: handlerResult.payload.path.subarray(handlerResult.payload.path.length - TOKEN_ID_LENGTH, handlerResult.payload.path.length).toString('hex'),
					amount: handlerResult.payload.amountIn,
				};
				await this._internalMethod.verify(context);
			}
		} catch (err: unknown) {
			result.status = FeeConversionVerifyStatus.ERROR;
			result.errorMessage = (err as { message: string }).message;
		}

		return serializer(result, dryRunTransactionEndpointResponseSchema);
	}
}
