export interface GovernableConfigStoreData {
	data: Buffer;
}

export interface GovernableConfigVerifyContext<T extends object> {
	config: T;
}
