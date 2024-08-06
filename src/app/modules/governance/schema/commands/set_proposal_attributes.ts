import { SetProposalAttributesParams, TypedSchema } from '../../types';

export const setProposalAttributesCommandSchema: TypedSchema<SetProposalAttributesParams> = {
	$id: '/governance/command/set_proposal_attributes',
	type: 'object',
	required: ['proposalId', 'key', 'data'],
	properties: {
		proposalId: {
			dataType: 'uint32',
			fieldNumber: 1,
		},
		key: {
			dataType: 'string',
			fieldNumber: 2,
		},
		data: {
			dataType: 'bytes',
			fieldNumber: 3,
		},
	},
};
