export interface ConfigUpdatedEventData {
	module: string;
	path: string;
	old: string;
	new: string;
	type: string;
}
