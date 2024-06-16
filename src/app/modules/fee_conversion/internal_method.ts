/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/member-ordering */
import { BaseMethod, FeeMethod, TokenMethod, TransactionExecuteContext, TransactionVerifyContext } from 'klayr-sdk';
import { FeeConversionPayload, FeeConversionVerifyStatus } from './types';
import { FeeConversionMethodRegistry } from './registry';
import { DexMethod } from '../dex/method';
import { FeeConvertedEvent } from './events/fee_converted';

interface HandlerExecutionResult {
	status: FeeConversionVerifyStatus;
	payload?: FeeConversionPayload;
}

export class InternalFeeConversionMethod extends BaseMethod {
	private _handler: FeeConversionMethodRegistry | undefined;
	private _dexMethod: DexMethod | undefined;
	private _feeMethod: FeeMethod | undefined;
	private _tokenMethod: TokenMethod | undefined;

	public init(handler: FeeConversionMethodRegistry) {
		this._handler = handler;
	}

	public addDependencies(feeMethod: FeeMethod, tokenMethod: TokenMethod, dexMethod: DexMethod) {
		this._feeMethod = feeMethod;
		this._tokenMethod = tokenMethod;
		this._dexMethod = dexMethod;
	}

	public async verify(context: TransactionVerifyContext) {
		const handlerExecutionResult = await this._executeHandlers(context);

		if (handlerExecutionResult.status === FeeConversionVerifyStatus.WITH_CONVERSION && handlerExecutionResult.payload) {
			const senderTokenInBalance = await this._tokenMethod!.getAvailableBalance(context, context.transaction.senderAddress, handlerExecutionResult.payload.tokenIn);
			if (senderTokenInBalance < BigInt(handlerExecutionResult.payload.amountIn)) {
				throw new Error(`Insufficient ${handlerExecutionResult.payload.tokenIn.toString('hex')} balance for feeConversion. Minimum required balance is ${handlerExecutionResult.payload.amountIn}.`);
			}
			if (senderTokenInBalance < BigInt(handlerExecutionResult.payload.amountIn) + BigInt(handlerExecutionResult.payload.txAmount)) {
				throw new Error(
					`Insufficient ${handlerExecutionResult.payload.tokenIn.toString('hex')} balance to swap ${
						handlerExecutionResult.payload.txAmount
					} of tokens with feeConversion. Total minimum required balance is ${(BigInt(handlerExecutionResult.payload.amountIn) + BigInt(handlerExecutionResult.payload.txAmount)).toString()}.`,
				);
			}
		} else {
			const balance = await this._tokenMethod!.getAvailableBalance(context, context.transaction.senderAddress, this._feeMethod!.getFeeTokenID());
			if (context.transaction.fee > balance) {
				throw new Error(`Insufficient balance.`);
			}
		}

		return handlerExecutionResult;
	}

	public async execute(context: TransactionExecuteContext) {
		const verifyResult = await this.verify(context);

		if (verifyResult.status === FeeConversionVerifyStatus.WITH_CONVERSION && verifyResult.payload) {
			const pool = await this._dexMethod!.getPool(
				context,
				context.transaction.senderAddress,
				context.header.timestamp,
				verifyResult.payload.tokenIn,
				verifyResult.payload.tokenOut,
				verifyResult.payload.fee,
			);

			const dexRouter = await this._dexMethod!.getRouter(context, context.transaction.senderAddress, context.header.timestamp);

			await dexRouter.exactOutputSingle({
				tokenIn: verifyResult.payload.tokenIn,
				tokenOut: verifyResult.payload.tokenOut,
				fee: verifyResult.payload.fee,
				amountInMaximum: verifyResult.payload.amountIn,
				sqrtPriceLimitX96: '0',
				amountOut: verifyResult.payload.amountOut,
				recipient: context.transaction.senderAddress,
				deadline: context.header.timestamp.toString(),
			});

			const events = this.events.get(FeeConvertedEvent);
			events.add(
				context,
				{
					moduleCommand: `${context.transaction.module}:${context.transaction.command}`,
					poolAddress: pool.address,
					amount: verifyResult.payload.amountIn,
					token: verifyResult.payload.tokenIn,
				},
				[context.transaction.senderAddress],
			);
		}
	}

	private async _executeHandlers(context: TransactionVerifyContext): Promise<HandlerExecutionResult> {
		if (!this._handler || !this._dexMethod || !this._feeMethod || !this._tokenMethod) {
			throw new Error('InternalFeeConversionMethod dependencies is not configured properly');
		}

		const key = `${context.transaction.module}:${context.transaction.command}`;

		if (!this._handler.has(key)) return { status: FeeConversionVerifyStatus.NO_CONVERSION };

		for (const method of this._handler.get(key)) {
			const { status: handlerStatus, payload: handlerPayload } = await method.verifyFeeConversion(context);
			if (handlerStatus === FeeConversionVerifyStatus.WITH_CONVERSION && handlerPayload) {
				const tokenOut = this._feeMethod.getFeeTokenID();
				const sender = context.transaction.senderAddress;
				const senderFeeBalance = await this._tokenMethod.getAvailableBalance(context, sender, tokenOut);
				const feeDifference = senderFeeBalance - context.transaction.fee;

				const amount = (feeDifference * BigInt(-1)).toString();

				const dexQuoter = await this._dexMethod.getQuoter(context, context.transaction.senderAddress, context.header.timestamp);
				const dexConfig = await this._dexMethod.getConfig();

				for (const feeTickSpaingMap of dexConfig.feeAmountTickSpacing) {
					const [fee] = feeTickSpaingMap;

					if (await this._dexMethod.poolExists(context, handlerPayload.tokenId, tokenOut, fee)) {
						const { amountIn } = await dexQuoter.quoteExactOutputSingle({
							tokenIn: handlerPayload.tokenId.toString('hex'),
							tokenOut: tokenOut.toString('hex'),
							amount: amount.toString(),
							fee,
							sqrtPriceLimitX96: '0',
						});
						return {
							status: handlerStatus,
							payload: {
								tokenIn: handlerPayload.tokenId,
								tokenOut,
								fee,
								txAmount: handlerPayload.txAmount,
								amountIn,
								amountOut: amount,
							},
						};
					}
				}
			}
		}

		return { status: FeeConversionVerifyStatus.NO_CONVERSION };
	}
}
