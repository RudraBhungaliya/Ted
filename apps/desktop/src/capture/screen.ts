import { desktopCapturer } from "electron";

export async function captureScreen() {
  return desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: {
      width: 1920,
      height: 1080,
    },
  });
}
