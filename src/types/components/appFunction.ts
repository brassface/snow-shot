export enum AppFunction {
	Screenshot = "screenshot",
}

export enum AppFunctionGroup {
	Screenshot = "screenshot",
}

export type AppFunctionConfig = {
	shortcutKey: string;
	group: AppFunctionGroup;
};

export type AppFunctionComponentConfig = AppFunctionConfig & {
	configKey: AppFunction;
	title: React.ReactNode;
	icon?: React.ReactNode;
	group: AppFunctionGroup;
	onClick: () => Promise<void>;
	onKeyChange: (value: string, prevValue: string) => Promise<boolean>;
};
