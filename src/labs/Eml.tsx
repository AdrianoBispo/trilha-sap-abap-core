import { useState, type ReactNode } from 'react';
import { Button, Icon, Input } from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/accept.js';
import '@ui5/webcomponents-icons/dist/reset.js';
import '@ui5/webcomponents-icons/dist/show.js';
import '@ui5/webcomponents-icons/dist/database.js';
import '@ui5/webcomponents-icons/dist/source-code.js';
import '@ui5/webcomponents-icons/dist/sys-enter-2.js';
import { Field, LabCard, Note, Row, StatusTag, Strip } from './common';

type Box = 'prog' | 'buf' | 'db';
interface Msg { kind: 'info' | 'aviso' | 'erro' | 'sucesso'; body: ReactNode }

/** Buffer transacional: MODIFY, COMMIT, ROLLBACK, READ ENTITIES e SELECT. */
export default function Eml() {
  const [name, setName] = useState('Agência Recife');
  const [db, setDb] = useState('Agência Central');
  const [buf, setBuf] = useState<string | null>(null);
  const [live, setLive] = useState<Box>('prog');
  const [stmt, setStmt] = useState('');
  const [msg, setMsg] = useState<Msg | null>(null);

  const modify = () => {
    setBuf(name); setLive('buf');
    setStmt(`MODIFY ENTITIES … UPDATE FIELDS ( name ) WITH VALUE #( ( agencyid = '070050' name = '${name}' ) ).`);
    setMsg({ kind: 'info', body: 'Alteração guardada no buffer. O banco ainda tem o valor antigo.' });
  };
  const commit = () => {
    setStmt('COMMIT ENTITIES RESPONSE OF /dmo/r_agencytp FAILED DATA(failed) REPORTED DATA(reported).');
    if (buf == null) { setLive('prog'); setMsg({ kind: 'info', body: 'Nada no buffer: o commit não grava nada.' }); }
    else if (!buf.trim()) {
      setLive('buf');
      setMsg({ kind: 'erro', body: <><strong>sy-subrc = 4.</strong> A validação do BO rejeitou o save: <code className="md-code">failed</code> contém a agência 070050 e <code className="md-code">reported</code> traz a mensagem “Nome da agência é obrigatório”. O buffer continua com a alteração até você corrigir ou fazer ROLLBACK.</> });
    } else {
      setDb(buf); setBuf(null); setLive('db');
      setMsg({ kind: 'sucesso', body: <><strong>sy-subrc = 0.</strong> Validações passaram e o buffer foi gravado no banco numa única LUW.</> });
    }
  };
  const rollback = () => { setStmt('ROLLBACK ENTITIES.'); setBuf(null); setLive('buf'); setMsg({ kind: 'info', body: 'Buffer descartado. O banco não foi alterado.' }); };
  const read = () => {
    setStmt('READ ENTITIES OF /dmo/r_agencytp ENTITY /dmo/agency FIELDS ( name ) WITH … RESULT DATA(agencies).');
    setLive(buf != null ? 'buf' : 'db');
    setMsg({ kind: 'info', body: <>READ ENTITIES retornou <strong>'{buf ?? db}'</strong>{buf != null ? ': ele enxerga o buffer, inclusive alterações ainda não gravadas.' : '.'}</> });
  };
  const select = () => {
    setStmt(`SELECT SINGLE FROM /dmo/agency FIELDS name WHERE agency_id = '070050' INTO @DATA(name).`);
    setLive('db');
    setMsg({ kind: buf != null ? 'aviso' : 'info', body: <>SELECT retornou <strong>'{db}'</strong>{buf != null ? ': o SQL lê o banco e não vê o buffer.' : '.'}</> });
  };

  const box = (id: Box, icon: string, title: string, body: ReactNode) => (
    <div className={`fbox${live === id ? ' live' : ''}`}>
      <h4><Icon name={icon} /> {title}</h4>
      {body}
    </div>
  );

  return (
    <LabCard title="Buffer transacional na prática" subtitle="BO /DMO/R_AGENCYTP · agência 070050" icon="product">
      <Row>
        <Field label="Novo nome" htmlFor="em-name" grow><Input id="em-name" value={name} onInput={e => setName(e.target.value)} /></Field>
        <Button design="Emphasized" onClick={modify}>MODIFY ENTITIES</Button>
        <Button icon="accept" onClick={commit}>COMMIT ENTITIES</Button>
        <Button icon="reset" onClick={rollback}>ROLLBACK ENTITIES</Button>
      </Row>
      <Row>
        <Button design="Transparent" icon="show" onClick={read}>READ ENTITIES</Button>
        <Button design="Transparent" icon="database" onClick={select}>SELECT na tabela</Button>
        <Note>Dica: tente gravar um nome vazio para disparar a validação do BO.</Note>
      </Row>
      <div className="flowbox">
        {box('prog', 'source-code', 'Seu programa', stmt ? <code className="md-code wrap-any">{stmt}</code> : <span className="note">Nenhuma instrução.</span>)}
        {box('buf', 'sys-enter-2', 'Buffer transacional', buf != null ? <><span className="vis-box">name = '{buf}'</span><StatusTag tipo="aviso">pendente</StatusTag></> : <span className="note">vazio</span>)}
        {box('db', 'database', 'Banco · /DMO/AGENCY', <span className="vis-box">name = '{db}'</span>)}
      </div>
      {msg && <Strip kind={msg.kind}>{msg.body}</Strip>}
    </LabCard>
  );
}
