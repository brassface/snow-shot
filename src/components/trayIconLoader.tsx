import { defaultWindowIcon } from "@tauri-apps/api/app";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Image } from "@tauri-apps/api/image";
import { Menu } from "@tauri-apps/api/menu";
import { join, resourceDir } from "@tauri-apps/api/path";
import { TrayIcon, type TrayIconOptions } from "@tauri-apps/api/tray";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isEqual } from "es-toolkit";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { useIntl } from "react-intl";
import { exitApp } from "@/commands";
import { AntdContext } from "@/contexts/antdContext";
import { AppContext } from "@/contexts/appContext";
import { AppSettingsPublisher } from "@/contexts/appSettingsActionContext";
import { executeScreenshot } from "@/functions/screenshot";
import { openCaptureHistory, openImageSaveFolder } from "@/functions/tools";
import { useAppSettingsLoad } from "@/hooks/useAppSettingsLoad";
import { createPublisher } from "@/hooks/useStatePublisher";
import { useStateRef } from "@/hooks/useStateRef";
import { useStateSubscriber } from "@/hooks/useStateSubscriber";
import {
	type AppSettingsData,
	AppSettingsGroup,
	AppSettingsTheme,
	TrayIconClickAction,
	TrayIconDefaultIcon,
} from "@/types/appSettings";
import {
	AppFunction,
	type AppFunctionConfig,
} from "@/types/components/appFunction";
import { formatKey } from "@/utils/format";
import { appError } from "@/utils/log";
import { showWindow } from "@/utils/window";

export const TrayIconStatePublisher = createPublisher<{
	disableShortcut: boolean;
}>({
	disableShortcut: false,
});

export const getDefaultIconPath = async (
	defaultIcon: TrayIconDefaultIcon,
	resourceDirPath?: string,
): Promise<{
	web_path: string;
	native_path: string;
}> => {
	const basePath = resourceDirPath ?? (await resourceDir());

	const nativePath = await join(
		basePath,
		"app-icons",
		`snow-shot-tray-${defaultIcon}.png`,
	);
	const defaultIconPath = convertFileSrc(nativePath);

	return {
		web_path: defaultIconPath,
		native_path: nativePath,
	};
};

const TrayIconLoaderComponent = () => {
	const intl = useIntl();
	const { message } = useContext(AntdContext);
	const [disableShortcut, _setDisableShortcut] = useState(false);
	const [, setTrayIconState] = useStateSubscriber(
		TrayIconStatePublisher,
		useCallback((state: { disableShortcut: boolean }) => {
			_setDisableShortcut(state.disableShortcut);
		}, []),
	);

	const { currentTheme } = useContext(AppContext);

	const [shortcutKeys, setShortcutKeys, shortcutKeysRef] = useStateRef<
		Record<AppFunction, AppFunctionConfig> | undefined
	>(undefined);
	const [iconPath, setIconPath] = useState("");
	const [iconPathDark, setIconPathDark] = useState("");
	const [defaultIcon, setDefaultIcon] = useState<TrayIconDefaultIcon>(
		TrayIconDefaultIcon.Default,
	);
	const [defaultIconDark, setDefaultIconDark] = useState<TrayIconDefaultIcon>(
		TrayIconDefaultIcon.Default,
	);
	const [enableTrayIcon, setEnableTrayIcon] = useState(false);
	const [getAppSettings] = useStateSubscriber(AppSettingsPublisher, undefined);
	useAppSettingsLoad(
		useCallback(
			(settings: AppSettingsData, previous: AppSettingsData | undefined) => {
				if (
					shortcutKeysRef.current === undefined ||
					!isEqual(
						settings[AppSettingsGroup.AppFunction],
						previous?.[AppSettingsGroup.AppFunction],
					)
				) {
					setShortcutKeys(settings[AppSettingsGroup.AppFunction]);
				}

				setIconPath(settings[AppSettingsGroup.CommonTrayIcon].iconPath);
				setIconPathDark(settings[AppSettingsGroup.CommonTrayIcon].iconPathDark);
				setDefaultIcon(settings[AppSettingsGroup.CommonTrayIcon].defaultIcons);
				setDefaultIconDark(
					settings[AppSettingsGroup.CommonTrayIcon].defaultIconsDark,
				);
				setEnableTrayIcon(
					settings[AppSettingsGroup.CommonTrayIcon].enableTrayIcon,
				);
			},
			[setShortcutKeys, shortcutKeysRef],
		),
		true,
	);

	const initTrayIcon = useCallback(async (): Promise<
		| {
				trayIcon: TrayIcon | undefined;
				trayIconMenu: Menu | undefined;
		  }
		| undefined
	> => {
		if (!shortcutKeys) {
			return;
		}

		if (!enableTrayIcon) {
			return;
		}

		const appWindow = getCurrentWindow();

		let iconImage: Image | undefined;
		try {
			let targetIconPath = iconPath;
			if (currentTheme === AppSettingsTheme.Dark && iconPathDark) {
				targetIconPath = iconPathDark;
			}

			if (targetIconPath) {
				iconImage = await Image.fromPath(targetIconPath);
			}
		} catch {
			message.error(intl.formatMessage({ id: "home.trayIcon.error4" }));
			return;
		}

		if (iconImage) {
			const size = await iconImage.size();
			if (size.width > 128 || size.height > 128) {
				message.error(intl.formatMessage({ id: "home.trayIcon.error3" }));
				return;
			}
		}

		const menu = await Menu.new({
			id: `${appWindow.label}-trayIconMenu`,
			items: [
				{
					id: `${appWindow.label}-screenshot`,
					text: intl.formatMessage({ id: "home.screenshot" }),
					accelerator: disableShortcut
						? undefined
						: formatKey(shortcutKeys[AppFunction.Screenshot].shortcutKey),
					action: async () => {
						executeScreenshot();
					},
				},
				{
					item: "Separator",
				},
				{
					id: `${appWindow.label}-open-image-save-folder`,
					text: intl.formatMessage({ id: "home.openImageSaveFolder" }),
					action: async () => {
						openImageSaveFolder();
					},
				},
				{
					id: `${appWindow.label}-open-capture-history`,
					text: intl.formatMessage({ id: "home.openCaptureHistory" }),
					action: async () => {
						openCaptureHistory();
					},
				},
				{
					item: "Separator",
				},
				{
					id: `${appWindow.label}-disableShortcut`,
					text: intl.formatMessage({ id: "home.disableShortcut" }),
					checked: disableShortcut,
					action: async () => {
						setTrayIconState({
							disableShortcut: !disableShortcut,
						});
					},
				},
				{
					id: `${appWindow.label}-show-main-window`,
					text: intl.formatMessage({ id: "home.showMainWindow" }),
					action: async () => {
						showWindow();
					},
				},
				{
					item: "Separator",
				},
				{
					id: `${appWindow.label}-exit`,
					text: intl.formatMessage({ id: "home.exit" }),
					action: async () => {
						exitApp();
					},
				},
			],
		});

		const options: TrayIconOptions = {
			icon: iconImage
				? iconImage
				: ((await (async () => {
						let targetDefaultIcon = defaultIcon;
						if (currentTheme === AppSettingsTheme.Dark && defaultIconDark) {
							targetDefaultIcon = defaultIconDark;
						}

						const { native_path } = await getDefaultIconPath(targetDefaultIcon);

						const iconImage = await Image.fromPath(native_path);

						return iconImage;
					})()) ??
					(await defaultWindowIcon()) ??
					""),
			showMenuOnLeftClick: false,
			tooltip: "Snow Shot",
			action: (event) => {
				switch (event.type) {
					case "Click":
						if (event.button === "Left") {
							if (
								getAppSettings()[AppSettingsGroup.FunctionTrayIcon]
									.iconClickAction === TrayIconClickAction.Screenshot
							) {
								executeScreenshot();
							} else if (
								getAppSettings()[AppSettingsGroup.FunctionTrayIcon]
									.iconClickAction === TrayIconClickAction.ShowMainWindow
							) {
								showWindow();
							}
						}
						break;
				}
			},
			menu,
		};

		return {
			trayIcon: await TrayIcon.new(options),
			trayIconMenu: menu,
		};
	}, [
		shortcutKeys,
		enableTrayIcon,
		intl,
		disableShortcut,
		iconPath,
		message,
		defaultIcon,
		getAppSettings,
		setTrayIconState,
		currentTheme,
		defaultIconDark,
		iconPathDark,
	]);

	useEffect(() => {
		if (!shortcutKeys) {
			return;
		}

		const trayIconPromise = initTrayIcon();

		const handleBeforeUnload = async () => {
			trayIconPromise
				.then((trayIcon) => {
					if (trayIcon) {
						trayIcon.trayIconMenu?.close();
						trayIcon.trayIcon?.close();
					}
				})
				.catch((error) => {
					appError(`[TrayIconLoader] beforeunload event failed`, error);
				});
		};

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			trayIconPromise
				.then((trayIcon) => {
					if (trayIcon) {
						trayIcon.trayIconMenu?.close();
						trayIcon.trayIcon?.close();
					}
				})
				.catch((error) => {
					appError(`[TrayIconLoader] close tray icon failed`, error);
				});

			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [initTrayIcon, shortcutKeys]);

	return null;
};

export const TrayIconLoader = React.memo(TrayIconLoaderComponent);
