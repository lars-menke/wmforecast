// SVG-Flaggen (flag-icons, 4x3) — ersetzt Emoji-Flaggen, die auf
// Android/Windows inkonsistent oder gar nicht rendern.
// Vite inlined kleine SVGs als data-URI, groessere werden eigene Assets
// und erst bei Anzeige geladen.

import us from 'flag-icons/flags/4x3/us.svg';
import mx from 'flag-icons/flags/4x3/mx.svg';
import ca from 'flag-icons/flags/4x3/ca.svg';
import jm from 'flag-icons/flags/4x3/jm.svg';
import hn from 'flag-icons/flags/4x3/hn.svg';
import pa from 'flag-icons/flags/4x3/pa.svg';
import ar from 'flag-icons/flags/4x3/ar.svg';
import br from 'flag-icons/flags/4x3/br.svg';
import uy from 'flag-icons/flags/4x3/uy.svg';
import co from 'flag-icons/flags/4x3/co.svg';
import ec from 'flag-icons/flags/4x3/ec.svg';
import ve from 'flag-icons/flags/4x3/ve.svg';
import py from 'flag-icons/flags/4x3/py.svg';
import de from 'flag-icons/flags/4x3/de.svg';
import fr from 'flag-icons/flags/4x3/fr.svg';
import es from 'flag-icons/flags/4x3/es.svg';
import gbEng from 'flag-icons/flags/4x3/gb-eng.svg';
import pt from 'flag-icons/flags/4x3/pt.svg';
import nl from 'flag-icons/flags/4x3/nl.svg';
import be from 'flag-icons/flags/4x3/be.svg';
import at from 'flag-icons/flags/4x3/at.svg';
import ch from 'flag-icons/flags/4x3/ch.svg';
import hr from 'flag-icons/flags/4x3/hr.svg';
import rs from 'flag-icons/flags/4x3/rs.svg';
import gbSct from 'flag-icons/flags/4x3/gb-sct.svg';
import dk from 'flag-icons/flags/4x3/dk.svg';
import tr from 'flag-icons/flags/4x3/tr.svg';
import pl from 'flag-icons/flags/4x3/pl.svg';
import si from 'flag-icons/flags/4x3/si.svg';
import ua from 'flag-icons/flags/4x3/ua.svg';
import jp from 'flag-icons/flags/4x3/jp.svg';
import kr from 'flag-icons/flags/4x3/kr.svg';
import ir from 'flag-icons/flags/4x3/ir.svg';
import au from 'flag-icons/flags/4x3/au.svg';
import sa from 'flag-icons/flags/4x3/sa.svg';
import qa from 'flag-icons/flags/4x3/qa.svg';
import iq from 'flag-icons/flags/4x3/iq.svg';
import jo from 'flag-icons/flags/4x3/jo.svg';
import ma from 'flag-icons/flags/4x3/ma.svg';
import sn from 'flag-icons/flags/4x3/sn.svg';
import eg from 'flag-icons/flags/4x3/eg.svg';
import ng from 'flag-icons/flags/4x3/ng.svg';
import ci from 'flag-icons/flags/4x3/ci.svg';
import gh from 'flag-icons/flags/4x3/gh.svg';
import cm from 'flag-icons/flags/4x3/cm.svg';
import tn from 'flag-icons/flags/4x3/tn.svg';
import za from 'flag-icons/flags/4x3/za.svg';
import nz from 'flag-icons/flags/4x3/nz.svg';
import cz from 'flag-icons/flags/4x3/cz.svg';
import ba from 'flag-icons/flags/4x3/ba.svg';
import se from 'flag-icons/flags/4x3/se.svg';
import no from 'flag-icons/flags/4x3/no.svg';
import dz from 'flag-icons/flags/4x3/dz.svg';
import cv from 'flag-icons/flags/4x3/cv.svg';
import cd from 'flag-icons/flags/4x3/cd.svg';
import uz from 'flag-icons/flags/4x3/uz.svg';
import ht from 'flag-icons/flags/4x3/ht.svg';
import cw from 'flag-icons/flags/4x3/cw.svg';

// FIFA-3-Letter-Code -> SVG-URL
export const FLAG_SVGS: Record<string, string> = {
  USA: us, MEX: mx, CAN: ca, JAM: jm, HON: hn, PAN: pa,
  ARG: ar, BRA: br, URU: uy, COL: co, ECU: ec, VEN: ve, PAR: py,
  GER: de, FRA: fr, ESP: es, ENG: gbEng, POR: pt, NED: nl, BEL: be,
  AUT: at, SUI: ch, CRO: hr, SRB: rs, SCO: gbSct, DEN: dk, TUR: tr,
  POL: pl, SVN: si, UKR: ua,
  JPN: jp, KOR: kr, IRN: ir, AUS: au, SAU: sa, QAT: qa, IRQ: iq,
  JOR: jo, UZB: uz,
  MAR: ma, SEN: sn, EGY: eg, NGA: ng, CIV: ci, GHA: gh, CMR: cm,
  TUN: tn, RSA: za, ALG: dz, CPV: cv, COD: cd,
  NZL: nz, CZE: cz, BIH: ba, SWE: se, NOR: no, HAI: ht, CUW: cw,
};

export function flagSvg(code: string): string | null {
  return FLAG_SVGS[code] ?? null;
}
