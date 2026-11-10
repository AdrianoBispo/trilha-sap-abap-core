import type { ComponentType } from 'react';
import '@ui5/webcomponents-icons/dist/play.js';
import '@ui5/webcomponents-icons/dist/measure.js';
import '@ui5/webcomponents-icons/dist/org-chart.js';
import '@ui5/webcomponents-icons/dist/filter.js';
import '@ui5/webcomponents-icons/dist/chain-link.js';
import '@ui5/webcomponents-icons/dist/sorting-ranking.js';
import '@ui5/webcomponents-icons/dist/product.js';
import '@ui5/webcomponents-icons/dist/overview-chart.js';
import '@ui5/webcomponents-icons/dist/message-success.js';
import '@ui5/webcomponents-icons/dist/restart.js';
import '@ui5/webcomponents-icons/dist/syntax.js';
import '@ui5/webcomponents-icons/dist/key.js';
import '@ui5/webcomponents-icons/dist/puzzle.js';
import '@ui5/webcomponents-icons/dist/create.js';
import '@ui5/webcomponents-icons/dist/show.js';
import Hello from './Hello';
import DivCalc from './DivCalc';
import ObjLab from './ObjLab';
import SqlBuilder from './SqlBuilder';
import Corr from './Corr';
import Itab from './Itab';
import Eml from './Eml';
import Rap from './Rap';
import UnitRunner from './UnitRunner';
import ConvLab from './ConvLab';
import StrLab from './StrLab';
import AggLab from './AggLab';
import PerfChart from './PerfChart';
import AuthSim from './AuthSim';
import Poly from './Poly';
import TrySim from './TrySim';
import TableBuilder from './TableBuilder';
import PathLab from './PathLab';
import CaseLab from './CaseLab';
import UiLab from './UiLab';
import FunctionBuilder from './FunctionBuilder';
import ClassBuilder from './ClassBuilder';

/**
 * Laboratórios disponíveis para o Markdown: `::laboratorio{id="hello"}`.
 * Para criar um novo, escreva o componente nesta pasta e registre-o aqui.
 */
export const LABS: Record<string, ComponentType> = {
  hello: Hello,
  divcalc: DivCalc,
  objlab: ObjLab,
  sqlbuilder: SqlBuilder,
  corr: Corr,
  itab: Itab,
  eml: Eml,
  rap: Rap,
  unitrunner: UnitRunner,
  convlab: ConvLab,
  strlab: StrLab,
  agglab: AggLab,
  perfchart: PerfChart,
  authsim: AuthSim,
  poly: Poly,
  trysim: TrySim,
  tablebuilder: TableBuilder,
  pathlab: PathLab,
  caselab: CaseLab,
  uilab: UiLab,
  functionbuilder: FunctionBuilder,
  classbuilder: ClassBuilder,
};
