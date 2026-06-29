export enum TranslationDomain {
	General = "general",
}

export enum TranslationType {
	Youdao = "youdao",
}

export type TranslationTypeOption = {
	name: string;
	type: TranslationType | string;
};

export type TranslateData = {
	content: string;
};

export type DeepLTranslateResult = {
	text: string;
};
