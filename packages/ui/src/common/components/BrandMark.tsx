import { assetUrl } from '@mimik/core/env';

export function BrandMark({ size = 22 }: { size?: number }) {
  return <img src={assetUrl('/brand-mark.png')} alt="" width={size} height={size} className="shrink-0 rounded-[22%]" />;
}
