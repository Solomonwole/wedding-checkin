"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface LottieAnimationProps {
  src: string;
  className?: string;
}

export function LottieAnimation({ src, className }: LottieAnimationProps) {
  return (
    <div className={className}>
      <DotLottieReact src={src} autoplay loop={false} />
    </div>
  );
}
