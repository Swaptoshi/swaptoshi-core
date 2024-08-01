import { configSchema } from '../config';

export const getConfigEndpointResponseSchema = configSchema;

export const getConfigEndpointRequestSchema = {
	$id: '/tokenFactory/endpoint/request/getConfig',
	type: 'object',
	required: [],
	properties: {},
};
