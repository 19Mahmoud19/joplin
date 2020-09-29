import * as React from 'react';
import CommandService from 'lib/services/CommandService';
import ToolbarBase from '../../../ToolbarBase';
import { PluginStates, utils as pluginUtils } from 'lib/services/plugin_service/reducer';
const { buildStyle } = require('lib/theme');

interface ToolbarProps {
	themeId: number,
	dispatch: Function,
	plugins: PluginStates,
}

function styles_(props:ToolbarProps) {
	return buildStyle('CodeMirrorToolbar', props.themeId, () => {
		return {
			root: {
				flex: 1,
				marginBottom: 0,
			},
		};
	});
}

export default function Toolbar(props:ToolbarProps) {
	const styles = styles_(props);

	const cmdService = CommandService.instance();

	const toolbarItems = [
		cmdService.commandToToolbarButton('historyBackward'),
		cmdService.commandToToolbarButton('historyForward'),
		cmdService.commandToToolbarButton('startExternalEditing'),

		{ type: 'separator' },
		cmdService.commandToToolbarButton('textBold'),
		cmdService.commandToToolbarButton('textItalic'),
		{ type: 'separator' },
		cmdService.commandToToolbarButton('textLink'),
		cmdService.commandToToolbarButton('textCode'),
		cmdService.commandToToolbarButton('attachFile'),
		{ type: 'separator' },
		cmdService.commandToToolbarButton('textNumberedList'),
		cmdService.commandToToolbarButton('textBulletedList'),
		cmdService.commandToToolbarButton('textCheckbox'),
		cmdService.commandToToolbarButton('textHeading'),
		cmdService.commandToToolbarButton('textHorizontalRule'),
		cmdService.commandToToolbarButton('insertDateTime'),

		cmdService.commandToToolbarButton('toggleEditors'),
	];

	const infos = pluginUtils.viewInfosByType(props.plugins, 'toolbarButton');

	for (const info of infos) {
		const view = info.view;
		if (view.location !== 'editorToolbar') continue;
		toolbarItems.push(cmdService.commandToToolbarButton(view.commandName));
	}

	return <ToolbarBase style={styles.root} items={toolbarItems} />;
}
