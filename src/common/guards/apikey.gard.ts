import {ExecutionContext, HttpException, HttpStatus, Injectable, Logger} from "@nestjs/common";
import {AuthGuard} from "@nestjs/passport";
import {ApikeyService} from "@common/auth/services/apikey.service";

@Injectable()
export class ApikeyGard extends AuthGuard('headerapikey'){
	private logger = new Logger('AccessGuard ApiKey', {timestamp: true});

	constructor(private apikeyService: ApikeyService) {
		super();
	}

	async canActivate(context: ExecutionContext): Promise<boolean>{
		try {
			await super.canActivate(context);
		} catch (error) {
			// do nothing
		}
		const request = context.switchToHttp().getRequest();
		const apikey = request.user;
		let response: boolean = false;
		try {
			response = await this.apikeyService.validateApiKey(apikey);
		}catch {
			return false;
		}
		return response;
	}
}