import { useState } from 'react';
import { CheckBox, Label, Option, Select } from '@ui5/webcomponents-react';
import CodeBlock from '../components/CodeBlock';
import { Field, LabCard, Row, Strip } from './common';

const C = ['BR', 'PT', 'DE', 'US'];
const A: [string, string][] = [['01', 'criar'], ['02', 'alterar'], ['03', 'exibir'], ['06', 'eliminar']];

/** AUTHORITY-CHECK contra a role do usuário: sy-subrc 0, 4 ou 12. */
export default function AuthSim() {
  const [has, setHas] = useState(true);
  const [cs, setCs] = useState(new Set(['BR', 'PT']));
  const [as, setAs] = useState(new Set(['03']));
  const [c, setC] = useState('BR');
  const [a, setA] = useState('02');

  const flip = (set: Set<string>, v: string, on: boolean) => { const n = new Set(set); if (on) n.add(v); else n.delete(v); return n; };
  const rc = !has ? 12 : cs.has(c) && as.has(a) ? 0 : 4;
  const why =
    rc === 0
      ? `A role concede ${c} e a atividade ${a}.`
      : rc === 4
        ? `A role tem o objeto, mas não para ${!cs.has(c) ? 'o país ' + c : ''}${!cs.has(c) && !as.has(a) ? ' nem ' : ''}${!as.has(a) ? 'a atividade ' + a : ''}.`
        : 'O usuário não tem nenhuma autorização para o objeto /DMO/TRVL.';

  return (
    <LabCard title="Simulador de autorização" subtitle="Objeto /DMO/TRVL · campos /DMO/CNTRY e ACTVT" icon="key">
      <div className="split">
        <div className="panel">
          <h4>Role do usuário</h4>
          <CheckBox text="Role contém autorização para /DMO/TRVL" checked={has} onChange={e => setHas(e.target.checked)} />
          <div>
            <Label showColon={false}>/DMO/CNTRY</Label>
            <Row className="checks">
              {C.map(x => <CheckBox key={x} text={x} disabled={!has} checked={cs.has(x)} onChange={e => setCs(s => flip(s, x, e.target.checked))} />)}
            </Row>
          </div>
          <div>
            <Label showColon={false}>ACTVT</Label>
            <Row className="checks">
              {A.map(([k, t]) => <CheckBox key={k} text={`${k} ${t}`} disabled={!has} checked={as.has(k)} onChange={e => setAs(s => flip(s, k, e.target.checked))} />)}
            </Row>
          </div>
        </div>
        <div className="panel">
          <h4>O que o código pede</h4>
          <Row>
            <Field label="País" htmlFor="au-c">
              <Select id="au-c" value={c} onChange={e => setC(e.target.value)}>{C.map(x => <Option key={x} value={x}>{x}</Option>)}</Select>
            </Field>
            <Field label="Atividade" htmlFor="au-a">
              <Select id="au-a" value={a} onChange={e => setA(e.target.value)}>{A.map(([k, t]) => <Option key={k} value={k}>{`${k} ${t}`}</Option>)}</Select>
            </Field>
          </Row>
        </div>
      </div>
      <CodeBlock
        title="Verificação"
        code={`AUTHORITY-CHECK OBJECT '/DMO/TRVL'\n  ID '/DMO/CNTRY' FIELD '${c}'\n  ID 'ACTVT'      FIELD '${a}'.\n\nIF sy-subrc <> 0.\n  RAISE EXCEPTION TYPE zcx_no_authorization.\nENDIF.`}
      />
      <Strip kind={rc === 0 ? 'sucesso' : rc === 12 ? 'erro' : 'aviso'}>
        <b>sy-subrc = {rc}</b> · {why}
      </Strip>
    </LabCard>
  );
}
