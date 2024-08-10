import { TypedSchema, VoteScoreStoreData } from '../../types';

export const voteScoreStoreSchema: TypedSchema<VoteScoreStoreData> = {
	$id: '/governance/store/vote_score',
	type: 'object',
	required: ['score'],
	properties: {
		score: {
			dataType: 'uint64',
			fieldNumber: 1,
		},
	},
};
