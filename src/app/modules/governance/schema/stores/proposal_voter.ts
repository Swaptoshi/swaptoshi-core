import { ProposalVoterStoreData, TypedSchema } from '../../types';

export const proposalVoterStoreSchema: TypedSchema<ProposalVoterStoreData> = {
	$id: '/governance/store/proposal_voter',
	type: 'object',
	required: ['voters'],
	properties: {
		voters: {
			type: 'array',
			fieldNumber: 1,
			items: {
				dataType: 'bytes',
			},
		},
	},
};
