import { Session, User } from '../db';
import { checkPassword } from '../utils/auth';
import { ErrorForbidden } from '../utils/errors';
import SessionModel from '../models/SessionModel';
import UserModel from '../models/UserModel';
import uuidgen from '../utils/uuidgen';

export default class SessionController {

	async authenticate(email: string, password: string): Promise<Session> {
		const userModel = new UserModel();
		const user: User = await userModel.loadByEmail(email);
		if (!user) throw new ErrorForbidden('Invalid username or password');
		if (!checkPassword(password, user.password)) throw new ErrorForbidden('Invalid username or password');
		const session: Session = { id: uuidgen(), user_id: user.id };
		const sessionModel = new SessionModel();
		return sessionModel.save(session, { isNew: true });
	}

}
