/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/member-ordering */
import { BaseMethod, FeeMethod, TokenMethod, TransactionExecuteContext, TransactionVerifyContext } from 'klayr-sdk';
import { FeeConversionVerifyStatus, HandlerExecutionResult } from './types';
import { FeeConversionMethodRegistry } from './registry';
import { DexMethod } from '../dex/method';
import { FeeConvertedEvent } from './events/fee_converted';
import { PATH_MINIMUM_LENGTH, PATH_OFFSET_LENGTH, TOKEN_ID_LENGTH } from './constants';
import { FEE_SIZE } from '../token_factory/stores/library';
import { FeeConversionGovernableConfig } from './config';

interface ConversionCheck {
	path: Buffer;
	amountIn: string;
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
		const handlerExecutionResult = await this.executeHandlers(context);

		if (handlerExecutionResult.status === FeeConversionVerifyStatus.WITH_CONVERSION && handlerExecutionResult.payload) {
			const { path } = handlerExecutionResult.payload;
			const tokenIn = path.subarray(path.length - TOKEN_ID_LENGTH, path.length);
			const senderTokenInBalance = await this._tokenMethod!.getAvailableBalance(context, context.transaction.senderAddress, tokenIn);

			if (senderTokenInBalance < BigInt(handlerExecutionResult.payload.amountIn)) {
				throw new Error(`Insufficient ${tokenIn.toString('hex')} balance for feeConversion. Minimum required balance is ${handlerExecutionResult.payload.amountIn}.`);
			}

			if (senderTokenInBalance < BigInt(handlerExecutionResult.payload.amountIn) + BigInt(handlerExecutionResult.payload.txAmount)) {
				throw new Error(
					`Insufficient ${tokenIn.toString('hex')} balance to swap ${handlerExecutionResult.payload.txAmount} of tokens with feeConversion. Total minimum required balance is ${(
						BigInt(handlerExecutionResult.payload.amountIn) + BigInt(handlerExecutionResult.payload.txAmount)
					).toString()}.`,
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
			const { path } = verifyResult.payload;
			const dexRouter = await this._dexMethod!.getRouterInstance(context, context.transaction.senderAddress, context.header.timestamp);

			await dexRouter.exactOutput({
				path,
				amountOut: verifyResult.payload.amountOut,
				amountInMaximum: verifyResult.payload.amountIn,
				deadline: context.header.timestamp.toString(),
				recipient: context.transaction.senderAddress,
			});

			const events = this.events.get(FeeConvertedEvent);
			events.add(
				context,
				{
					moduleCommand: `${context.transaction.module}:${context.transaction.command}`,
					path,
					amount: verifyResult.payload.amountIn,
					token: path.subarray(path.length - TOKEN_ID_LENGTH, path.length),
				},
				[context.transaction.senderAddress],
			);
		}
	}

	public checkDependencies() {
		if (!this._handler || !this._dexMethod || !this._feeMethod || !this._tokenMethod) {
			throw new Error('fee_conversion module dependencies is not configured, make sure FeeConversionModule.addDependencies() is called before module registration');
		}
	}

	public async executeHandlers(context: TransactionVerifyContext): Promise<HandlerExecutionResult> {
		this.checkDependencies();

		const configStore = this.stores.get(FeeConversionGovernableConfig);
		const config = await configStore.getConfig(context);

		const key = `${context.transaction.module}:${context.transaction.command}`;

		if (!this._handler!.has(key)) return { status: FeeConversionVerifyStatus.NO_CONVERSION };

		for (const method of this._handler!.get(key)) {
			const { status: handlerStatus, payload: handlerPayload } = await method.verifyFeeConversion(context);
			if (handlerStatus === FeeConversionVerifyStatus.WITH_CONVERSION && handlerPayload) {
				const tokenOut = this._feeMethod!.getFeeTokenID();
				const sender = context.transaction.senderAddress;
				const senderFeeBalance = await this._tokenMethod!.getAvailableBalance(context, sender, tokenOut);
				const feeDifference = senderFeeBalance - context.transaction.fee;

				const amount = (feeDifference * BigInt(-1)).toString();

				const dexQuoter = await this._dexMethod!.getQuoterInstance(context, context.transaction.senderAddress, context.header.timestamp);
				const dexConfig = await this._dexMethod!.getConfig(context);

				let nativeConversionCheck: ConversionCheck | undefined;
				let customConversionCheck: ConversionCheck | undefined;

				for (const feeTickSpaingMap of dexConfig.feeAmountTickSpacing) {
					const { fee } = feeTickSpaingMap;

					if (await this._dexMethod!.poolExists(context, handlerPayload.tokenId, tokenOut, fee)) {
						const path = Buffer.concat([
							tokenOut,
							Buffer.from(
								parseInt(fee, 10)
									.toString(16)
									.padStart(2 * FEE_SIZE, '0'),
								'hex',
							),
							handlerPayload.tokenId,
						]);

						try {
							const { amountIn } = await dexQuoter.quoteExactOutputSingle({
								tokenIn: handlerPayload.tokenId.toString('hex'),
								tokenOut: tokenOut.toString('hex'),
								amount: amount.toString(),
								fee,
								sqrtPriceLimitX96: '0',
							});
							if (!nativeConversionCheck || BigInt(amountIn) < BigInt(nativeConversionCheck.amountIn)) {
								nativeConversionCheck = {
									path,
									amountIn,
								};
							}
						} catch (err) {
							console.warn(`Error while quoting fee conversion with native pool: ${(err as { message: string }).message}`);
							console.warn(`Skipping path: ${path.toString('hex')}`);
						}
					}

					for (const conversionPath of config.conversionPath) {
						const pathTokenIn = Buffer.from(conversionPath.substring(conversionPath.length - TOKEN_ID_LENGTH * 2, conversionPath.length), 'hex');
						if ((await this._dexMethod!.poolExists(context, handlerPayload.tokenId, pathTokenIn, fee)) && (await this._verifyPath(context, conversionPath))) {
							const path = Buffer.concat([
								Buffer.from(conversionPath, 'hex'),
								Buffer.from(
									parseInt(fee, 10)
										.toString(16)
										.padStart(2 * FEE_SIZE, '0'),
									'hex',
								),
								handlerPayload.tokenId,
							]);

							try {
								const { amountIn } = await dexQuoter.quoteExactOutput(path, amount.toString());
								if (!customConversionCheck || BigInt(amountIn) < BigInt(customConversionCheck.amountIn)) {
									customConversionCheck = {
										path,
										amountIn,
									};
								}
							} catch (err) {
								console.warn(`Error while quoting fee conversion with custom pool: ${(err as { message: string }).message}`);
								console.warn(`Skipping path: ${path.toString('hex')}`);
							}
						}
					}
				}

				if (nativeConversionCheck !== undefined) {
					return {
						status: handlerStatus,
						payload: {
							path: nativeConversionCheck.path,
							txAmount: handlerPayload.txAmount,
							amountIn: nativeConversionCheck.amountIn,
							amountOut: amount,
						},
					};
				}

				if (customConversionCheck !== undefined) {
					return {
						status: handlerStatus,
						payload: {
							path: customConversionCheck.path,
							txAmount: handlerPayload.txAmount,
							amountIn: customConversionCheck.amountIn,
							amountOut: amount,
						},
					};
				}
			}
		}

		return { status: FeeConversionVerifyStatus.NO_CONVERSION };
	}

	private async _verifyPath(context: TransactionVerifyContext, _path: string): Promise<boolean> {
		if (!this._handler || !this._dexMethod || !this._feeMethod || !this._tokenMethod) {
			throw new Error('InternalFeeConversionMethod dependencies is not configured properly');
		}

		let path = _path;

		// eslint-disable-next-line no-constant-condition
		while (true) {
			const tokenA = Buffer.from(path.substring(0, TOKEN_ID_LENGTH * 2), 'hex');
			const tokenB = Buffer.from(path.substring(PATH_OFFSET_LENGTH * 2, PATH_MINIMUM_LENGTH * 2), 'hex');
			const fee = Buffer.from(path.substring(TOKEN_ID_LENGTH * 2, PATH_OFFSET_LENGTH * 2), 'hex')
				.readIntBE(0, FEE_SIZE)
				.toString();

			const exist = await this._dexMethod.poolExists(context, tokenA, tokenB, fee);

			if (!exist) return false;

			if (path.length > PATH_MINIMUM_LENGTH * 2) {
				path = path.substring(PATH_MINIMUM_LENGTH * 2, path.length);
				continue;
			}

			break;
		}

		return true;
	}
}
