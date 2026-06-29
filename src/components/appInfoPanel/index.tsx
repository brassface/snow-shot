"use client";

import { GithubOutlined } from "@ant-design/icons";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Badge, Button, Divider, Space, Tag, Typography, theme } from "antd";
import { compare } from "compare-versions";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import { getLatestVersion } from "@/components/checkVersion";
import {
	APP_NAME,
	FORK_ISSUES_URL,
	FORK_MAINTAINER,
	FORK_RELEASES_URL,
	FORK_REPO_URL,
	UPSTREAM_AUTHOR,
	UPSTREAM_REPO_URL,
} from "@/constants/appInfo";

const { Title, Paragraph, Text } = Typography;

type AppInfoPanelProps = {
	variant?: "full" | "compact";
};

export const AppInfoPanel: React.FC<AppInfoPanelProps> = ({
	variant = "full",
}) => {
	const { token } = theme.useToken();
	const intl = useIntl();
	const [version, setVersion] = useState("0.0.0");
	const [latestVersion, setLatestVersion] = useState<string>();

	const inited = useRef(false);
	const init = useCallback(async () => {
		if (inited.current) {
			return;
		}
		inited.current = true;

		setVersion(await getVersion());

		const latest = await getLatestVersion();
		if (latest) {
			setLatestVersion(latest);
		}
	}, []);

	useEffect(() => {
		init();
	}, [init]);

	const hasNewVersion = useMemo(() => {
		return latestVersion !== undefined && compare(latestVersion, version, ">");
	}, [latestVersion, version]);

	const isCompact = variant === "compact";

	return (
		<div style={{ marginBottom: isCompact ? 0 : token.marginLG }}>
			<div style={{ textAlign: isCompact ? "left" : "center" }}>
				{!isCompact && (
					<div style={{ marginBottom: -12 }}>
						<img
							src="/images/app-icon.png"
							alt={APP_NAME}
							width={100}
							height={100}
						/>
					</div>
				)}

				<Title level={isCompact ? 4 : 2} style={{ marginTop: token.marginSM }}>
					{isCompact ? (
						APP_NAME
					) : (
						<Badge
							count={
								hasNewVersion
									? intl.formatMessage({ id: "about.newVersion" })
									: undefined
							}
							style={{ display: "block", cursor: "pointer" }}
							size="small"
							onClick={() => openUrl(FORK_RELEASES_URL)}
						>
							<div
								style={{
									fontSize: token.fontSizeHeading2,
									marginTop: token.marginXS,
								}}
							>
								<span style={{ color: "var(--snow-shot-purple-color)" }}>
									Snow{" "}
								</span>
								<span>Shot Mini</span>
							</div>
						</Badge>
					)}
				</Title>

				<Paragraph
					type="secondary"
					style={{ marginBottom: token.marginXS, marginTop: 0 }}
				>
					{intl.formatMessage({ id: "about.subtitle" })}
				</Paragraph>
				<Paragraph
					type="secondary"
					style={{ marginBottom: token.marginSM, marginTop: 0 }}
				>
					{intl.formatMessage({ id: "about.disclaimer" })}
				</Paragraph>

				<Space wrap size={[token.marginXS, token.marginXS]}>
					<Tag color="blue">
						<a
							style={{ color: token.colorLink }}
							onClick={() => openUrl(FORK_RELEASES_URL)}
						>
							{intl.formatMessage({ id: "about.version" })} {version}
						</a>
					</Tag>
					<Tag color="green">
						<a
							style={{ color: token.colorLink }}
							onClick={() => openUrl(`https://github.com/${FORK_MAINTAINER}`)}
						>
							{intl.formatMessage({ id: "about.maintainer" })}
						</a>
					</Tag>
					<Tag>
						<a
							style={{ color: token.colorLink }}
							onClick={() => openUrl(UPSTREAM_REPO_URL)}
						>
							{intl.formatMessage({ id: "about.upstream" })}
						</a>
					</Tag>
				</Space>
			</div>

			{!isCompact && <Divider />}

			{!isCompact && (
				<>
					<div style={{ marginBottom: token.marginLG }}>
						<Title level={3}>
							{intl.formatMessage({ id: "about.license.title" })}
						</Title>
						<Paragraph>
							{intl.formatMessage({ id: "about.license.description" })}
						</Paragraph>
						<ul>
							<li>
								<strong>
									{intl.formatMessage({ id: "about.license.nonCommercial" })}
								</strong>
								<a
									onClick={() =>
										openUrl("https://www.apache.org/licenses/LICENSE-2.0")
									}
								>
									{intl.formatMessage({
										id: "about.license.nonCommercialType",
									})}
								</a>
							</li>
							<li>
								<strong>
									{intl.formatMessage({ id: "about.license.commercial" })}
								</strong>
								<a
									onClick={() =>
										openUrl("https://www.gnu.org/licenses/gpl-3.0.html")
									}
								>
									{intl.formatMessage({ id: "about.license.commercialType" })}
								</a>
							</li>
						</ul>
						<Text type="secondary">
							{intl.formatMessage(
								{ id: "about.license.forkNotice" },
								{ upstream: UPSTREAM_AUTHOR },
							)}
						</Text>
					</div>

					<div style={{ marginBottom: token.marginLG }}>
						<Title level={3}>
							{intl.formatMessage({ id: "about.contact.title" })}
						</Title>
						<Space direction="vertical" style={{ width: "100%" }}>
							<Button
								type="primary"
								icon={<GithubOutlined />}
								onClick={() => openUrl(FORK_ISSUES_URL)}
								block
							>
								{intl.formatMessage({ id: "about.contact.github" })}
							</Button>
							<Button
								icon={<GithubOutlined />}
								onClick={() => openUrl(FORK_REPO_URL)}
								block
							>
								{intl.formatMessage({ id: "about.contact.repository" })}
							</Button>
							<Button
								icon={<GithubOutlined />}
								onClick={() => openUrl(UPSTREAM_REPO_URL)}
								block
							>
								{intl.formatMessage(
									{ id: "about.contact.upstream" },
									{ author: UPSTREAM_AUTHOR },
								)}
							</Button>
						</Space>
					</div>
				</>
			)}
		</div>
	);
};
