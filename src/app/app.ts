import { Application, PartialApplicationConfig } from 'klayr-sdk';
import { registerModules } from './modules';
import { registerPlugins } from './plugins';

export const getApplication = (config: PartialApplicationConfig): Application => {
	const { app, method } = Application.defaultApplication(config);

	registerModules(app, method);
	registerPlugins(app);

	return app;
};
