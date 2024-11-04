import { VoteParams, TypedSchema } from '../../types';

export const voteCommandSchema: TypedSchema<VoteParams> = {
	$id: '/governance/command/vote',
	type: 'object',
	required: ['proposalId', 'decision', 'data'],
	properties: {
		proposalId: {
			dataType: 'uint32',
			fieldNumber: 1,
		},
		decision: {
			dataType: 'uint32',
			fieldNumber: 2,
		},
		data: {
			dataType: 'string',
			fieldNumber: 3,
		},
	},
};
