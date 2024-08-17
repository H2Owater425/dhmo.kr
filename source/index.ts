import { ShellCommand } from './command';
import { ShellError } from './error';
import { Shell } from './shell';

const output: HTMLElement | null = document.getElementById('output');
const input: HTMLElement | null = document.getElementById('input');
const overlay: HTMLInputElement | null = document.getElementById('overlay') as HTMLInputElement | null;

if(output !== null && input !== null && overlay !== null) {
	const shell: Shell = new Shell(output, input, overlay, 'root');

	shell.register('clear', new ShellCommand(function (this: Shell, _arguments: string[]): void {
		if(_arguments['length'] === 1) {
			this.clear();

			return;
		} else {
			throw new ShellError(['Usage: clear']);
		}
	}, 'clear', ['    Clears screen if this is possible, including its scrollback',
	'    buffer.']));

	shell.register('whoami', new ShellCommand(function (this: Shell, _arguments: string[]): void {
		if(_arguments['length'] === 1) {
			this.puts(this.getenv('USER') as string);

			return;
		} else {
			throw new ShellError(['Usage: whoami']);
		}
	}, 'whoami', ['   Print the user name associated with the current effective user ID.']));
}
