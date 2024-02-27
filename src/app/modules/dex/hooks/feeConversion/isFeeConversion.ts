import { NamedRegistry, FeeMethod, TokenMethod, TransactionVerifyContext, codec } from 'lisk-sdk';
import { exactInputCommandSchema } from '../../schema/commands/exact_input_command';
import { exactInputSingleCommandSchema } from '../../schema/commands/exact_input_single_command';
import { exactOutputCommandSchema } from '../../schema/commands/exact_output_command';
import { exactOutputSingleCommandSchema } from '../../schema/commands/exact_output_single_command';
import { immutableHookSwapContext } from '../../stores/context';
import { Quoter } from '../../stores/library/lens';
import { Path, PoolAddress } from '../../stores/library/periphery';
import { PoolStore } from '../../stores/pool';
import {
	DexModuleConfig,
	ExactInputParams,
	ExactOutputParams,
	ExactInputSingleParams,
	ExactOutputSingleParams,
} from '../../types';
import { isSwapByTransfer } from '../swapByTransfer/isSwapByTransfer';

const FEE_CONVERSION_SUPPORTED_COMMANDS = [
	'exactInput',
	'exactInputSingle',
	'exactOutput',
	'exactOutputSingle',
];

export async function isFeeConversion(
	this: {
		name: string;
		stores: NamedRegistry;
		events: NamedRegistry;
		_feeMethod: FeeMethod | undefined;
		_tokenMethod: TokenMethod | undefined;
		_config: DexModuleConfig | undefined;
	},
	context: TransactionVerifyContext,
) {
	if (!this._config || !this._tokenMethod || !this._feeMethod)
		return { status: false, payload: undefined };

	const swapTransferCheck = await isSwapByTransfer.bind(this)(context);
	if (swapTransferCheck.status && swapTransferCheck.payload) {
		const tokenOut = this._feeMethod.getFeeTokenID();
		const sender = context.transaction.senderAddress;
		const senderFeeBalance = await this._tokenMethod.getAvailableBalance(context, sender, tokenOut);
		const feeDifference = senderFeeBalance - context.transaction.fee;

		if (feeDifference < BigInt(0)) {
			const ctx = immutableHookSwapContext(context);
			const quoter = new Quoter(ctx, this.stores);

			const { fee } = PoolAddress.decodePoolAddress(swapTransferCheck.payload.recipientAddress);
			const amount = (feeDifference * BigInt(-1)).toString();
			const { amountIn } = await quoter.quoteExactOutputSingle({
				tokenIn: swapTransferCheck.payload.tokenID.toString('hex'),
				tokenOut: tokenOut.toString('hex'),
				amount,
				fee,
				sqrtPriceLimitX96: '0',
			});
			return {
				status: true,
				payload: {
					tokenIn: swapTransferCheck.payload.tokenID,
					tokenOut,
					fee,
					swapAmount: swapTransferCheck.payload.amount,
					amountIn,
					amountOut: amount,
				},
			};
		}
	}

	if (
		this._config.feeConversionEnabled &&
		context.transaction.module === this.name &&
		FEE_CONVERSION_SUPPORTED_COMMANDS.includes(context.transaction.command)
	) {
		const tokenOut = this._feeMethod.getFeeTokenID();
		const sender = context.transaction.senderAddress;
		const senderFeeBalance = await this._tokenMethod.getAvailableBalance(context, sender, tokenOut);
		const feeDifference = senderFeeBalance - context.transaction.fee;

		const ctx = immutableHookSwapContext(context);
		const poolStore = this.stores.get(PoolStore);
		const quoter = new Quoter(ctx, this.stores);

		if (feeDifference < BigInt(0)) {
			let tokenIn = Buffer.alloc(0);
			let swapAmount = '0';
			let params:
				| ExactInputParams
				| ExactOutputParams
				| ExactInputSingleParams
				| ExactOutputSingleParams;
			switch (context.transaction.command) {
				case 'exactInput':
					params = codec.decode<ExactInputParams>(
						exactInputCommandSchema,
						context.transaction.params,
					);
					[tokenIn] = Path.decodeFirstPool(Path.getFirstPool(params.path));
					swapAmount = params.amountIn;
					break;
				case 'exactOutput':
					params = codec.decode<ExactOutputParams>(
						exactOutputCommandSchema,
						context.transaction.params,
					);
					[, tokenIn] = Path.decodeFirstPool(Path.getLastPool(params.path));
					({ amountIn: swapAmount } = await quoter.quoteExactOutput(params.path, params.amountOut));
					break;
				case 'exactInputSingle':
					params = codec.decode<ExactInputSingleParams>(
						exactInputSingleCommandSchema,
						context.transaction.params,
					);
					tokenIn = params.tokenIn;
					swapAmount = params.amountIn;
					break;
				case 'exactOutputSingle':
					params = codec.decode<ExactOutputSingleParams>(
						exactOutputSingleCommandSchema,
						context.transaction.params,
					);
					tokenIn = params.tokenIn;
					({ amountIn: swapAmount } = await quoter.quoteExactOutputSingle({
						...params,
						tokenIn: params.tokenIn.toString('hex'),
						tokenOut: params.tokenOut.toString('hex'),
						amount: params.amountOut,
					}));
					break;
				default:
					break;
			}

			for (const feeTickSpaingMap of this._config.feeAmountTickSpacing) {
				const [fee] = feeTickSpaingMap;
				const poolAddress = PoolAddress.computeAddress(
					PoolAddress.getPoolKey(tokenIn, tokenOut, fee),
				);
				if (await poolStore.has(context, poolAddress)) {
					const amount = (feeDifference * BigInt(-1)).toString();
					const { amountIn } = await quoter.quoteExactOutputSingle({
						tokenIn: tokenIn.toString('hex'),
						tokenOut: tokenOut.toString('hex'),
						amount,
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
