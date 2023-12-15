import { Application, PartialApplicationConfig } from 'lisk-sdk';
import { registerModules } from './modules';
import { registerPlugins } from './plugins';

export const getApplication = (config: PartialApplicationConfig): Application => {
	const { app, method } = Application.defaultApplication(config);

	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
	registerModules(app, method as any);
	registerPlugins(app);

	return app;
};
