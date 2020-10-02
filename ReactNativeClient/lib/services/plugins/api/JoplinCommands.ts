import { State } from 'lib/reducer';
import CommandService, { CommandDeclaration, CommandRuntime } from 'lib/services/CommandService';

interface Command {
	name: string
	label: string
	iconName?: string,
	execute(props:any):void
	isEnabled?(props:any):boolean
	mapStateToProps?(state:State):any
}

export default class JoplinCommands {

	/**
	 * <span class="platform-desktop">desktop</span> Executes the given command.
	 */
	async execute(commandName: string, args: any) {
		CommandService.instance().execute(commandName, args);
	}

	/**
	 * <span class="platform-desktop">desktop</span> Registers the given command.
	 */
	async register(command:Command) {
		const declaration:CommandDeclaration = {
			name: command.name,
			label: command.label,
			iconName: command.iconName,
		};

		const runtime:CommandRuntime = {
			execute: command.execute,
			isEnabled: command.isEnabled,
			mapStateToProps: command.mapStateToProps,
		};

		CommandService.instance().registerDeclaration(declaration);
		CommandService.instance().registerRuntime(declaration.name, runtime);
	}

}
