"use client";

import { QRCodeSVG } from "qrcode.react";

interface InvitationQRCodeProps {
  token: string;
}

export function InvitationQRCode({ token }: InvitationQRCodeProps) {
  return (
    <div className="mx-auto flex w-fit items-center justify-center rounded-3xl border bg-white p-5 shadow-sm">
      <QRCodeSVG value={token} size={220} level="H" includeMargin />
    </div>
  );
}
