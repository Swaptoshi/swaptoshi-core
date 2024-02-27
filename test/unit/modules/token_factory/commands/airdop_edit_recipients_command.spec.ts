import { AirdopEditRecipientsCommand } from '../../../../../src/app/modules/token_factory/commands/airdop_edit_recipients_command';
import { TokenFactoryModule } from '../../../../../src/app/modules/token_factory/module';

describe('AirdopEditRecipientsCommand', () => {
	let module: TokenFactoryModule;
	let command: AirdopEditRecipientsCommand;

	beforeEach(() => {
		module = new TokenFactoryModule();
		command = new AirdopEditRecipientsCommand(module.stores, module.events);
	});

	describe('constructor', () => {
		it('should have valid name', () => {
			expect(command.name).toBe('airdopEditRecipients');
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
