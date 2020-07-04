import * as vm from 'vm';
import Plugin from './Plugin';
import manifestFromObject from './utils/manifestFromObject';
import Sandbox from './Sandbox/Sandbox';
import { SandboxContext } from './utils/types';
const { shim } = require('lib/shim');
const { filename } = require('lib/path-utils');
const BaseService = require('lib/services/BaseService');

interface Plugins {
	[key:string]: Plugin
}

export default class PluginService extends BaseService {

	private static instance_:PluginService = null;

	public static instance():PluginService {
		if (!this.instance_) {
			this.instance_ = new PluginService();
		}

		return this.instance_;
	}

	private store_:any = null;
	private plugins_:Plugins = {};

	initialize(store:any) {
		this.store_ = store;
	}

	public get plugins():Plugins {
		return this.plugins_;
	}

	public pluginById(id:string):Plugin {
		if (!this.plugins_[id]) throw new Error(`Plugin not found: ${id}`);

		return this.plugins_[id];
	}

	async loadPlugin(path:string):Promise<Plugin> {
		const fsDriver = shim.fsDriver();

		let distPath = path;
		if (!(await fsDriver.exists(`${distPath}/manifest.json`))) {
			distPath = `${path}/dist`;
		}

		const manifestPath = `${distPath}/manifest.json`;
		const indexPath = `${distPath}/index.js`;
		const manifestContent = await fsDriver.readFile(manifestPath);
		const manifest = manifestFromObject(JSON.parse(manifestContent));
		const scriptText = await fsDriver.readFile(indexPath);
		const pluginId = filename(path);

		const plugin = new Plugin(pluginId, distPath, manifest, scriptText, this.logger());

		this.store_.dispatch({
			type: 'PLUGIN_ADD',
			plugin: {
				id: pluginId,
				views: {},
			},
		});

		return plugin;
	}

	async loadPlugins(pluginDir:string) {
		const fsDriver = shim.fsDriver();
		const pluginPaths = await fsDriver.readDirStats(pluginDir);

		for (const stat of pluginPaths) {
			if (!stat.isDirectory()) continue;

			if (stat.path.indexOf('_') === 0) {
				this.logger().info(`PluginService: Plugin name starts with "_" and has not been loaded: ${stat.path}`);
				continue;
			}

			const plugin = await this.loadPlugin(`${pluginDir}/${stat.path}`);
			this.plugins_[plugin.id] = plugin;
			await this.runPlugin(plugin);
		}
	}

	async runPlugin(plugin:Plugin) {
		// Context contains the data that is sent from the plugin to the app
		// Currently it only contains the object that's registered when
		// the plugin calls `joplin.plugins.register()`
		const context:SandboxContext = {
			runtime: null,
		};

		const sandbox = new Sandbox(plugin, this.store_, context);
		vm.createContext(sandbox);
		vm.runInContext(plugin.scriptText, sandbox);

		if (!context.runtime) {
			throw new Error(`Plugin ${plugin.id}: The plugin was not registered! Call joplin.plugins.register({.....}) from within the plugin.`);
		}

		if (context.runtime.onStart) {
			const startTime = Date.now();

			try {
				this.logger().info(`Starting plugin: ${plugin.id}`);
				await context.runtime.onStart({});
			} catch (error) {
				// For some reason, error thrown from the executed script do not have the type "Error"
				// but are instead plain object. So recreate the Error object here so that it can
				// be handled correctly by loggers, etc.
				const newError:Error = new Error(error.message);
				newError.stack = error.stack;
				this.logger().error(plugin.id, `In plugin ${plugin.id}:`, newError);
			}

			this.logger().info(`Finished running plugin: ${plugin.id} (Took ${Date.now() - startTime}ms)`);
		}
	}

}
