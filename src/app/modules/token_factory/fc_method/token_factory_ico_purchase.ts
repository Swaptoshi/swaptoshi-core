/* eslint-disable import/no-cycle */
import { TransactionVerifyContext, codec } from 'klayr-sdk';
import { BaseFeeConversionMethod, FeeConversionVerificationResult, FeeConversionVerifyStatus } from '../../fee_conversion';
import { immutableMethodFactoryContext } from '../stores/context';
import { ICOStore } from '../stores/ico';
import { ICOExactInputParams, ICOExactInputSingleParams, ICOExactOutputParams, ICOExactOutputSingleParams } from '../types';
import { icoExactInputCommandSchema, icoExactInputSingleCommandSchema, icoExactOutputCommandSchema, icoExactOutputSingleCommandSchema } from '../schema';
import { TOKEN_ID_LENGTH } from '../constants';

export class TokenFactoryICOPurchaseFeeConversionMethod extends BaseFeeConversionMethod {
	public async verifyFeeConversion(context: TransactionVerifyContext): Promise<FeeConversionVerificationResult> {
		const senderFeeBalance = await this.tokenMethod.getAvailableBalance(context, context.transaction.senderAddress, this.feeMethod.getFeeTokenID());
		const feeDifference = senderFeeBalance - context.transaction.fee;

		const ctx = immutableMethodFactoryContext(context, context.transaction.senderAddress, context.header.timestamp, context.header.height);
		const quoter = await this.stores.get(ICOStore).getImmutableICOQuoter(ctx);

		if (feeDifference < BigInt(0)) {
			let tokenIn = Buffer.alloc(0);
			let txAmount = BigInt(0);
			let params: ICOExactInputParams | ICOExactOutputParams | ICOExactInputSingleParams | ICOExactOutputSingleParams;
			switch (context.transaction.command) {
				case 'icoExactInput':
					params = codec.decode<ICOExactInputParams>(icoExactInputCommandSchema, context.transaction.params);
					tokenIn = params.path.subarray(0, TOKEN_ID_LENGTH);
					txAmount = params.amountIn;
					break;
				case 'icoExactOutput':
					params = codec.decode<ICOExactOutputParams>(icoExactOutputCommandSchema, context.transaction.params);
					tokenIn = params.path.subarray(params.path.length - TOKEN_ID_LENGTH, params.path.length);
					txAmount = await quoter.quoteExactOutput(params);
					break;
				case 'icoExactInputSingle':
					params = codec.decode<ICOExactInputSingleParams>(icoExactInputSingleCommandSchema, context.transaction.params);
					tokenIn = params.tokenIn;
					txAmount = params.amountIn;
					break;
				case 'icoExactOutputSingle':
					params = codec.decode<ICOExactOutputSingleParams>(icoExactOutputSingleCommandSchema, context.transaction.params);
					tokenIn = params.tokenIn;
					txAmount = await quoter.quoteExactOutputSingle(params);
					break;
				default:
					break;
			}

			return { status: FeeConversionVerifyStatus.WITH_CONVERSION, payload: { tokenId: tokenIn, txAmount: BigInt(txAmount) } };
		}

		return { status: FeeConversionVerifyStatus.NO_CONVERSION };
	}
}
