"use client";

const THUMBNAIL_WIDTH = 720;
const THUMBNAIL_QUALITY = 0.82;

function waitForEvent(target: HTMLMediaElement, eventName: "loadedmetadata" | "loadeddata" | "seeked"): Promise<void> {
  return new Promise((resolve, reject) => {
    function handleSuccess() {
      cleanup();
      resolve();
    }

    function handleError() {
      cleanup();
      reject(new Error("Das Video konnte nicht gelesen werden."));
    }

    function cleanup() {
      target.removeEventListener(eventName, handleSuccess);
      target.removeEventListener("error", handleError);
    }

    target.addEventListener(eventName, handleSuccess, {
      once: true,
    });

    target.addEventListener("error", handleError, {
      once: true,
    });
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Das Video-Thumbnail konnte nicht erzeugt werden."));
          return;
        }

        resolve(blob);
      },
      "image/webp",
      THUMBNAIL_QUALITY,
    );
  });
}

export async function createVideoThumbnail(file: File): Promise<string> {
  const sourceUrl = URL.createObjectURL(file);
  const video = document.createElement("video");

  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  video.src = sourceUrl;

  try {
    await waitForEvent(video, "loadedmetadata");

    const duration = Number.isFinite(video.duration) ? video.duration : 0;

    const targetTime = duration > 1 ? Math.min(Math.max(duration * 0.2, 0.5), duration - 0.25) : 0;

    if (targetTime > 0) {
      video.currentTime = targetTime;
      await waitForEvent(video, "seeked");
    } else {
      await waitForEvent(video, "loadeddata");
    }

    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;

    if (!sourceWidth || !sourceHeight) {
      throw new Error("Die Videogrösse konnte nicht ermittelt werden.");
    }

    const scale = Math.min(1, THUMBNAIL_WIDTH / sourceWidth);

    const canvas = document.createElement("canvas");

    canvas.width = Math.max(1, Math.round(sourceWidth * scale));

    canvas.height = Math.max(1, Math.round(sourceHeight * scale));

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas wird vom Browser nicht unterstützt.");
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const thumbnailBlob = await canvasToBlob(canvas);

    return URL.createObjectURL(thumbnailBlob);
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(sourceUrl);
  }
}
