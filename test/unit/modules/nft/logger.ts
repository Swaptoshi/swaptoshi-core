/* eslint-disable import/no-extraneous-dependencies */
import { createLogger } from 'klayr-framework/dist-node/logger';

export const fakeLogger = createLogger({
	logLevel: 'none',
	name: 'test',
});
