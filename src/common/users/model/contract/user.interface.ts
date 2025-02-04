export enum UserRole {
	ClusterAdmin = "CLUSTER_ADMIN",
	AppDeveloper = "APP_DEVELOPER",
	FunctionDeveloper = "FUNC_DEVELOPER",
}

export interface User {
	id: string;
	email: string;
	password: string;
	role: UserRole;
}