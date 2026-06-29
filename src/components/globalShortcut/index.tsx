import { useDeepCompareEffect } from "@ant-design/pro-components";
import {
	isRegistered,
	register,
	unregister,
	unregisterAll,
} from "@tauri-apps/plugin-global-shortcut";
import React, {
	createContext,
	useCallback,
	useMemo,
	useRef,
	useState,
} from "react";
import { FormattedMessage } from "react-intl";
import { hasFocusedFullScreenWindow } from "@/commands/core";
import { ScreenshotIcon } from "@/components/icons";
import { TrayIconStatePublisher } from "@/components/trayIconLoader";
import { defaultAppFunctionConfigs } from "@/constants/appFunction";
import { AppSettingsPublisher } from "@/contexts/appSettingsActionContext";
import { executeScreenshot } from "@/functions/screenshot";
import { useAppSettingsLoad } from "@/hooks/useAppSettingsLoad";
import { useStateSubscriber } from "@/hooks/useStateSubscriber";
import {
	type AppSettingsData,
	AppSettingsGroup,
	ShortcutKeyStatus,
} from "@/types/appSettings";
import type {
	AppFunction,
	AppFunctionComponentConfig,
	AppFunctionConfig,
	AppFunctionGroup,
} from "@/types/components/appFunction";
import { appError } from "@/utils/log";

export type GlobalShortcutContextType = {
	disableShortcutKeyRef: React.RefObject<boolean>;
	defaultAppFunctionComponentGroupConfigs: Record<
		AppFunctionGroup,
		AppFunctionComponentConfig[]
	>;
	shortcutKeyStatus: Record<AppFunction, ShortcutKeyStatus> | undefined;
	updateShortcutKeyStatusLoading: boolean;
	appSettingsLoading: boolean;
	appFunctionSettings:
		| AppSettingsData[AppSettingsGroup.AppFunction]
		| undefined;
};

export const GlobalShortcutContext = createContext<GlobalShortcutContextType>({
	disableShortcutKeyRef: { current: false },
	defaultAppFunctionComponentGroupConfigs: {} as Record<
		AppFunctionGroup,
		AppFunctionComponentConfig[]
	>,
	shortcutKeyStatus: {} as Record<AppFunction, ShortcutKeyStatus>,
	updateShortcutKeyStatusLoading: true,
	appSettingsLoading: true,
	appFunctionSettings: {} as AppSettingsData[AppSettingsGroup.AppFunction],
});

const GlobalShortcutCore = ({ children }: { children: React.ReactNode }) => {
	const disableShortcutKeyRef = useRef(false);
	const [getTrayIconState] = useStateSubscriber(
		TrayIconStatePublisher,
		undefined,
	);

	const [getAppSettings] = useStateSubscriber(AppSettingsPublisher, undefined);

	const {
		configs: defaultAppFunctionComponentConfigs,
		groupConfigs: defaultAppFunctionComponentGroupConfigs,
	}: {
		configs: Record<AppFunction, AppFunctionComponentConfig>;
		groupConfigs: Record<AppFunctionGroup, AppFunctionComponentConfig[]>;
	} = useMemo(() => {
		const configs = Object.keys(defaultAppFunctionConfigs).reduce(
			(configs, key) => {
				const onClick = async () => {
					if (disableShortcutKeyRef.current) {
						return;
					}

					await executeScreenshot();
				};

				configs[key as AppFunction] = {
					...defaultAppFunctionConfigs[key as AppFunction],
					configKey: key as AppFunction,
					title: <FormattedMessage id="home.screenshot" />,
					icon: <ScreenshotIcon />,
					onClick,
					onKeyChange: async (value: string, prevValue: string) => {
						if (prevValue) {
							try {
								if (await isRegistered(prevValue)) {
									await unregister(prevValue);
								}
							} catch (error) {
								appError("[GlobalShortcut] unregister prevValue failed", error);
							}
						}

						if (!value) {
							return false;
						}

						try {
							if (await isRegistered(value)) {
								await unregister(value);
							}
						} catch (error) {
							appError("[GlobalShortcut] unregister value failed", error);
						}

						await register(value, async (event) => {
							if (event.state !== "Released") {
								return;
							}

							if (
								getAppSettings()[AppSettingsGroup.FunctionGlobalShortcut]
									.disableOnFocusedFullScreenWindow &&
								(await hasFocusedFullScreenWindow())
							) {
								return;
							}

							if (getTrayIconState()?.disableShortcut) {
								return;
							}

							onClick();
						});

						return true;
					},
				};

				return configs;
			},
			{} as Record<AppFunction, AppFunctionComponentConfig>,
		);

		const groupConfigs = Object.values(configs).reduce(
			(groupConfigs, config) => {
				if (!groupConfigs[config.group]) {
					groupConfigs[config.group] = [];
				}

				groupConfigs[config.group].push(config);
				return groupConfigs;
			},
			{} as Record<AppFunctionGroup, AppFunctionComponentConfig[]>,
		);

		return { configs, groupConfigs };
	}, [getAppSettings, getTrayIconState]);

	const [shortcutKeyStatus, setShortcutKeyStatus] =
		useState<Record<AppFunction, ShortcutKeyStatus>>();

	const [updateShortcutKeyStatusLoading, setUpdateShortcutKeyStatusLoading] =
		useState(true);
	const previousAppFunctionSettingsRef =
		useRef<AppSettingsData[AppSettingsGroup.AppFunction]>(undefined);

	const appFunctionComponentConfigsKeys = useMemo(
		() => Object.keys(defaultAppFunctionComponentConfigs),
		[defaultAppFunctionComponentConfigs],
	);

	const updateShortcutKeyStatus = useCallback(
		async (settings: Record<AppFunction, AppFunctionConfig>) => {
			setUpdateShortcutKeyStatusLoading(true);
			const keyStatus: Record<AppFunction, ShortcutKeyStatus> = {} as Record<
				AppFunction,
				ShortcutKeyStatus
			>;

			await Promise.all(
				appFunctionComponentConfigsKeys.map(async (key) => {
					const config = defaultAppFunctionComponentConfigs[key as AppFunction];
					const currentShortcutKey = settings[key as AppFunction].shortcutKey;

					try {
						const isSuccess = await config.onKeyChange(
							currentShortcutKey,
							(previousAppFunctionSettingsRef.current ?? settings)[
								key as AppFunction
							].shortcutKey,
						);

						if (!currentShortcutKey) {
							keyStatus[key as AppFunction] = ShortcutKeyStatus.None;
						} else {
							keyStatus[key as AppFunction] = isSuccess
								? ShortcutKeyStatus.Registered
								: ShortcutKeyStatus.Unregistered;
						}

						if (
							keyStatus[key as AppFunction] === ShortcutKeyStatus.Registered &&
							currentShortcutKey === "PrintScreen"
						) {
							keyStatus[key as AppFunction] = ShortcutKeyStatus.PrintScreen;
						}
					} catch {
						keyStatus[key as AppFunction] = ShortcutKeyStatus.Error;
					}
				}),
			);

			setShortcutKeyStatus(keyStatus);
			previousAppFunctionSettingsRef.current = settings;
			setUpdateShortcutKeyStatusLoading(false);
		},
		[appFunctionComponentConfigsKeys, defaultAppFunctionComponentConfigs],
	);

	const [appFunctionSettings, setAppFunctionSettings] =
		useState<AppSettingsData[AppSettingsGroup.AppFunction]>();

	const hasUnregisteredAll = useRef(false);
	useAppSettingsLoad(
		useCallback((settings: AppSettingsData) => {
			(hasUnregisteredAll.current ? Promise.resolve() : unregisterAll()).then(
				() => {
					setAppFunctionSettings(settings[AppSettingsGroup.AppFunction]);
				},
			);
			hasUnregisteredAll.current = true;
		}, []),
		true,
	);

	const updateShortcutKeyStatusPendingRef = useRef(false);
	useDeepCompareEffect(() => {
		if (!appFunctionSettings) {
			return;
		}

		if (updateShortcutKeyStatusPendingRef.current) {
			return;
		}

		updateShortcutKeyStatusPendingRef.current = true;
		updateShortcutKeyStatus(appFunctionSettings).then(() => {
			updateShortcutKeyStatusPendingRef.current = false;
		});
	}, [appFunctionSettings, updateShortcutKeyStatus]);

	const contextValue = useMemo((): GlobalShortcutContextType => {
		return {
			disableShortcutKeyRef,
			defaultAppFunctionComponentGroupConfigs,
			shortcutKeyStatus,
			updateShortcutKeyStatusLoading,
			appSettingsLoading: appFunctionSettings === undefined,
			appFunctionSettings,
		};
	}, [
		defaultAppFunctionComponentGroupConfigs,
		shortcutKeyStatus,
		updateShortcutKeyStatusLoading,
		appFunctionSettings,
	]);

	return (
		<GlobalShortcutContext.Provider value={contextValue}>
			{children}
		</GlobalShortcutContext.Provider>
	);
};

export const GlobalShortcut = React.memo(GlobalShortcutCore);
