/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/member-ordering */
import { BaseMethod, FeeMethod, ModuleInitArgs, TokenMethod, TransactionExecuteContext, TransactionVerifyContext } from 'klayr-sdk';
import { FeeConversionModuleConfig, FeeConversionPayload, FeeConversionVerifyStatus } from './types';
import { FeeConversionMethodRegistry } from './registry';
import { DexMethod } from '../dex/method';
import { FeeConvertedEvent } from './events/fee_converted';
import { PATH_MINIMUM_LENGTH, PATH_OFFSET_LENGTH, TOKEN_ID_LENGTH } from './constants';
import { FEE_SIZE } from '../token_factory/stores/library';

interface HandlerExecutionResult {
	status: FeeConversionVerifyStatus;
	payload?: FeeConversionPayload;
}

export class InternalFeeConversionMethod extends BaseMethod {
	private _config: FeeConversionModuleConfig | undefined;
	private _handler: FeeConversionMethodRegistry | undefined;
	private _dexMethod: DexMethod | undefined;
	private _feeMethod: FeeMethod | undefined;
	private _tokenMethod: TokenMethod | undefined;

	public async init(handler: FeeConversionMethodRegistry, args: ModuleInitArgs, config: FeeConversionModuleConfig) {
		this._handler = handler;
		this._config = config;
		await this._verifyConfig(args.genesisConfig);
	}

	public addDependencies(feeMethod: FeeMethod, tokenMethod: TokenMethod, dexMethod: DexMethod) {
		this._feeMethod = feeMethod;
		this._tokenMethod = tokenMethod;
		this._dexMethod = dexMethod;
	}

	public async verify(context: TransactionVerifyContext) {
		const handlerExecutionResult = await this._executeHandlers(context);

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
			const dexRouter = await this._dexMethod!.getRouter(context, context.transaction.senderAddress, context.header.timestamp);

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

	private async _executeHandlers(context: TransactionVerifyContext): Promise<HandlerExecutionResult> {
		if (!this._handler || !this._dexMethod || !this._feeMethod || !this._tokenMethod || !this._config) {
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
								path: Buffer.concat([
									tokenOut,
									Buffer.from(
										parseInt(fee, 10)
											.toString(16)
											.padStart(2 * FEE_SIZE, '0'),
										'hex',
									),
									handlerPayload.tokenId,
								]),
								txAmount: handlerPayload.txAmount,
								amountIn,
								amountOut: amount,
							},
						};
					}

					for (const conversionPath of this._config.conversionPath) {
						const pathTokenIn = Buffer.from(conversionPath.substring(conversionPath.length - TOKEN_ID_LENGTH * 2, conversionPath.length), 'hex');
						if ((await this._dexMethod.poolExists(context, handlerPayload.tokenId, pathTokenIn, fee)) && (await this._verifyPath(context, conversionPath))) {
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
							const { amountIn } = await dexQuoter.quoteExactOutput(path, amount.toString());
							return {
								status: handlerStatus,
								payload: {
									path,
									txAmount: handlerPayload.txAmount,
									amountIn,
									amountOut: amount,
								},
							};
						}
					}
				}
			}
		}

		return { status: FeeConversionVerifyStatus.NO_CONVERSION };
	}

	private async _verifyPath(context: TransactionVerifyContext, _path: string): Promise<boolean> {
		if (!this._handler || !this._dexMethod || !this._feeMethod || !this._tokenMethod || !this._config) {
			throw new Error('InternalFeeConversionMethod dependencies is not configured properly');
		}

		let path = _path;

		// eslint-disable-next-line no-constant-condition
		while (true) {
			const tokenA = Buffer.from(path.substring(0, TOKEN_ID_LENGTH * 2), 'hex');
			const fee = path.substring(TOKEN_ID_LENGTH * 2, FEE_SIZE * 2);
			const tokenB = Buffer.from(path.substring(PATH_OFFSET_LENGTH * 2, TOKEN_ID_LENGTH * 2), 'hex');

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

	// eslint-disable-next-line @typescript-eslint/require-await
	private async _verifyConfig(genesisConfig: ModuleInitArgs['genesisConfig']) {
		const { chainID } = genesisConfig;

		for (const path of this._config!.conversionPath) {
			const tokenOut = path.substring(0, TOKEN_ID_LENGTH * 2);

			if (tokenOut !== `${chainID}00000000`) {
				throw new Error(`invalid conversion path: ${path}, path needs to starts with native token as tokenOut`);
			}

			if (path.length < PATH_MINIMUM_LENGTH * 2) {
				throw new Error(`invalid conversion path: ${path}, path should have minimum ${PATH_MINIMUM_LENGTH} character`);
			}

			if (path.length > PATH_MINIMUM_LENGTH * 2 && (path.length - PATH_MINIMUM_LENGTH * 2) % (PATH_OFFSET_LENGTH * 2) !== 0) {
				throw new Error(`invalid conversion path: ${path}, path should have valid offset of ${PATH_OFFSET_LENGTH} character`);
			}
		}
	}
}
