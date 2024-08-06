import { ProposalCreatedEventData, TypedSchema } from '../../types';

export const proposalCreatedEventSchema: TypedSchema<ProposalCreatedEventData> = {
	$id: '/governance/events/proposal_created',
	type: 'object',
	required: ['proposalId', 'author'],
	properties: {
		proposalId: {
			dataType: 'uint32',
			fieldNumber: 1,
		},
		author: {
			dataType: 'bytes',
			fieldNumber: 2,
		},
	},
};
