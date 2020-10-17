import { useEffect } from 'react';
import { FormNote, ScrollOptionTypes } from './types';
import editorCommandDeclarations from '../commands/editorCommandDeclarations';
import CommandService, { CommandDeclaration,  CommandRuntime } from '../../../lib/services/CommandService';
const { time } = require('lib/time-utils.js');
const { reg } = require('lib/registry.js');

const commandsWithDependencies = [
	require('../commands/showLocalSearch'),
	require('../commands/focusElementNoteTitle'),
	require('../commands/focusElementNoteBody'),
];

interface HookDependencies {
	formNote:FormNote,
	setShowLocalSearch:Function,
	dispatch:Function,
	noteSearchBarRef:any,
	editorRef:any,
	titleInputRef:any,
	saveNoteAndWait: Function,
}

function editorCommandRuntime(declaration:CommandDeclaration, editorRef:any):CommandRuntime {
	return {
		execute: async (props:any) => {
			if (!editorRef.current.execCommand) {
				reg.logger().warn('Received command, but editor cannot execute commands', declaration.name);
			} else {
				if (declaration.name === 'insertDateTime') {
					return editorRef.current.execCommand({
						name: 'insertText',
						value: time.formatMsToLocal(new Date().getTime()),
					});
				} else if (declaration.name === 'scrollToHash') {
					return editorRef.current.scrollTo({
						type: ScrollOptionTypes.Hash,
						value: props.hash,
					});
				} else {
					return editorRef.current.execCommand({
						name: declaration.name,
						value: props.value,
					});
				}
			}
		},
		isEnabled: '!isDialogVisible && markdownEditorVisible && hasOneSelectedNote && isMarkdownNote',
	};
}

export default function useWindowCommandHandler(dependencies:HookDependencies) {
	const { setShowLocalSearch, noteSearchBarRef, editorRef, titleInputRef } = dependencies;

	useEffect(() => {
		for (const declaration of editorCommandDeclarations) {
			CommandService.instance().registerRuntime(declaration.name, editorCommandRuntime(declaration, editorRef));
		}

		const dependencies = {
			editorRef,
			setShowLocalSearch,
			noteSearchBarRef,
			titleInputRef,
		};

		for (const command of commandsWithDependencies) {
			CommandService.instance().registerRuntime(command.declaration.name, command.runtime(dependencies));
		}

		return () => {
			for (const declaration of editorCommandDeclarations) {
				CommandService.instance().unregisterRuntime(declaration.name);
			}

			for (const command of commandsWithDependencies) {
				CommandService.instance().unregisterRuntime(command.declaration.name);
			}
		};
	}, [editorRef, setShowLocalSearch, noteSearchBarRef, titleInputRef]);
}
