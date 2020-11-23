import * as Koa from 'koa';
import routes from './routes/routes';
import { ErrorNotFound } from './utils/errors';
import * as fs from 'fs-extra';
import * as koaBody from 'koa-body';
import { argv } from 'yargs';
import { findMatchingRoute, ApiResponse } from './utils/routeUtils';
import appLogger from './utils/appLogger';
import koaIf from './utils/koaIf';
import config from './config';
import { disconnectDb, initDb } from './db';

// require('source-map-support').install();

config.baseUrl = `http://localhost:${config.port}`;

appLogger.info(`Starting server on port ${config.port} and PID ${process.pid}...`);
appLogger.info(`Base URL: ${config.baseUrl}`);

const app = new Koa();

const koaBodyMiddleware = koaBody({
	multipart: true,
	includeUnparsed: true,
	onError: (err: Error, ctx: Koa.Context) => {
		appLogger.error(`koaBodyMiddleware: ${ctx.method} ${ctx.path} Error: ${err.message}`);
	},
});

app.use(koaIf(koaBodyMiddleware, (ctx: Koa.Context) => {
	const match = findMatchingRoute(ctx.path, routes);
	if (!match) return false;
	return match.route.needsBodyMiddleware === true;
}));

app.use(async (ctx: Koa.Context) => {
	appLogger.info(`${ctx.request.method} ${ctx.path}`);

	const match = findMatchingRoute(ctx.path, routes);

	try {
		if (match) {
			const responseObject = await match.route.exec(match.subPath, ctx);

			if (responseObject instanceof ApiResponse) {
				ctx.response = responseObject.response;
			} else {
				ctx.response.status = 200;
				ctx.response.body = responseObject;
			}
		} else {
			throw new ErrorNotFound();
		}
	} catch (error) {
		appLogger.error(error);
		ctx.response.status = error.httpCode ? error.httpCode : 500;

		if (match.route.responseFormat === 'html') {
			ctx.response.set('Content-Type', 'text/html');
			ctx.response.body = `<html>Error! ${error.message}</html>`;
		} else {
			ctx.response.set('Content-Type', 'application/json');
			ctx.response.body = { error: error.message };
		}
	}
});

async function main() {
	const pidFile = argv.pidfile as string;

	if (pidFile) {
		appLogger.info(`Writing PID to ${pidFile}...`);
		fs.removeSync(pidFile as string);
		fs.writeFileSync(pidFile, `${process.pid}`);
	}
	
	if (argv.migrateDb) {
		await initDb();
		await disconnectDb();
	} else {
		app.listen(config.port);
	}
}

main().catch((error:any) => {
	console.error(error);
	process.exit(1);
});
