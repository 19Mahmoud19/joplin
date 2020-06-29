import { utils } from '../services/CommandService';
const Setting = require('lib/models/Setting');
const Note = require('lib/models/Note');
const Folder = require('lib/models/Folder');
const TemplateUtils = require('lib/TemplateUtils');
const { _ } = require('lib/locale');

export default {
	name: 'newNote',
	label: () => _('New note'),
	iconName: 'fa-file',
	execute: async (template:string = null, isTodo:boolean = false) => {
		const folderId = Setting.value('activeFolderId');
		if (!folderId) return;

		const body = template ? TemplateUtils.render(template) : '';

		const defaultValues = Note.previewFieldsWithDefaultValues({ includeTimestamps: false });

		let newNote = Object.assign({}, defaultValues, {
			parent_id: folderId,
			is_todo: isTodo ? 1 : 0,
			body: body,
		});

		newNote = await Note.save(newNote, { provisional: true });

		utils.store.dispatch({
			type: 'NOTE_SELECT',
			id: newNote.id,
		});
	},
	isEnabled: () => {
		const { folders, selectedFolderId } = utils.store.getState();
		return !!folders.length && selectedFolderId !== Folder.conflictFolderId();
	},
};
