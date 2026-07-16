export type UploadedMedia = {
  type: "IMAGE" | "VIDEO";
  url: string;
  pathname: string;
  mimeType: string;
  size: number;
};
