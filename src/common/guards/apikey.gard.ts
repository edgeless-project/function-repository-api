import {ExecutionContext, Injectable, Logger} from "@nestjs/common";
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
			return false; //API Key prefix ApiKey_ is needed
		}
		const request = context.switchToHttp().getRequest();
		const apikey = request.user;
		let response: boolean = false;
		try {
			const valid = await this.apikeyService.validateApiKey(apikey);
			if (valid) {
				request.user = await this.apikeyService.getUserByApiKey(apikey); // Set user to the API Key details
				response = true;
			}
		}catch {
			return false;
		}
		return response;
	}
}