import { StateMachine, Types } from 'klayr-sdk';

export interface ImmutableGovernanceContext<T = unknown> {
	context: ImmutableContext & T;
	senderAddress: Buffer;
	height: number;
}

export interface MutableGovernanceContext<T = unknown> {
	context: MutableContext & T;
	senderAddress: Buffer;
	height: number;
}

export type MutableContext = StateMachine.TransactionExecuteContext | StateMachine.CommandExecuteContext | StateMachine.MethodContext;

export type ImmutableContext = StateMachine.ImmutableMethodContext | StateMachine.TransactionVerifyContext | Types.ModuleEndpointContext;
