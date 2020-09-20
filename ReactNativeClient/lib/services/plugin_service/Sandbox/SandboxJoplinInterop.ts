import InteropService from 'lib/services/interop/InteropService';
import { Module } from 'lib/services/interop/types';

export default class SandboxJoplinInterop {

	registerModule(module:Module) {
		return InteropService.instance().registerModule(module);
	}

}
