import { CastedVoteStoreData, TypedSchema } from '../../types';

export const castedVoteStoreSchema: TypedSchema<CastedVoteStoreData> = {
	$id: '/governance/store/casted_vote',
	type: 'object',
	required: ['activeVote'],
	properties: {
		activeVote: {
			type: 'array',
			fieldNumber: 1,
			items: {
				type: 'object',
				required: ['proposalId', 'decision'],
				properties: {
					proposalId: {
						dataType: 'uint32',
						fieldNumber: 1,
					},
					decision: {
						dataType: 'uint32',
						fieldNumber: 3,
					},
				},
			},
		},
	},
};
