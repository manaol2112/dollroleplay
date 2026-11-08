// Body measurements for a doll. The feet stand at (0, 0) and everything else sits above them, so
// clothing can be drawn from these numbers and fits every age.

export type Age = 'kid' | 'teen' | 'adult';
export type Pose = 'stand' | 'held' | 'sit' | 'sleep' | 'wave';

export interface Body {
  age: Age;
  R: number; // head radius
  headY: number; // head centre
  shY: number; // top of shoulders
  waistY: number;
  hipY: number;
  ankleY: number;
  legLen: number; // hip to ankle
  shW: number; // half widths
  waW: number;
  hiW: number;
  legX: number;
  legW: number;
  armW: number;
  armLen: number;
  armX: number;
  armY: number;
}

const M = {
  kid: { R: 92, leg: 78, torso: 84, shW: 40, waW: 34, hiW: 38, legX: 15, legW: 22, armW: 19 },
  teen: { R: 88, leg: 104, torso: 94, shW: 41, waW: 33, hiW: 39, legX: 16, legW: 22, armW: 19 },
  adult: { R: 85, leg: 130, torso: 104, shW: 45, waW: 35, hiW: 42, legX: 17, legW: 23, armW: 20 },
};

export function body(age: Age): Body {
  const m = M[age] ?? M.kid;
  const ankleY = -14;
  const hipY = ankleY - m.leg;
  const shY = hipY - m.torso;
  const armY = shY + 11;
  return {
    age,
    R: m.R,
    headY: shY - 12 - m.R * 0.82,
    shY,
    waistY: hipY - m.torso * 0.4,
    hipY,
    ankleY,
    legLen: m.leg,
    shW: m.shW,
    waW: m.waW,
    hiW: m.hiW,
    legX: m.legX,
    legW: m.legW,
    armW: m.armW,
    armLen: hipY - armY + 2,
    armX: m.shW - 9,
    armY,
  };
}

/** Half width of the torso at height y, following shoulders, waist and hips. */
export function sideX(b: Body, y: number, flare = 0): number {
  if (y <= b.shY + 16) return b.shW;
  if (y <= b.waistY) {
    const t = (y - (b.shY + 16)) / (b.waistY - (b.shY + 16));
    const e = t * t * (3 - 2 * t);
    return b.shW + (b.waW - b.shW) * e;
  }
  if (y <= b.hipY) {
    const t = (y - b.waistY) / (b.hipY - b.waistY);
    return b.waW + (b.hiW - b.waW) * Math.sin((t * Math.PI) / 2);
  }
  return b.hiW + flare * Math.min(1, (y - b.hipY) / 60) + (y - b.hipY) * 0.08;
}

export interface TorsoOpts {
  hemY: number;
  flare?: number;
  neckW?: number; // half width of neckline; 0 closes it
  neckDip?: number;
  vneck?: boolean;
  topY?: number; // flat top edge for tank and strapless cuts
  hemCurve?: number;
}

/** Outline of the torso, or of a top/dress body following it. */
export function torsoPath(b: Body, o: TorsoOpts): string {
  const r = 16;
  const { shY, waistY } = b;
  const flare = o.flare ?? 0;
  const hemY = o.hemY;
  const hx = sideX(b, hemY, flare);
  const wx = sideX(b, Math.min(waistY, hemY));
  const curve = o.hemCurve ?? 7;
  const f = (n: number) => n.toFixed(1);
  let top: string;
  if (o.topY !== undefined) {
    const ty = o.topY;
    const tx = sideX(b, ty);
    top = `M${f(-tx)} ${f(ty)} Q0 ${f(ty - 6)} ${f(tx)} ${f(ty)}`;
  } else {
    const nw = o.neckW ?? 0;
    const nd = o.neckDip ?? 0;
    const neck = nw > 0
      ? o.vneck
        ? `L${f(-nw)} ${f(shY)} L0 ${f(shY + nd)} L${f(nw)} ${f(shY)}`
        : `L${f(-nw)} ${f(shY)} Q${f(-nw * 0.9)} ${f(shY + nd)} 0 ${f(shY + nd)} Q${f(nw * 0.9)} ${f(shY + nd)} ${f(nw)} ${f(shY)}`
      : '';
    top = `M${f(-b.shW)} ${f(shY + r)} Q${f(-b.shW)} ${f(shY)} ${f(-b.shW + r)} ${f(shY)} ${neck} L${f(b.shW - r)} ${f(shY)} Q${f(b.shW)} ${f(shY)} ${f(b.shW)} ${f(shY + r)}`;
  }
  const midY = Math.min(waistY, hemY);
  const right = hemY <= waistY
    ? `L${f(hx)} ${f(hemY)}`
    : `C${f(b.shW)} ${f(waistY - 22)} ${f(wx)} ${f(waistY - 16)} ${f(wx)} ${f(midY)} L${f(hx)} ${f(hemY)}`;
  const left = hemY <= waistY
    ? `L${f(-hx)} ${f(hemY)}`
    : `L${f(-wx)} ${f(midY)} C${f(-wx)} ${f(waistY - 16)} ${f(-b.shW)} ${f(waistY - 22)} ${f(-b.shW)} ${f(shY + r)}`;
  const hem = `Q0 ${f(hemY + curve)} ${f(-hx)} ${f(hemY)}`;
  return `${top} ${right} ${hem} ${left} Z`;
}

/** Rounded sleeve or arm shape drawn inside an arm group (shoulder at 0,0, hanging down). */
export function sleevePath(w: number, len: number, extra = 3, flare = 0): string {
  const r = w / 2 + extra;
  const f = (n: number) => n.toFixed(1);
  const bw = r + flare;
  return `M${f(-r)} 0 A${f(r)} ${f(r)} 0 0 1 ${f(r)} 0 L${f(bw)} ${f(len - 3)} Q${f(bw)} ${f(len)} ${f(bw - 3)} ${f(len)} L${f(-bw + 3)} ${f(len)} Q${f(-bw)} ${f(len)} ${f(-bw)} ${f(len - 3)} Z`;
}

/** Pants leg drawn inside a leg group (hip at 0,0). */
export function legPath(w: number, len: number, extra = 3, flare = 0): string {
  const h = w / 2 + extra;
  const f = (n: number) => n.toFixed(1);
  return `M${f(-h)} -10 L${f(h)} -10 L${f(h + flare)} ${f(len)} L${f(-h - flare)} ${f(len)} Z`;
}
