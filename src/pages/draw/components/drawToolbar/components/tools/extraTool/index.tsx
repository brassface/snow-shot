import { ScanOutlined } from "@ant-design/icons";
import { Button, Flex, theme } from "antd";
import { useCallback, useContext, useState } from "react";
import { useIntl } from "react-intl";
import { DrawStatePublisher } from "@/components/drawCore/extra";
import {
	AppSettingsActionContext,
	AppSettingsPublisher,
} from "@/contexts/appSettingsActionContext";
import { useStateSubscriber } from "@/hooks/useStateSubscriber";
import { DrawContext } from "@/pages/draw/types";
import {
	type AppSettingsData,
	AppSettingsGroup,
	ExtraToolList,
} from "@/types/appSettings";
import { DrawState } from "@/types/draw";
import { getButtonTypeByState } from "../../../extra";
import { ToolbarPopover } from "../../toolbarPopover";

export const ExtraTool: React.FC<{
	onToolClickAction: (tool: DrawState) => void;
	disable: boolean;
}> = ({ onToolClickAction, disable }) => {
	const intl = useIntl();
	const { token } = theme.useToken();

	const { updateAppSettings } = useContext(AppSettingsActionContext);

	const [lastActiveTool, setLastActiveTool] = useState<ExtraToolList>(
		ExtraToolList.None,
	);
	useStateSubscriber(
		AppSettingsPublisher,
		useCallback((settings: AppSettingsData) => {
			setLastActiveTool(settings[AppSettingsGroup.Cache].lastExtraTool);
		}, []),
	);

	const [activeTool, setActiveTool] = useState<ExtraToolList>(
		ExtraToolList.None,
	);
	const [, setEnabled] = useState(false);

	const executeScanQrcode = useCallback(() => {
		setActiveTool(ExtraToolList.ScanQrcode);
	}, []);

	const updateLastActiveTool = useCallback(
		(value: ExtraToolList) => {
			updateAppSettings(
				AppSettingsGroup.Cache,
				{ lastExtraTool: value },
				true,
				true,
				false,
				true,
				false,
			);
		},
		[updateAppSettings],
	);

	useStateSubscriber(
		DrawStatePublisher,
		useCallback(
			(drawState: DrawState) => {
				if (
					drawState === DrawState.ExtraTools ||
					drawState === DrawState.ScanQrcode
				) {
					if (drawState === DrawState.ScanQrcode) {
						executeScanQrcode();
						updateLastActiveTool(ExtraToolList.ScanQrcode);
					}

					setEnabled(true);
				} else {
					setActiveTool(ExtraToolList.None);
					setEnabled(false);
				}
			},
			[executeScanQrcode, updateLastActiveTool],
		),
	);

	const scanQrcodeButton = (
		<Button
			icon={<ScanOutlined />}
			title={intl.formatMessage({ id: "draw.extraTool.scanQrcode" })}
			type={getButtonTypeByState(activeTool === ExtraToolList.ScanQrcode)}
			key="scanQrcode"
			onClick={() => {
				onToolClickAction(DrawState.ScanQrcode);
			}}
			disabled={disable}
		/>
	);

	return (
		<ToolbarPopover
			trigger={[]}
			content={
				<Flex align="center" gap={token.paddingXS} className="popover-toolbar">
					{scanQrcodeButton}
				</Flex>
			}
		>
			<div>{scanQrcodeButton}</div>
		</ToolbarPopover>
	);
};
