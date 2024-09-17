/* eslint-disable import/no-cycle */
import { StateMachine, codec } from 'klayr-sdk';
import { BaseFeeConversionMethod, FeeConversionVerificationResult, FeeConversionVerifyStatus } from '../../fee_conversion';
import { immutableMethodSwapContext } from '../stores/context';
import { Quoter } from '../stores/library/lens';
import { ExactInputParams, ExactInputSingleParams, ExactOutputParams, ExactOutputSingleParams } from '../types';
import { Path } from '../stores/library/periphery';
import { exactInputCommandSchema, exactOutputCommandSchema, exactInputSingleCommandSchema, exactOutputSingleCommandSchema } from '../schema';

export class DexSwapFeeConversionMethod extends BaseFeeConversionMethod {
	public async verifyFeeConversion(context: StateMachine.TransactionVerifyContext): Promise<FeeConversionVerificationResult> {
		const senderFeeBalance = await this.tokenMethod.getAvailableBalance(context, context.transaction.senderAddress, this.feeMethod.getFeeTokenID());
		const feeDifference = senderFeeBalance - context.transaction.fee;

		if (feeDifference < BigInt(0)) {
			let tokenIn = Buffer.alloc(0);
			let txAmount = '0';
			let params: ExactInputParams | ExactOutputParams | ExactInputSingleParams | ExactOutputSingleParams;

			const ctx = immutableMethodSwapContext(context, context.transaction.senderAddress, context.header.timestamp);
			const quoter = new Quoter(ctx, this.stores);

			switch (context.transaction.command) {
				case 'exactInput':
					params = codec.decode<ExactInputParams>(exactInputCommandSchema, context.transaction.params);
					[tokenIn] = Path.decodeFirstPool(Path.getFirstPool(params.path));
					txAmount = params.amountIn;
					break;
				case 'exactOutput':
					params = codec.decode<ExactOutputParams>(exactOutputCommandSchema, context.transaction.params);
					[, tokenIn] = Path.decodeFirstPool(Path.getLastPool(params.path));
					({ amountIn: txAmount } = await quoter.quoteExactOutput(params.path, params.amountOut));
					break;
				case 'exactInputSingle':
					params = codec.decode<ExactInputSingleParams>(exactInputSingleCommandSchema, context.transaction.params);
					tokenIn = params.tokenIn;
					txAmount = params.amountIn;
					break;
				case 'exactOutputSingle':
					params = codec.decode<ExactOutputSingleParams>(exactOutputSingleCommandSchema, context.transaction.params);
					tokenIn = params.tokenIn;
					({ amountIn: txAmount } = await quoter.quoteExactOutputSingle({
						...params,
						tokenIn: params.tokenIn.toString('hex'),
						tokenOut: params.tokenOut.toString('hex'),
						amount: params.amountOut,
					}));
					break;
				default:
					break;
			}

			return { status: FeeConversionVerifyStatus.WITH_CONVERSION, payload: { tokenId: tokenIn, txAmount: BigInt(txAmount) } };
		}
		return { status: FeeConversionVerifyStatus.NO_CONVERSION };
	}
}
