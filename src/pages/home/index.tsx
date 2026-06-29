import { InfoCircleOutlined } from "@ant-design/icons";
import { Space, Spin, Tooltip, theme } from "antd";
import { useCallback, useContext } from "react";
import { FormattedMessage } from "react-intl";
import { CheckPermissions } from "@/components/checkPermissions";
import { ContentWrap } from "@/components/contentWrap";
import { FunctionButton } from "@/components/functionButton";
import { GlobalShortcutContext } from "@/components/globalShortcut";
import { GroupTitle } from "@/components/groupTitle";
import { KeyButton } from "@/components/keyButton";
import { ResetSettingsButton } from "@/components/resetSettingsButton";
import { AppSettingsActionContext } from "@/contexts/appSettingsActionContext";
import {
	type AppSettingsData,
	AppSettingsGroup,
	ShortcutKeyStatus,
} from "@/types/appSettings";
import {
	type AppFunction,
	type AppFunctionConfig,
	AppFunctionGroup,
} from "@/types/components/appFunction";
import {
	convertShortcutKeyStatusToButtonColor,
	convertShortcutKeyStatusToTip,
} from "./extra";

export const HomePage = () => {
	const { token } = theme.useToken();

	const { updateAppSettings } = useContext(AppSettingsActionContext);

	const resetFliter = useCallback((group: AppFunctionGroup) => {
		return (settings: Record<string, unknown>) => {
			const newSettings: Partial<
				AppSettingsData[AppSettingsGroup.AppFunction]
			> = {};

			Object.keys(settings).forEach((key) => {
				if ((settings[key] as AppFunctionConfig).group !== group) {
					return;
				}

				newSettings[key as AppFunction] = settings[key] as AppFunctionConfig;
			});

			return newSettings;
		};
	}, []);

	const {
		defaultAppFunctionComponentGroupConfigs,
		updateShortcutKeyStatusLoading,
		appSettingsLoading,
		appFunctionSettings,
		shortcutKeyStatus,
		disableShortcutKeyRef,
	} = useContext(GlobalShortcutContext);

	return (
		<ContentWrap className="home-wrap">
			<CheckPermissions />

			{Object.keys(defaultAppFunctionComponentGroupConfigs).map((group) => {
				const configs =
					defaultAppFunctionComponentGroupConfigs[group as AppFunctionGroup];

				const groupTitle = (
					<GroupTitle
						id="screenshotFunction"
						extra={
							<ResetSettingsButton
								title={
									<FormattedMessage
										id="home.screenshotFunction"
										key="screenshotFunction"
									/>
								}
								appSettingsGroup={AppSettingsGroup.AppFunction}
								filter={resetFliter(AppFunctionGroup.Screenshot)}
							/>
						}
					>
						<FormattedMessage
							id="home.screenshotFunction"
							key="screenshotFunction"
						/>
					</GroupTitle>
				);

				const speicalKeys = ["PrintScreen"];

				return (
					<div key={`${group}`} style={{ marginBottom: token.marginLG }}>
						{groupTitle}
						<Spin
							key={`${group}`}
							spinning={updateShortcutKeyStatusLoading || appSettingsLoading}
						>
							<Space
								direction="vertical"
								size="middle"
								style={{ display: "flex" }}
							>
								{configs.map((config) => {
									const key = config.configKey;
									const currentShortcutKey =
										appFunctionSettings?.[key as AppFunction]?.shortcutKey;
									const statusColor = appSettingsLoading
										? undefined
										: convertShortcutKeyStatusToButtonColor(
												shortcutKeyStatus?.[key as AppFunction],
											);

									const statusTip = appSettingsLoading
										? undefined
										: convertShortcutKeyStatusToTip(
												shortcutKeyStatus?.[key as AppFunction],
											);

									let children = <></>;
									if (
										shortcutKeyStatus?.[key as AppFunction] ===
										ShortcutKeyStatus.None
									) {
										children = (
											<div
												style={{
													color: token.colorTextDescription,
												}}
											>
												<FormattedMessage id="home.shortcut.none" />
											</div>
										);
									} else if (statusTip) {
										children = (
											<Tooltip
												title={convertShortcutKeyStatusToTip(
													shortcutKeyStatus?.[key as AppFunction],
												)}
											>
												<InfoCircleOutlined />
											</Tooltip>
										);
									}

									return (
										<div key={`${group}-${key}`}>
											<FunctionButton
												label={config.title}
												icon={config.icon}
												onClick={config.onClick}
											>
												<KeyButton
													speicalKeys={speicalKeys}
													title={config.title}
													maxWidth={200}
													keyValue={currentShortcutKey ?? ""}
													buttonProps={{
														variant: "dashed",
														color: statusColor,
														children,
														onClick: () => {
															disableShortcutKeyRef.current = true;
														},
													}}
													onCancel={() => {
														disableShortcutKeyRef.current = false;
													}}
													onKeyChange={async (value) => {
														disableShortcutKeyRef.current = false;
														updateAppSettings(
															AppSettingsGroup.AppFunction,
															{
																[key as AppFunction]: {
																	...appFunctionSettings,
																	shortcutKey: value,
																},
															},
															false,
															true,
															false,
															false,
														);
													}}
													maxLength={1}
												/>
											</FunctionButton>
										</div>
									);
								})}
							</Space>
						</Spin>
					</div>
				);
			})}
		</ContentWrap>
	);
};
