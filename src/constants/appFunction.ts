import {
	AppFunction,
	type AppFunctionConfig,
	AppFunctionGroup,
} from "@/types/components/appFunction";

export const defaultAppFunctionConfigs: Record<AppFunction, AppFunctionConfig> =
	{
		[AppFunction.Screenshot]: {
			shortcutKey: "F1",
			group: AppFunctionGroup.Screenshot,
		},
	};
