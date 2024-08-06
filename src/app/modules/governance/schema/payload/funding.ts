import { FundingActionPayload, TypedSchema } from '../../types';

export const fundingActionPayloadSchema: TypedSchema<FundingActionPayload> = {
	$id: '/governance/action/funding',
	type: 'object',
	required: ['tokenId', 'receivingAddress', 'fundingAmount'],
	properties: {
		tokenId: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		receivingAddress: {
			dataType: 'bytes',
			fieldNumber: 2,
		},
		fundingAmount: {
			dataType: 'uint64',
			fieldNumber: 3,
		},
	},
};
