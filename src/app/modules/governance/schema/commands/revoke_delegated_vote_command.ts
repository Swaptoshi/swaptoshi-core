import { RevokeDelegatedVoteParams, TypedSchema } from '../../types';

export const revokeDelegatedVoteCommandSchema: TypedSchema<RevokeDelegatedVoteParams> = {
	$id: '/governance/command/revoke_delegated_vote',
	type: 'object',
	required: [],
	properties: {},
};
