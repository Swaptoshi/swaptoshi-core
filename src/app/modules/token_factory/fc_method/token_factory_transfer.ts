/* eslint-disable import/no-cycle */
import { TransactionVerifyContext } from 'klayr-sdk';
import { BaseFeeConversionMethod, FeeConversionVerificationResult, FeeConversionVerifyStatus } from '../../fee_conversion';
import { isSwapByTransfer } from '../hooks';

export class TokenFactoryTransferFeeConversionMethod extends BaseFeeConversionMethod {
	public async verifyFeeConversion(context: TransactionVerifyContext): Promise<FeeConversionVerificationResult> {
		const swapTransferCheck = await isSwapByTransfer.bind(this)(context, context.transaction);

		if (swapTransferCheck.status && swapTransferCheck.payload) {
			const senderFeeBalance = await this.tokenMethod.getAvailableBalance(context, context.transaction.senderAddress, this.feeMethod.getFeeTokenID());
			const feeDifference = senderFeeBalance - context.transaction.fee;

			if (feeDifference < BigInt(0)) {
				return {
					status: FeeConversionVerifyStatus.WITH_CONVERSION,
					payload: {
						tokenId: swapTransferCheck.payload.tokenID,
						txAmount: swapTransferCheck.payload.amount,
					},
				};
			}
		}

		return { status: FeeConversionVerifyStatus.NO_CONVERSION };
	}
}
