/**
 * Per-state RERA interest spread configs.
 * Each file: spreadPct, method, applicableFrom/To, source, sourceUrl, verifiedOn.
 */
import ap from "./ap.json";
import br from "./br.json";
import cg from "./cg.json";
import ga from "./ga.json";
import gj from "./gj.json";
import hr from "./hr.json";
import hp from "./hp.json";
import jh from "./jh.json";
import ka from "./ka.json";
import kl from "./kl.json";
import mp from "./mp.json";
import mh from "./mh.json";
import od from "./od.json";
import pb from "./pb.json";
import rj from "./rj.json";
import tn from "./tn.json";
import ts from "./ts.json";
import up from "./up.json";
import uk from "./uk.json";
import wb from "./wb.json";
import asConfig from "./as.json";
import ml from "./ml.json";
import tr from "./tr.json";
import an from "./an.json";
import ch from "./ch.json";
import dn from "./dn.json";
import dl from "./dl.json";
import jk from "./jk.json";
import ld from "./ld.json";
import py from "./py.json";

export const STATE_SPREAD_CONFIGS = {
  ap,
  br,
  cg,
  ga,
  gj,
  hr,
  hp,
  jh,
  ka,
  kl,
  mp,
  mh,
  od,
  pb,
  rj,
  tn,
  ts,
  up,
  uk,
  wb,
  as: asConfig,
  ml,
  tr,
  an,
  ch,
  dn,
  dl,
  jk,
  ld,
  py,
};

export function getStateSpreadConfig(stateId) {
  return STATE_SPREAD_CONFIGS[stateId] || null;
}
