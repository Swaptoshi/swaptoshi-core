import { ProposalVotedEventData, TypedSchema } from '../../types';

export const proposalVotedEventSchema: TypedSchema<ProposalVotedEventData> = {
	$id: '/governance/events/proposal_voted',
	type: 'object',
	required: ['proposalId', 'voterAddress', 'decision'],
	properties: {
		proposalId: {
			dataType: 'uint32',
			fieldNumber: 1,
		},
		voterAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 2,
		},
		decision: {
			dataType: 'uint32',
			fieldNumber: 3,
		},
	},
};
