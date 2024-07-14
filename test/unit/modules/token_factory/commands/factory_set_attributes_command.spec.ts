/* eslint-disable */
import { FactorySetAttributesCommand } from '../../../../../src/app/modules/token_factory/commands/factory_set_attributes_command';
import { TokenFactoryModule } from '../../../../../src/app/modules/token_factory/module';

describe('FactorySetAttributesCommand', () => {
	let module: TokenFactoryModule;
	let command: FactorySetAttributesCommand;

	beforeEach(() => {
		module = new TokenFactoryModule();
		command = new FactorySetAttributesCommand(module.stores, module.events);
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(command.name).toEqual('factorySetAttributes');
		});

		it('should have valid schema', () => {
			expect(command.schema).toMatchSnapshot();
		});
	});

	describe('verify', () => {
		describe('schema validation', () => {
			it.todo('should throw errors for invalid schema');
			it.todo('should be ok for valid schema');
		});
	});

	describe('execute', () => {
		describe('valid cases', () => {
			it.todo('should update the state store');
		});

		describe('invalid cases', () => {
			it.todo('should throw error');
		});
	});
});
