import { NamedRegistry, FeeMethod, TokenMethod, TransactionVerifyContext, codec } from 'lisk-sdk';
import { isSwapByTransfer } from '../swapByTransfer/isSwapByTransfer';
import {
	ICOExactInputParams,
	ICOExactInputSingleParams,
	ICOExactOutputParams,
	ICOExactOutputSingleParams,
	TokenFactoryModuleConfig,
} from '../../types';
import { DexMethod } from '../../../dex/method';
import { immutableTransactionHookFactoryContext } from '../../stores/context';
import { ICOStore } from '../../stores/ico';
import {
	icoExactInputCommandSchema,
	icoExactInputSingleCommandSchema,
	icoExactOutputCommandSchema,
	icoExactOutputSingleCommandSchema,
} from '../../schema';
import { TOKEN_ID_LENGTH } from '../../constants';

const FEE_CONVERSION_SUPPORTED_COMMANDS = [
	'icoExactInput',
	'icoExactInputSingle',
	'icoExactOutput',
	'icoExactOutputSingle',
];

export async function isFeeConversion(
	this: {
		name: string;
		stores: NamedRegistry;
		events: NamedRegistry;
		_feeMethod: FeeMethod | undefined;
		_tokenMethod: TokenMethod | undefined;
		_dexMethod: DexMethod | undefined;
		_config: TokenFactoryModuleConfig | undefined;
	},
	context: TransactionVerifyContext,
) {
	if (!this._config || !this._tokenMethod || !this._feeMethod || !this._dexMethod)
		return { status: false, payload: undefined };

	const swapTransferCheck = await isSwapByTransfer.bind(this)(context);
	if (swapTransferCheck.status && swapTransferCheck.payload) {
		const tokenOut = this._feeMethod.getFeeTokenID();
		const sender = context.transaction.senderAddress;
		const senderFeeBalance = await this._tokenMethod.getAvailableBalance(context, sender, tokenOut);
		const feeDifference = senderFeeBalance - context.transaction.fee;

		if (feeDifference < BigInt(0)) {
			let availableFee: string | undefined;
			const amount = (feeDifference * BigInt(-1)).toString();

			const dexQuoter = await this._dexMethod.getQuoter(
				context,
				context.transaction.senderAddress,
				context.header.timestamp,
			);

			const dexConfig = await this._dexMethod.getConfig();

			for (const feeTickSpaingMap of dexConfig.feeAmountTickSpacing) {
				const [fee] = feeTickSpaingMap;
				if (
					await this._dexMethod.poolExists(
						context,
						swapTransferCheck.payload.tokenID,
						tokenOut,
						fee,
					)
				) {
					availableFee = fee;
					break;
				}
			}

			if (availableFee !== undefined) {
				const { amountIn } = await dexQuoter.quoteExactOutputSingle({
					tokenIn: swapTransferCheck.payload.tokenID.toString('hex'),
					tokenOut: tokenOut.toString('hex'),
					amount,
					fee: availableFee,
					sqrtPriceLimitX96: '0',
				});
				return {
					status: true,
					payload: {
						tokenIn: swapTransferCheck.payload.tokenID,
						tokenOut,
						fee: availableFee,
						swapAmount: swapTransferCheck.payload.amount,
						amountIn,
						amountOut: amount,
					},
				};
			}
		}
	}

	if (
		this._config.icoFeeConversionEnabled &&
		context.transaction.module === this.name &&
		FEE_CONVERSION_SUPPORTED_COMMANDS.includes(context.transaction.command)
	) {
		const tokenOut = this._feeMethod.getFeeTokenID();
		const sender = context.transaction.senderAddress;
		const senderFeeBalance = await this._tokenMethod.getAvailableBalance(context, sender, tokenOut);
		const feeDifference = senderFeeBalance - context.transaction.fee;

		const ctx = immutableTransactionHookFactoryContext(context);
		const quoter = await this.stores.get(ICOStore).getImmutableICOQuoter(ctx);

		if (feeDifference < BigInt(0)) {
			let tokenIn = Buffer.alloc(0);
			let swapAmount = BigInt(0);
			let params:
				| ICOExactInputParams
				| ICOExactOutputParams
				| ICOExactInputSingleParams
				| ICOExactOutputSingleParams;
			switch (context.transaction.command) {
				case 'icoExactInput':
					params = codec.decode<ICOExactInputParams>(
						icoExactInputCommandSchema,
						context.transaction.params,
					);
					tokenIn = params.path.subarray(0, TOKEN_ID_LENGTH);
					swapAmount = params.amountIn;
					break;
				case 'icoExactOutput':
					params = codec.decode<ICOExactOutputParams>(
						icoExactOutputCommandSchema,
						context.transaction.params,
					);
					tokenIn = params.path.subarray(params.path.length - TOKEN_ID_LENGTH, params.path.length);
					swapAmount = await quoter.quoteExactOutput(params);
					break;
				case 'icoExactInputSingle':
					params = codec.decode<ICOExactInputSingleParams>(
						icoExactInputSingleCommandSchema,
						context.transaction.params,
					);
					tokenIn = params.tokenIn;
					swapAmount = params.amountIn;
					break;
				case 'icoExactOutputSingle':
					params = codec.decode<ICOExactOutputSingleParams>(
						icoExactOutputSingleCommandSchema,
						context.transaction.params,
					);
					tokenIn = params.tokenIn;
					swapAmount = await quoter.quoteExactOutputSingle(params);
					break;
				default:
					break;
			}

			const dexConfig = await this._dexMethod.getConfig();

			for (const feeTickSpaingMap of dexConfig.feeAmountTickSpacing) {
				const [fee] = feeTickSpaingMap;

				if (await this._dexMethod.poolExists(context, tokenIn, tokenOut, fee)) {
					const amount = (feeDifference * BigInt(-1)).toString();

					const dexQuoter = await this._dexMethod.getQuoter(
						context,
						context.transaction.senderAddress,
						context.header.timestamp,
					);
					const { amountIn } = await dexQuoter.quoteExactOutputSingle({
						tokenIn: tokenIn.toString('hex'),
						tokenOut: tokenOut.toString('hex'),
						amount: amount.toString(),
						fee,
						sqrtPriceLimitX96: '0',
					});
					return {
						status: true,
						payload: {
							tokenIn,
							tokenOut,
							fee,
							swapAmount,
							amountIn,
							amountOut: amount,
						},
					};
				}
			}
		}
	}
	return {
		status: false,
		payload: undefined,
	};
}
