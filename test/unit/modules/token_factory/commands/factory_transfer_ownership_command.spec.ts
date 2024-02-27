import { FactoryTransferOwnershipCommand } from '../../../../../src/app/modules/token_factory/commands/factory_transfer_ownership_command';
import { TokenFactoryModule } from '../../../../../src/app/modules/token_factory/module';

describe('FactoryTransferOwnershipCommand', () => {
	let module: TokenFactoryModule;
	let command: FactoryTransferOwnershipCommand;

	beforeEach(() => {
		module = new TokenFactoryModule();
		command = new FactoryTransferOwnershipCommand(module.stores, module.events);
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(command.name).toBe('factoryTransferOwnership');
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
