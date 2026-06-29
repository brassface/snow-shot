import { DrawState } from "@/types/draw";

export const isOcrTool = (drawState: DrawState) => {
	return drawState === DrawState.OcrDetect;
};
