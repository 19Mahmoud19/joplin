import * as React from 'react';
import CommandService from '../../lib/services/CommandService';
const { connect } = require('react-redux');
const { buildStyle } = require('lib/theme');
const Toolbar = require('../Toolbar.min.js');
// const Note = require('lib/models/Note');
const Folder = require('lib/models/Folder');
// const { time } = require('lib/time-utils.js');
const { _ } = require('lib/locale');
const { substrWithEllipsis } = require('lib/string-utils');

interface ButtonClickEvent {
	name: string,
}

interface NoteToolbarProps {
	theme: number,
	style: any,
	folders: any[],
	watchedNoteFiles: string[],
	backwardHistoryNotes: any[],
	forwardHistoryNotes: any[],
	notesParentType: string,
	note: any,
	dispatch: Function,
	onButtonClick(event:ButtonClickEvent):void,
}

function styles_(props:NoteToolbarProps) {
	return buildStyle('NoteToolbar', props.theme, (/* theme:any*/) => {
		return {
			root: {
				...props.style,
				borderBottom: 'none',
			},
		};
	});
}

function useToolbarItems(props:NoteToolbarProps) {
	const { note, folders, watchedNoteFiles, notesParentType, backwardHistoryNotes, forwardHistoryNotes } = props;

	const toolbarItems = [];

	const selectedNoteFolder = Folder.byId(folders, note.parent_id);

	toolbarItems.push({
		tooltip: _('Back'),
		iconName: 'fa-arrow-left',
		enabled: (backwardHistoryNotes.length > 0),
		onClick: () => {
			if (!backwardHistoryNotes.length) return;
			props.dispatch({
				type: 'HISTORY_BACKWARD',
			});
		},
	});

	toolbarItems.push({
		tooltip: _('Forward'),
		iconName: 'fa-arrow-right',
		enabled: (forwardHistoryNotes.length > 0),
		onClick: () => {
			if (!forwardHistoryNotes.length) return;
			props.dispatch({
				type: 'HISTORY_FORWARD',
			});
		},
	});

	if (selectedNoteFolder && ['Search', 'Tag', 'SmartFilter'].includes(notesParentType)) {
		toolbarItems.push({
			title: _('In: %s', substrWithEllipsis(selectedNoteFolder.title, 0, 16)),
			iconName: 'fa-book',
			onClick: () => {
				props.dispatch({
					type: 'FOLDER_AND_NOTE_SELECT',
					folderId: selectedNoteFolder.id,
					noteId: note.id,
				});
			},
		});
	}

	toolbarItems.push(CommandService.instance().commandToToolbarButton('showNoteProperties'));

	if (watchedNoteFiles.indexOf(note.id) >= 0) {
		toolbarItems.push(CommandService.instance().commandToToolbarButton('stopExternalEditing'));
	} else {
		toolbarItems.push(CommandService.instance().commandToToolbarButton('startExternalEditing'));
	}

	toolbarItems.push(CommandService.instance().commandToToolbarButton('editAlarm'));

	// if (note.is_todo) {
	// 	const item:any = {
	// 		iconName: 'fa-clock',
	// 		enabled: !note.todo_completed,
	// 		onClick: () => {
	// 			onButtonClick({ name: 'setAlarm' });
	// 		},
	// 	};
	// 	if (Note.needAlarm(note)) {
	// 		item.title = time.formatMsToLocal(note.todo_due);
	// 	} else {
	// 		item.tooltip = _('Set alarm');
	// 	}
	// 	toolbarItems.push(item);
	// }

	toolbarItems.push(CommandService.instance().commandToToolbarButton('setTags'));

	return toolbarItems;
}

function NoteToolbar(props:NoteToolbarProps) {
	const styles = styles_(props);
	const toolbarItems = useToolbarItems(props);
	return <Toolbar style={styles.root} items={toolbarItems} />;
}

const mapStateToProps = (state:any) => {
	return {
		folders: state.folders,
		watchedNoteFiles: state.watchedNoteFiles,
		backwardHistoryNotes: state.backwardHistoryNotes,
		forwardHistoryNotes: state.forwardHistoryNotes,
		notesParentType: state.notesParentType,
	};
};

export default connect(mapStateToProps)(NoteToolbar);
