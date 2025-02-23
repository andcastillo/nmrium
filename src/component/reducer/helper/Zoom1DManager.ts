import { zoomIdentity, scaleLinear } from 'd3';
import { Draft } from 'immer';

import { State } from '../Reducer';

import { getActiveSpectrum } from './getActiveSpectrum';

export const ZOOM_TYPES = {
  HORIZONTAL: 'HORIZONTAL',
  VERTICAL: 'VERTICAL',
  STEP_HORIZONTAL: 'STEP_HORIZONTAL',
  FULL: 'FULL',
} as const;

export type ZoomType = keyof typeof ZOOM_TYPES;

function toScaleRatio(event: WheelEvent, zoomOptions: ZoomOptions = {}) {
  const { factor = 1, invert = false } = zoomOptions;

  const deltaY =
    Math.abs(event.deltaY) < 100 ? event.deltaY * 100 : event.deltaY;
  const delta = deltaY * (invert ? -0.001 : 0.001) * factor;
  const ratio = delta < 0 ? -1 / (delta - 1) : 1 + delta;

  return ratio;
}

interface ZoomOptions {
  factor?: number;
  invert?: boolean;
}
function wheelZoom(
  event: WheelEvent,
  domain: number[],
  zoomOptions: ZoomOptions = {},
): number[] {
  const ratio = toScaleRatio(event, zoomOptions);
  const [min, max] = domain;
  return [min * ratio, max * ratio];
}

function setZoom(
  draft: Draft<State>,
  options: {
    scale?: number;
    spectrumID?: string;
  } = {},
) {
  const { height, margin, originDomain, yDomains } = draft;
  const activeSpectrum = getActiveSpectrum(draft);
  const { scale = 1, spectrumID = null } = options;

  if (activeSpectrum === null && spectrumID === null) {
    const { shareYDomain, yDomain, yDomains } = originDomain;

    draft.yDomains = Object.fromEntries(
      Object.keys(yDomains).map((id) => {
        const _scale = scaleLinear(shareYDomain ? yDomain : yDomains[id], [
          height - margin.bottom,
          margin.top,
        ]);
        const [min, max] = shareYDomain ? yDomain : yDomains[id];
        const maxPoint = Math.max(Math.abs(max), Math.abs(min));
        const scalePoint = maxPoint === Math.abs(max) ? 0 : min;
        const t = zoomIdentity
          .translate(
            0,
            Math.sign(scalePoint) >= 0
              ? _scale(scalePoint)
              : _scale(scalePoint),
          )
          .scale(scale)
          .translate(0, -_scale(0));
        const newYDomain = t.rescaleY(_scale).domain();
        return [id, newYDomain];
      }),
    );
  } else {
    const spectrumId = spectrumID || activeSpectrum?.id;
    if (spectrumId) {
      const _scale = scaleLinear(originDomain.yDomains[spectrumId], [
        height - margin.bottom,
        margin.top,
      ]);
      const t = zoomIdentity
        .translate(0, _scale(0))
        .scale(scale)
        .translate(0, -_scale(0));
      const yDomain = t.rescaleY(_scale).domain();

      draft.yDomains = {
        ...yDomains,
        [spectrumId]: yDomain,
      };
    }
  }
}

export { setZoom, wheelZoom, toScaleRatio };
