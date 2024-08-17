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

	shell.register('certificate', new ShellCommand(function (this: Shell, _arguments: string[]): void {
		if(_arguments['length'] === 1) {
			this.puts('National Technical Certificates:', '  Craftsman Information Processing (2024.07.10)', 'Private Qualifications:', '  Linux Master Level-Ⅱ            (2022.12.30)');

			return;
		} else {
			throw new ShellError(['Usage: certificate']);
		}
	}, 'certificate', ['   Print the certificates acquired by H2Owater425.']));

	shell.register('whoami', new ShellCommand(function (this: Shell, _arguments: string[]): void {
		if(_arguments['length'] === 1) {
			this.puts(this.getenv('USER') as string);

			return;
		} else {
			throw new ShellError(['Usage: whoami']);
		}
	}, 'whoami', ['   Print the user name associated with the current effective user ID.']));

	shell.register('whoareyou', new ShellCommand(function (this: Shell, _arguments: string[]): void {
		if(_arguments['length'] === 1) {
			this.puts('👋 Hello, stranger!',
			'',
			'I\'m H2Owater425, also known as KKM, which are my initials.',
			'Currently, I\'m a senior in the Web Programming Department at Korea Digital Media High School. 👨‍🎓👨‍💻',
			'My programming skills aren\'t the best, but I\'m a very passionate programmer!',
			'Perhaps I could show you something as time goes on...',
			'Anyway, have a nice day! ☀️',
			'',
			'Contacts 📫',
			'- Discord: 물워터#7826',
			'- Twitter: @H2Owater425',
			'- Email: h2o@dhmo.kr, me@kangmin.kim')

			return;
		} else {
			throw new ShellError(['Usage: whoareyou']);
		}
	}, 'whoareyou', ['   Display information about H2Owater425.']));

	shell.register('goto', new ShellCommand(function (this: Shell, _arguments: string[]): void {
		if(_arguments['length'] === 2) {
			switch(_arguments[1].toLowerCase()) {
				case 'github': {
					window.open('https://github.com/H2Owater425', '_blank');

					break;
				}

				case 'youtube': {
					window.open('https://www.youtube.com/channel/UCaLPCyaHRP9f8SqYC9VckgA', '_blank');

					break;
				}

				case 'twitch': {
					window.open('https://www.twitch.tv/H2Owater425', '_blank');

					break;
				}

				case 'chzzk': {
					window.open('https://chzzk.naver.com/dd25515a05361dad0f0bcaf7f655530a', '_blank');

					break;
				}

				case 'twitter': {
					window.open('https://twitter.com/H2Owater425', '_blank');

					break;
				}

				case 'x': {
					window.open('https://x.com/H2Owater425', '_blank');

					break;
				}

				case 'steam': {
					window.open('https://steamcommunity.com/id/h2owater425', '_blank');

					break;
				}

				case 'mochive': {
					window.open('https://mochive.com/', '_blank');

					break;
				}

				case 'chzim': {
					window.open('https://chz.im/', '_blank');

					break;
				}

				case 'forgor': {
					window.open('https://forgor.sk/', '_blank');

					break;
				}

				default: {
					throw new ShellError(['sh: goto: no such website']);
				}
			}
		} else {
			throw new ShellError(['Usage: goto [website]']);
		}
	}, 'goto [website]', ['   Open a website related to H2Owater425.',
	'',
	'   Websites:',
	'      github',
	'      youtube',
	'      twitch',
	'      chzzk',
	'      twitter',
	'      x',
	'      steam',
	'      mochive',
	'      chzim',
	'      forgor']));
}
