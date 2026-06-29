"use client";

import { theme } from "antd";
import { AppInfoPanel } from "@/components/appInfoPanel";

export const AboutPage = () => {
	const { token } = theme.useToken();

	return (
		<div
			style={{
				margin: `${token.marginLG}px 0`,
				minHeight: "100vh",
			}}
		>
			<AppInfoPanel variant="full" />
		</div>
	);
};
