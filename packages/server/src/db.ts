import * as Knex from 'knex';
import { DatabaseConfig } from './utils/types';
import * as pathUtils from 'path';
import time from '@joplin/lib/time';
import Logger from '@joplin/lib/Logger';

const logger = Logger.create('db');

const migrationDir = `${__dirname}/migrations`;
const sqliteDbDir = pathUtils.dirname(__dirname);

export type DbConnection = Knex;

export interface DbConfigConnection {
	host?: string;
	port?: number;
	user?: string;
	database?: string;
	filename?: string;
	password?: string;
}

export interface KnexDatabaseConfig {
	client: string;
	connection: DbConfigConnection;
	useNullAsDefault?: boolean;
	asyncStackTraces?: boolean;
}

export interface ConnectionCheckResult {
	isCreated: boolean;
	error: any;
	latestMigration: any;
	connection: DbConnection;
}

export function sqliteFilePath(dbConfig: DatabaseConfig): string {
	return `${sqliteDbDir}/db-${dbConfig.name}.sqlite`;
}

export function makeKnexConfig(dbConfig: DatabaseConfig): KnexDatabaseConfig {
	const connection: DbConfigConnection = {};

	if (dbConfig.client === 'sqlite3') {
		connection.filename = sqliteFilePath(dbConfig);
	} else {
		connection.database = dbConfig.name;
		connection.host = dbConfig.host;
		connection.port = dbConfig.port;
		connection.user = dbConfig.user;
		connection.password = dbConfig.password;
	}

	return {
		client: dbConfig.client,
		useNullAsDefault: dbConfig.client === 'sqlite3',
		asyncStackTraces: dbConfig.asyncStackTraces,
		connection,
	};
}

export async function waitForConnection(dbConfig: DatabaseConfig): Promise<ConnectionCheckResult> {
	const timeout = 30000;
	const startTime = Date.now();
	let lastError = { message: '' };

	while (true) {
		try {
			const connection = await connectDb(dbConfig);
			const check = await connectionCheck(connection);
			if (check.error) throw check.error;
			return check;
		} catch (error) {
			logger.info('Could not connect. Will try again.', error.message);
			lastError = error;
		}

		if (Date.now() - startTime > timeout) {
			logger.error('Timeout trying to connect to database:', lastError);
			throw new Error(`Timeout trying to connect to database. Last error was: ${lastError.message}`);
		}

		await time.msleep(1000);
	}
}

export async function connectDb(dbConfig: DatabaseConfig): Promise<DbConnection> {
	return require('knex')(makeKnexConfig(dbConfig));
}

export async function disconnectDb(db: DbConnection) {
	await db.destroy();
}

export async function migrateDb(db: DbConnection) {
	await db.migrate.latest({
		directory: migrationDir,
		// Disable transactions because the models might open one too
		disableTransactions: true,
	});
}

export async function latestMigration(db: DbConnection): Promise<any> {
	try {
		const result = await db('knex_migrations').select('name').orderBy('id', 'asc').first();
		return result;
	} catch (error) {
		// If the database has never been initialized, we return null, so
		// for this we need to check the error code, which will be
		// different depending on the DBMS.
		if (error) {
			// Postgres error: 42P01: undefined_table
			if (error.code === '42P01') return null;

			// Sqlite3 error
			if (error.message && error.message.includes('no such table: knex_migrations')) return null;
		}

		throw error;
	}
}

export async function connectionCheck(db: DbConnection): Promise<ConnectionCheckResult> {
	try {
		const result = await latestMigration(db);
		return {
			latestMigration: result,
			isCreated: !!result,
			error: null,
			connection: db,
		};
	} catch (error) {
		return {
			latestMigration: null,
			isCreated: false,
			error: error,
			connection: null,
		};
	}
}

export enum ItemAddressingType {
	Id = 1,
	Path,
}

export enum ItemType {
    File = 1,
    User,
}

export interface WithDates {
	updated_time?: number;
	created_time?: number;
}

export interface WithUuid {
	id?: string;
}

interface DatabaseTableColumn {
	type: string;
}

interface DatabaseTable {
	[key: string]: DatabaseTableColumn;
}

interface DatabaseTables {
	[key: string]: DatabaseTable;
}

// AUTO-GENERATED-TYPES
// Auto-generated using `npm run generate-types`
export interface User extends WithDates, WithUuid {
	email?: string;
	password?: string;
	is_admin?: number;
}

export interface Session extends WithDates, WithUuid {
	user_id?: string;
	auth_code?: string;
}

export interface Permission extends WithDates, WithUuid {
	user_id?: string;
	item_type?: ItemType;
	item_id?: string;
	can_read?: number;
	can_write?: number;
}

export interface File extends WithDates, WithUuid {
	owner_id?: string;
	name?: string;
	content?: Buffer;
	mime_type?: string;
	size?: number;
	is_directory?: number;
	is_root?: number;
	parent_id?: string;
}

export interface ApiClient extends WithDates, WithUuid {
	name?: string;
	secret?: string;
}

export const databaseSchema: DatabaseTables = {
	users: {
		id: { type: 'string' },
		email: { type: 'string' },
		password: { type: 'string' },
		is_admin: { type: 'number' },
		updated_time: { type: 'number' },
		created_time: { type: 'number' },
	},
	sessions: {
		id: { type: 'string' },
		user_id: { type: 'string' },
		auth_code: { type: 'string' },
		updated_time: { type: 'number' },
		created_time: { type: 'number' },
	},
	permissions: {
		id: { type: 'string' },
		user_id: { type: 'string' },
		item_type: { type: 'number' },
		item_id: { type: 'string' },
		can_read: { type: 'number' },
		can_write: { type: 'number' },
		updated_time: { type: 'number' },
		created_time: { type: 'number' },
	},
	files: {
		id: { type: 'string' },
		owner_id: { type: 'string' },
		name: { type: 'string' },
		content: { type: 'any' },
		mime_type: { type: 'string' },
		size: { type: 'number' },
		is_directory: { type: 'number' },
		is_root: { type: 'number' },
		parent_id: { type: 'string' },
		updated_time: { type: 'number' },
		created_time: { type: 'number' },
	},
	api_clients: {
		id: { type: 'string' },
		name: { type: 'string' },
		secret: { type: 'string' },
		updated_time: { type: 'number' },
		created_time: { type: 'number' },
	},
};
// AUTO-GENERATED-TYPES
