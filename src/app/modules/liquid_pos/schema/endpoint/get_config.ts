import { configSchema } from '../config';

export const getConfigEndpointResponseSchema = configSchema;

export const getConfigEndpointRequestSchema = {
	$id: '/liquidPos/endpoint/request/get_config',
	type: 'object',
	required: [],
	properties: {},
};
