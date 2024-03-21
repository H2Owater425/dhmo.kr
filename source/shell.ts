import { ShellCommand } from './command';
import { ShellError } from './error';
import { INode } from './iNode';

export class Shell {
	static #fontWidth = 8;

	#output: HTMLElement;
	#input: HTMLElement;
	#overlay: HTMLInputElement;
	#cursor: HTMLStyleElement;

	#environments: Map<string, string> = new Map<string, string>();
	#commands: Map<string, ShellCommand> = new Map<string, ShellCommand>();
	#spliter: string;

	#workingDirectory: string;

	#root: INode;

	static get fontWidth(): number {
		return Shell.#fontWidth;
	}

	get outputWidth(): number {
		return this.#output['clientWidth'];
	}

	get workingDirectory(): string {
		return this.#workingDirectory;
	}

	static isValidEnvironmentName(name: string): name is string {
		if(typeof(name) === 'string') {
			let charCode: number = name.charCodeAt(0);

			if(charCode >= 65 && charCode <= 90 || charCode === 95 || charCode >= 97 && charCode <= 122) {
				for(let i: number = 1; i < name['length']; i++) {
					charCode = name.charCodeAt(i);

					if(charCode < 48 || charCode > 57 && charCode < 65 || charCode > 90 && charCode !== 95 && charCode < 97 || charCode > 122) {
						return false;
					}
				}

				return true;
			}
		}

		return false;
	}

	static isValidCommandName(name: string): name is string {
		if(typeof(name) === 'string' && name['length'] !== 0) {
			for(let i: number = 0; i < name['length']; i++) {
				const charCode: number = name.charCodeAt(i);

				if(charCode !== 45 && charCode < 48 || charCode > 57 && charCode < 65 || charCode > 90 && charCode !== 95 && charCode < 97 || charCode > 122) {
					return false;
				}
			}

			return true;
		}

		return false;
	}

	static getSortedMap<T>(map: Map<string, T>): Map<string, T> {
		return new Map<string, T>(Array.from(map.entries())
		.sort(function (a: [string, T], b: [string, T]): -1 | 0 | 1 {
			return a[0] === b[0] ? 0 : a[0] > b[0] ? 1 : -1;
		}));
	}

	constructor(output: HTMLElement, input: HTMLElement, overlay: HTMLInputElement, user: string) {
		this.#output = output;
		this.#input = input;
		this.#overlay = overlay;
		this.#cursor = document.createElement('style');

		input.prepend(document.createTextNode(''));
		input.append(document.createTextNode(''));
		document['head'].append(this.#cursor);

		this.#root = new INode('root', 'root', false);

		for(const name of ['bin', 'dev', 'etc', 'lib', 'proc', 'sys', 'sbin', 'tmp', 'usr', 'var', 'root', 'home']) {
			this.#root.mkdir(name, 'root', 'root');
		}

		if(user === 'root') {
			this.#spliter = '#';
			this.#workingDirectory = '/root';
		} else {
			this.#spliter = '$';
			this.#workingDirectory = '/home/user';
		}

		this.#environments.set('HOME', this.#workingDirectory);
		this.#environments.set('PWD', this.#workingDirectory);

		this.#environments.set('USER', user);
		this.#environments.set('HOSTNAME', location['hostname']);
		this.#environments.set('?', '0');

		window.setInterval((function (this: Shell) {
			this.#blink((this.#cursor['textContent'] as string)['length'] !== 0);

			return;
		}).bind(this), 600);

		window.addEventListener('keydown', (function (this: Shell, event: KeyboardEvent): void {
			switch(event['keyCode']) {
				case 13: {
					this.puts(this.#input['textContent'] as string);

					if(((this.#input['lastChild'] as HTMLElement)['textContent'] as string)['length'] !== 0) {
						let textContent: string = ((this.#input['lastChild'] as HTMLElement)['textContent'] as string) + ' ';
						const _arguments: string[] = [];

						let currentIndex: number = 0;
						let nextIndex: number = textContent.indexOf(' ');

						if(textContent[0] === '$') {
							const env: string | undefined = this.#environments.get(textContent.slice(1, nextIndex));

							if(typeof(env) === 'string' && (env[0] === '/' || env[0] === '~' && (env['length'] === 2 || env[1] === '/') || env[0] === '.' && (env[1] === '/' || env[1] === '.' && env[2] === '/') || env['length'] === nextIndex + 1 && env[env['length'] - 2] === '/')) {
								textContent = env + ' ';
							}
						}

						if(textContent[0] === '/' || textContent[0] === '~' && (textContent['length'] === 2 || textContent[1] === '/') || textContent[0] === '.' && (textContent[1] === '/' || textContent[1] === '.' && textContent[2] === '/') || textContent['length'] === nextIndex + 1 && textContent[textContent['length'] - 2] === '/') {
							const path: string = textContent.slice(0, -1);
							const iNode: INode | undefined = this.#root.find(INode.getNormalizedPaths(path, this.#environments.get('PWD') as string));

							this.puts('sh: ' + path + ': ' + (typeof(iNode) !== 'undefined' ? 'is a ' + (iNode['isFile'] ? 'file' : 'directory') : ' No such file or directory'));

							this.#prompt();
						} else {
							while(nextIndex !== -1) {
								if(currentIndex !== nextIndex) {
									if(textContent[currentIndex] === '$' && currentIndex !== nextIndex - 1) {
										const startIndex: number = currentIndex + 1;
										let endIndex: number = textContent[startIndex] !== '?' ? startIndex : startIndex + 1;

										for(; endIndex < nextIndex; endIndex++) {
											const charCode: number = textContent.charCodeAt(endIndex);

											if(charCode < 48 || charCode > 57 && charCode < 65 || charCode > 90 && charCode !== 95 && charCode < 97 || charCode > 122) {
												break;
											}
										}

										if(endIndex !== startIndex) {
											const env: string | undefined = this.#environments.get(textContent.slice(startIndex, endIndex));

											if(typeof(env) !== 'undefined') {
												_arguments.push(env);
											}
										} else {
											_arguments.push(textContent.slice(currentIndex, nextIndex));
										}
									} else {
										_arguments.push(textContent.slice(currentIndex, nextIndex));
									}
								}

								currentIndex = nextIndex + 1;
								nextIndex = textContent.indexOf(' ', currentIndex);
							}

							if(_arguments['length'] !== 0) {
								if(this.#commands.has(_arguments[0])) {
									try {
										Promise.resolve((this.#commands.get(_arguments[0]) as ShellCommand).handler.bind(this)(_arguments))
										.then((function (this: Shell): void {
											this.#environments.set('?', '0');

											this.#prompt();

											return;
										}).bind(this))
										.catch((function (this: Shell, error: unknown): void {
											if(error instanceof ShellError) {
												this.#environments.set('?', String(error['code']));

												this.puts.apply(this, error['message']);
											} else {
												this.#environments.set('?', '1');
											}

											this.#prompt();

											return;
										}).bind(this));
									} catch(error: unknown) {
										if(error instanceof ShellError) {
											this.#environments.set('?', String(error['code']));

											this.puts.apply(this, error['message']);
										} else {
											this.#environments.set('?', '1');
										}

										this.#prompt();
									}
								} else {
									this.puts('sh: ' + _arguments[0] + ': command not found');

									this.#prompt();
								}
							} else {
								this.#prompt();
							}
						}
					} else {
						this.#focus();
					}

					break;
				}

				case 229: {
					if(event['code'] !== 'Backspace') {
						break;
					}
				}

				case 8: {
					if(((this.#input['lastChild'] as HTMLElement)['textContent'] as string)['length'] !== 0) {
						(this.#input['lastChild'] as HTMLElement)['textContent'] = ((this.#input['lastChild'] as HTMLElement)['textContent'] as string).slice(0, -1);
					}

					this.#focus();

					break;
				}
			}

			return;
		}).bind(this));

		overlay.addEventListener('input', (function (this: Shell, event: Event) {
			((this.#input['lastChild'] as HTMLElement)['textContent'] as string) += (event as InputEvent)['data'];
			this.#overlay['value'] = '';

			this.#blink(true);
			this.#focus();

			return;
		}).bind(this));

		window.addEventListener('click', (function (this: Shell) {
			this.#focus();

			return;
		}).bind(this));

		this.#commands.set('cd', new ShellCommand(function (this: Shell, _arguments: string[]): void {
			switch(_arguments['length']) {
				case 1: {
					const home: string | undefined = this.#environments.get('HOME');

					if(typeof(home) !== 'undefined') {
						if(typeof(this.#root.find(INode.getNormalizedPaths(home, '/'))) !== 'undefined') {
							this.#workingDirectory = home;
							this.#environments.set('PWD', home);
						} else {
							throw new ShellError(['sh: ' + home + ': No such file or directory']);
						}
					} else {
						throw new ShellError(['sh: cd: HOME not set']);
					}

					break;
				}

				case 2: {
					const paths: string[] = INode.getNormalizedPaths(_arguments[1], this.#workingDirectory);
					const path: string = '/' + paths.join('/');
					const iNode: INode | undefined = this.#root.find(paths);

					if(typeof(iNode) !== 'undefined') {
						if(!iNode['isFile']) {
							this.#workingDirectory = path;
							this.#environments.set('PWD', path);
						} else {
							throw new ShellError(['sh: ' + _arguments[1] + ': Not a directory']);
						}
					} else {
						throw new ShellError(['sh: ' + _arguments[1] + ': No such file or directory']);
					}

					break;
				}

				default: {
					throw new ShellError(['sh: cd: too many arguments']);
				}
			}

			return;
		}, 'cd [DIR]', ['    Change the shell working directory.',
		'',
		'    Change the current directory to DIR.  The default DIR is the value of the',
		'    HOME shell variable.']));

		this.#commands.set('ls', new ShellCommand(function (this: Shell, _arguments: string[]): void {
			switch(_arguments['length']) {
				case 1: {
					const pwd: string = this.#environments.get('PWD') as string;
					let list: string = '';
					const count: number = Math.trunc(this['outputWidth'] / Shell.#fontWidth);

					for(const iNode of Array.from((this.#root.find(INode.getNormalizedPaths(pwd, pwd)) as INode)['childs']).sort()) {
						if(list['length'] + iNode[0]['length'] + 2 > count) {
							this.puts(list.slice(0, -2));

							list = '';
						}

						list += iNode[0] + '  ';
					}

					if(list['length'] !== 0) {
						this.puts(list.slice(0, -2));
					}

					break;
				}
			}
		//}, 'ls [OPTION]... [DIR]...', ['List information about the FILEs (the current directory by default).',
		}, 'ls [DIR]', ['List information about the FILE (the current directory by default).',
		'Sort entries alphabetically.',
		//'',
		//'Mandatory arguments to long options are mandatory for short options too.',
		//'  -a, --all                  do not ignore entries starting with .',
		//'  -l                         use a long listing format',
		//'  -r, --reverse              reverse order while sorting',
		'',
		'Exit status:',
		' 0  if OK,',
		' 1  if minor problems (e.g., cannot access subdirectory),',
		' 2  if serious trouble (e.g., cannot access command-line argument).']))

		this.#commands.set('help', new ShellCommand(function (this: Shell, _arguments: string[]): void {
			switch(_arguments['length']) {
				case 1: {
					this.puts('These shell commands are defined internally.  Type `help` to see this list.',
					'Type `help name` to find out more about the function `name`.',
					'',
					'A star (*) next to a name means that the command is disabled.');

					const halfCount: number = Math.trunc(this['outputWidth'] / Shell.#fontWidth / 2) - 2;

					let line: string | undefined;

					for(const command of Shell.getSortedMap(this.#commands).values()) {
						if(typeof(line) === 'undefined') {
							line = ' ' + (command['usage']['length'] > halfCount ? command['usage'].slice(0, halfCount - 1) + '>' : command['usage'].padEnd(halfCount, ' '));
						} else {
							this.puts(line + ' ' + (command['usage']['length'] > halfCount ? command['usage'].slice(0, halfCount - 1) + '>' : command['usage']) + ' ');

							line = undefined;
						}
					}


					break;
				}

				case 2: {
					if(_arguments[1] === '*') {
						for(const entry of this.#commands.entries()) {
							this.puts.apply(this, [entry[0] + ': ' + entry[1]['usage']].concat(entry[1]['description']));
						}
					} else {
						const command: ShellCommand | undefined = this.#commands.get(_arguments[1]);

						if(typeof(command) !== 'undefined') {
							this.puts.apply(this, [_arguments[1] + ': ' + command['usage']].concat(command['description']));
						} else {
							throw new ShellError(['help: no help topic match `' + _arguments[1].replace(/`/g, '\\`') + '`.']);
						}
					}
				}
			}

			return;
		}, 'help [PATTERN]', ['    Display information about builtin commands.',
		'',
		'    Displays brief summaries of builtin commands.  If PATTERN is',
		'    specified, gives detailed help on all commands matching PATTERN,',
		'    otherwise the list of help topics is printed.',
		'',
		'    Arguments:',
		'      PATTERN   Pattern specifying a help topic']));

		this.#commands.set('printenv', new ShellCommand(function (this: Shell, _arguments: string[]): void {
			if(_arguments['length'] === 1) {
				for(const entry of this.#environments.entries()) {
					if(entry[0][0] !== '?') {
						this.puts(entry[0] + '=' + entry[1]);
					}
				}
			} else {
				for(let i: number = 1; i < _arguments['length']; i++) {
					if(_arguments[i][0] !== '?') {
						const env: string | undefined = this.#environments.get(_arguments[i]);

						if(typeof(env) !== 'undefined') {
							this.puts(env);
						}
					}
				}
			}

			return;
		}, 'printenv [VARIABLES...]', ['    Prints environment variable values.',
		'',
		'   If no VARIABLEs are specified, the value of every environment',
		'   variable is printed.  Otherwise, it prints the value of each',
		'   VARIABLE that is set, and nothing for those that are not set.']));

		this.#commands.set('exit', new ShellCommand(function (this: Shell, _arguments: string[]): void {
			switch(_arguments['length']) {
				case 2: {
					if(/^(-|\+)?(0|[1-9][0-9]*)$/.test(_arguments[1])) {
						this.#environments.set('?', _arguments[1]);
					} else {
						this.puts('exit: ' + _arguments[1] + ': numeric argument required');
					}
				}

				case 1: {
					alert('Exited with code ' + this.#environments.get('?'));

					window.close();

					throw new ShellError(['Due to a security restriction, the script couldn\'t close the window.',
					'Please manually close the window.']);
				}

				default: {
					this.puts('sh: exit: too many arguments');
				}
			}

			return;
		}, 'exit [N]', ['    Exit the shell.',
		'',
		'    Exits the shell with a status of N.  If N is omitted, the exit status',
		'    is that of the last command executed.']));

		const date: string = String(new Date(Math.round(Math.random() * Date.now())));

		this.puts(this.#environments.get('HOSTNAME') + ' login: root',
		'Password: ',
		navigator['userAgent'],
		'',
		'The programs included with the H2Owater425 BLU/Arnux system are free software;',
		'the exact distribution terms for each program are described in the',
		'individual files in /who/the/fuc/*/cares.',
		'',
		'H2Owater425 BLU/Arnux comes with ABSOLUTELY NO WARRANTY, to the extent',
		'permitted by applicable law.',
		'Last login: ' + date.slice(0, 11) + date.slice(16, date.indexOf('G')) + date.slice(11, 15) + ' from ' + Math.round(Math.random() * 255) + '.' + Math.round(Math.random() * 255) + '.' + Math.round(Math.random() * 255) + '.' + Math.round(Math.random() * 255));

		this.#prompt();
	}

	#focus(): void {
		this.#input.scrollIntoView(true);
		this.#overlay.focus();

		return;
	}

	#prompt(): void {
		const prompt: string = this.#environments.get('USER') + '@' + this.#environments.get('HOSTNAME') + ':';
		let pwd: string = this.#environments.get('PWD') as string;

		if(pwd === this.#environments.get('HOME')) {
			pwd = '~';
		}

		document['title'] = prompt + ' ' + pwd;

		(this.#input['firstChild'] as HTMLElement).replaceWith(document.createTextNode(prompt + pwd + this.#spliter + ' '));
		(this.#input['lastChild'] as HTMLElement).replaceWith(document.createTextNode(''));

		this.#focus();

		return;
	}

	#blink(isVisible: boolean): void {
		if(typeof(isVisible) === 'boolean') {
			this.#cursor['textContent'] = isVisible ? '' : '#input::after{visibility:hidden}';
			//this.#cursor['textContent'] = isVisible ? '' : '#input::after{content:\'⎸\'}';

			return;
		} else {
			throw new Error('error');
		}
	}

	public putenv(name: string, value: string): void {
		if(Shell.isValidEnvironmentName(name) && typeof(value) === 'string') {
			this.#environments.set(name, value);

			return;
		} else {
			throw new Error('export');
		}
	}

	public getenv(name: string): string | undefined;
	public getenv(name?: undefined): IterableIterator<[string, string]>;
	public getenv(name?: string | undefined): string | undefined | IterableIterator<[string, string]> {
		switch(typeof(name)) {
			case 'string': {
				return this.#environments.get(name);
			}

			case 'undefined': {
				return this.#environments.entries();
			}

			default: {
				throw new Error('env');
			}
		}
	}

	public puts(...texts: string[]): void {
		if(texts['length'] !== 0) {
			for(let i: number = 0; i < texts['length']; i++) {
				this.#output.appendChild(document.createTextNode(texts[i] + '\n'));
			}
		} else {
			this.#output.appendChild(document.createTextNode('\n'));
		}

		return;
	}

	public clear(): void {
		this.#output.replaceChildren();

		return;
	}

	public register(name: string, command: ShellCommand): void {
		if(Shell.isValidCommandName(name) && command instanceof ShellCommand) {
			this.#commands.set(name, command);

			return;
		}

		throw new Error('register');
	}
}