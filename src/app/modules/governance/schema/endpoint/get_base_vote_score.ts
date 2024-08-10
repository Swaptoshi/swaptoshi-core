import { JSONObject } from 'klayr-sdk';
import { GetBaseVoteScoreParams, TypedSchema, VoteScoreStoreData } from '../../types';

export const getBaseVoteScoreEndpointResponseSchema: TypedSchema<JSONObject<VoteScoreStoreData>> = {
	$id: '/governance/endpoint/response/getBaseVoteScore',
	type: 'object',
	required: ['score'],
	properties: {
		score: {
			dataType: 'string',
			fieldNumber: 1,
		},
	},
};

export const getBaseVoteScoreEndpointRequestSchema: TypedSchema<GetBaseVoteScoreParams> = {
	$id: '/governance/endpoint/request/getBaseVoteScore',
	type: 'object',
	required: ['address'],
	properties: {
		address: {
			dataType: 'string',
			format: 'klayr32',
			fieldNumber: 1,
		},
	},
};
