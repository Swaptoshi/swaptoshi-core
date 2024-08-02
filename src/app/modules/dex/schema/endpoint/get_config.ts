/* eslint-disable import/no-cycle */
import { configSchema } from '../config';

export const getConfigEndpointResponseSchema = configSchema;

export const getConfigEndpointRequestSchema = {
	$id: '/dex/endpoint/request/get_config',
	type: 'object',
	required: [],
	properties: {},
};
