import { DelegatedVoteStoreData, TypedSchema } from '../../types';

export const delegatedVoteStoreSchema: TypedSchema<DelegatedVoteStoreData> = {
	$id: '/governance/store/delegated_vote',
	type: 'object',
	required: ['outgoingDelegation', 'incomingDelegation'],
	properties: {
		outgoingDelegation: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		incomingDelegation: {
			type: 'array',
			fieldNumber: 2,
			items: {
				dataType: 'bytes',
			},
		},
	},
};
