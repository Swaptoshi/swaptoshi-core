import { BoostVoteParams, TypedSchema } from '../../types';

export const boostVoteCommandSchema: TypedSchema<BoostVoteParams> = {
	$id: '/governance/command/boost_vote',
	type: 'object',
	required: ['targetHeight'],
	properties: {
		targetHeight: {
			dataType: 'uint32',
			fieldNumber: 1,
		},
	},
};
