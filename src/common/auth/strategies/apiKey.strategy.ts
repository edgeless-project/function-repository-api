import {Injectable} from "@nestjs/common";
import {PassportStrategy} from "@nestjs/passport";
import { HeaderAPIKeyStrategy } from "passport-headerapikey";


@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy){
	constructor(){
		super({ header: "Authorization", prefix: "ApiKey_" }, false);
	}

	public validate(apikey: string) {
		return apikey;
	}

}