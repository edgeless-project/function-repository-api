import { ParseIntPipe, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class OptionalParseIntPipe extends ParseIntPipe {

	private readonly defaultValue;

	constructor(defaultValue: string ) {
		super();
		this.defaultValue = defaultValue;
	}

	async transform(value: string, metadata: ArgumentMetadata): Promise<number> {
		if (!value) {
			return super.transform(this.defaultValue, metadata);
		} else {
			return super.transform(value, metadata);
		}
	}
}
