import { NmrData2DFt, NmrData1D } from 'cheminfo-types';
import { xyReduce } from 'ml-spectra-processing';

import { calculateSanPlot } from '../../../../../data/utilities/calculateSanPlot';

export function processSnapPlot<T extends '1D' | '2D'>(
  dimension: T,
  data: T extends '1D' ? NmrData1D : NmrData2DFt['rr'],
  yLogBase: number,
) {
  const sanResult = calculateSanPlot(dimension, data);
  const sanPlot: any = {};
  const lines: any = {};
  for (const plotKey in sanResult.sanplot) {
    const { x, y } = xyReduce(sanResult.sanplot[plotKey]);
    const result = new Array(x.length);
    for (let i = 0; i < x.length; i++) {
      result[i] = { x: x[i], y: y[i] };
    }
    sanPlot[plotKey] = result;
    lines[plotKey] = getLine(sanResult[plotKey], result, { yLogBase });
  }
  return { sanPlot, lines };
}

function getLine(value, data, options) {
  const { log10, abs } = Math;
  const { yLogBase } = options;
  const first = data.at(0)?.x ?? 0;
  const last = data.at(-1)?.x ?? 0;
  const inLogScale = log10(abs(value)) / log10(yLogBase);
  return [
    { x: first, y: inLogScale },
    { x: last, y: inLogScale },
  ];
}
