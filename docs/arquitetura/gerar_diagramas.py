"""Gera os diagramas draw.io (estilo SAP Horizon) do AS ABAP, de sessões e memória e da SAP LUW.

Uso: python3 gerar_diagramas.py <pasta de saída>
"""
import os
import subprocess
import sys
from xml.sax.saxutils import escape

# Pasta da skill sap-architecture (biblioteca de ícones SAP). Ajuste com a variável SAP_ARCH_SKILL.
SKILL = os.path.expanduser(os.environ.get("SAP_ARCH_SKILL", "~/.claude/skills/sap-architecture"))
EXTRACT = os.path.join(SKILL, "scripts", "extract_asset.py")

OUT = sys.argv[1]

BASE = "rounded=1;whiteSpace=wrap;html=1;arcSize=16;absoluteArcSize=1;strokeWidth=1.5;fontFamily=Helvetica;"
ZONE = BASE + "container=1;collapsible=0;recursiveResize=0;align=left;verticalAlign=top;spacingLeft=10;spacingTop=10;fontSize=16;fontStyle=1;"
Z_SAP = ZONE + "strokeColor=#0070F2;fillColor=#EBF8FF;fontColor=#00185A;"
Z_EXT = ZONE + "strokeColor=#475E75;fillColor=#FFFFFF;fontColor=#475E75;"
FRAME = BASE + "align=left;verticalAlign=top;spacingLeft=10;spacingTop=8;fontSize=14;fontStyle=1;fontColor=#1D2D3E;"
F_WHITE = FRAME + "container=1;collapsible=0;recursiveResize=0;strokeColor=#0070F2;fillColor=#FFFFFF;"
F_BLUE = FRAME + "strokeColor=#0070F2;fillColor=#EBF8FF;"
F_NONE = FRAME + "strokeColor=#0070F2;fillColor=none;"
PILL = ("rounded=1;whiteSpace=wrap;html=1;arcSize=50;absoluteArcSize=1;strokeWidth=1;fontFamily=Helvetica;fontSize=10;"
        "align=center;verticalAlign=middle;strokeColor=#475E75;fillColor=#F5F6F7;fontColor=#475E75;")
CARD = BASE + "fontSize=12;align=center;verticalAlign=middle;fontColor=#1D2D3E;"
C_BLUE = CARD + "strokeColor=#0070F2;fillColor=#EBF8FF;"
C_WHITE = CARD + "strokeColor=#0070F2;fillColor=#FFFFFF;"
C_EXT = CARD + "strokeColor=#475E75;fillColor=#F5F6F7;"
C_TEAL = CARD + "strokeColor=#07838F;fillColor=#DAFDF5;"
C_INDIGO = CARD + "strokeColor=#5D36FF;fillColor=#F1ECFF;"
EDGE = ("edgeStyle=orthogonalEdgeStyle;rounded=0;html=1;strokeColor=#475E75;strokeWidth=1.5;"
        "endArrow=blockThin;endSize=6;endFill=1;fontFamily=Helvetica;fontSize=10;fontColor=#475E75;"
        "labelBackgroundColor=default;")
TITLE = "text;html=1;fontFamily=Helvetica;fontSize=24;fontStyle=1;fontColor=#002A86;align=left;verticalAlign=middle;"
SUB = "text;html=1;fontFamily=Helvetica;fontSize=14;fontColor=#475E75;align=left;verticalAlign=middle;"
NOTE = "text;html=1;whiteSpace=wrap;fontFamily=Helvetica;fontSize=11;fontColor=#556B82;align=left;verticalAlign=middle;"

SIDES = {"t": (0.5, 0), "b": (0.5, 1), "l": (0, 0.5), "r": (1, 0.5)}


class Diagram:
    def __init__(self, name):
        self.name = name
        self.cells = []
        self.icons = []
        self.origin = {"1": (0, 0)}
        self.zone = "1"

    def v(self, id_, value, style, x, y, w, h, zone=False):
        """Coordenadas absolutas; viram relativas à zona corrente (contêiner)."""
        parent = "1" if zone else self.zone
        ox, oy = self.origin[parent]
        self.cells.append(
            f'<mxCell id="{id_}" value="{escape(value, {chr(34): "&quot;"})}" style="{style}" vertex="1" parent="{parent}">'
            f'<mxGeometry x="{x - ox}" y="{y - oy}" width="{w}" height="{h}" as="geometry"/></mxCell>')
        self.origin[id_] = (x, y)
        if zone:
            self.zone = id_

    def icon(self, id_, query, x, y, size=32, label="", parent="1"):
        """Ícone da biblioteca oficial SAP (só no arquivo .drawio)."""
        out = subprocess.run([sys.executable, EXTRACT, query, "--kind", "generic-icon", "--id", id_, "--parent", parent,
                              "--x", str(x), "--y", str(y), "--w", str(size), "--h", str(size), "--label", label],
                             capture_output=True, text=True, check=True).stdout
        self.icons.append("".join(l for l in out.splitlines() if not l.startswith("#")))

    def card(self, id_, title, caption, style, x, y, w, h):
        val = f"<b>{title}</b>"
        if caption:
            val += f'<br/><span style="font-size:11px;color:#556B82;font-weight:normal;">{caption}</span>'
        self.v(id_, val, style, x, y, w, h)

    def pill(self, id_, text, x, y, w=60):
        self.cells.append(
            f'<mxCell id="{id_}" value="&lt;b style=&quot;font-size:10px;&quot;&gt;{escape(text)}&lt;/b&gt;" style="{PILL}" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="20" as="geometry"/></mxCell>')

    def e(self, id_, src, tgt, label="", out="b", inn="t", extra="", out_at=None, in_at=None, in_dx=0):
        ox, oy = out_at or SIDES[out]
        ix, iy = in_at or SIDES[inn]
        style = (EDGE + f"exitX={ox};exitY={oy};exitDx=0;exitDy=0;entryX={ix};entryY={iy};entryDx={in_dx};entryDy=0;" + extra)
        self.cells.append(
            f'<mxCell id="{id_}" value="{escape(label)}" style="{style}" edge="1" parent="1" source="{src}" target="{tgt}">'
            f'<mxGeometry relative="1" as="geometry"/></mxCell>')

    def model(self, icons=True):
        return ('<mxGraphModel dx="1169" dy="827" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" '
                'fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0" adaptiveColors="auto">'
                '<root><mxCell id="0"/><mxCell id="1" parent="0"/>' + "".join(self.cells) + ("".join(self.icons) if icons else "") + "</root></mxGraphModel>")

    def save(self, path):
        with open(path, "w", encoding="utf-8") as f:
            f.write(f'<mxfile host="app.diagrams.net"><diagram name="{escape(self.name)}" id="{self.name.lower().replace(" ", "-")}">'
                    + self.model() + "</diagram></mxfile>\n")
        with open(path.replace(".drawio", ".model.xml"), "w", encoding="utf-8") as f:
            f.write(self.model(icons=False))


# ---------------------------------------------------------------- Diagrama 1
d = Diagram("AS ABAP - Arquitetura")
d.v("title", "Arquitetura do servidor de aplicação ABAP (AS ABAP)", TITLE, 40, 20, 1090, 40)
d.v("sub", "Três camadas: apresentação, aplicação (instâncias com dispatcher e work processes) e banco de dados", SUB, 40, 60, 1090, 30)

d.v("z-pres", "Camada de apresentação", Z_EXT, 40, 100, 1090, 100, zone=True)
d.card("p-web", "Navegador · ADT", "SAP Fiori, APIs e Eclipse", C_EXT, 440, 140, 160, 50)
d.card("p-gui", "SAP GUI", "telas clássicas (dynpro)", C_EXT, 630, 140, 160, 50)
d.card("p-ext", "Sistemas externos", "outros sistemas SAP e não SAP", C_EXT, 820, 140, 160, 50)
d.icon("ic-user", "user non sap", 240, 130, label="Usuário")
d.icon("ic-dev", "devices non sap", 320, 130, label="Navegador")
d.icon("ic-desk", "desktop non sap", 400, 130, label="Desktop")

d.v("z-app", "Camada de aplicação · sistema ABAP", Z_SAP, 40, 230, 1090, 470, zone=True)

d.v("f-ascs", "ABAP Central Services (ASCS)", F_NONE, 60, 270, 230, 410)
d.card("c-ms", "Message Server", "comunicação entre instâncias<br/>e balanceamento de logon", C_WHITE, 80, 380, 190, 70)
d.card("c-enq", "Enqueue Server", "tabela de bloqueios lógicos<br/>(objetos de bloqueio)", C_WHITE, 80, 490, 190, 60)

d.v("f-inst", "Instância do servidor de aplicação", F_NONE, 310, 270, 800, 410)
d.card("c-icm", "ICM", "HTTP(S), SMTP · ICF", C_WHITE, 440, 310, 160, 50)
d.card("c-gw", "Gateway", "RFC de entrada e saída", C_WHITE, 820, 310, 160, 50)
d.card("c-disp", "Dispatcher", "recebe as requisições, mantém a fila e entrega ao work process livre", C_INDIGO, 330, 390, 760, 50)

d.v("f-wp", "Work processes · executam os programas ABAP", F_WHITE, 330, 470, 760, 100)
d.zone = "f-wp"
d.card("w-dia", "Diálogo (DIA)", "passos de diálogo, HTTP, RFC", C_BLUE, 340, 510, 170, 50)
d.card("w-upd", "Atualização (UPD)", "funções de update da SAP LUW", C_BLUE, 530, 510, 170, 50)
d.card("w-btc", "Background (BTC)", "jobs sem interação", C_BLUE, 720, 510, 170, 50)
d.card("w-spo", "Spool (SPO)", "saída para impressão", C_BLUE, 910, 510, 170, 50)

d.zone = "z-app"
d.card("c-shm", "Memória compartilhada da instância", "buffer de programas (PXA) · buffers de tabela · Extended Memory · Shared Objects", C_TEAL, 330, 600, 380, 60)

d.v("z-db", "Camada de banco de dados", Z_SAP, 320, 730, 810, 80, zone=True)
d.card("c-db", "SAP HANA", "tabelas, CDS views e procedimentos (AMDP)", C_WHITE, 750, 750, 300, 50)

d.zone = "1"
d.v("legend", "<b>Legenda</b><br/>Seta: sentido da requisição (síncrona)<br/>Azul: componentes do sistema ABAP<br/>Cinza: clientes e sistemas externos",
    BASE + "fontSize=11;align=left;verticalAlign=middle;spacingLeft=10;strokeColor=#475E75;fillColor=#FFFFFF;fontColor=#556B82;", 40, 730, 250, 80)

d.e("e-web", "p-web", "c-icm")
d.e("e-gui", "p-gui", "c-disp")
d.e("e-ext", "p-ext", "c-gw")
d.e("e-icm", "c-icm", "c-disp", in_at=(0.25, 0))
d.e("e-gw", "c-gw", "c-disp", in_at=(0.75, 0))
d.e("e-wp", "c-disp", "f-wp")
d.e("e-ms", "c-ms", "c-disp", out="r", inn="l", extra="startArrow=blockThin;startSize=6;startFill=1;")
d.e("e-enq", "f-wp", "c-enq", out="l", inn="r")
d.e("e-shm", "f-wp", "c-shm", out_at=(0.25, 1))
d.e("e-db", "f-wp", "c-db", out_at=(0.75, 1))
d.pill("pl-web", "HTTPS", 490, 210)
d.pill("pl-gui", "DIAG", 680, 210)
d.pill("pl-ext", "RFC", 870, 210)
d.pill("pl-db", "ABAP SQL", 860, 700, w=80)
d.save(f"{OUT}/as-abap-arquitetura.drawio")

# ---------------------------------------------------------------- Diagrama 2
m = Diagram("AS ABAP - Sessoes e memoria")
m.v("title", "Sessões e memória no AS ABAP", TITLE, 40, 20, 1090, 40)
m.v("sub", "Uma instância do servidor de aplicação: memória compartilhada, sessões do usuário e o work process que as executa", SUB, 40, 60, 1090, 30)

m.v("z-shm", "Memória compartilhada da instância · visível a todos os usuários e work processes", Z_SAP, 40, 100, 1090, 110, zone=True)
m.card("s-shmo", "Shared Objects", "objetos em áreas de shared memory", C_TEAL, 60, 140, 330, 50)
m.card("s-buf", "Buffers de tabela", "tabelas com buffering no Dictionary", C_TEAL, 420, 140, 330, 50)
m.card("s-pxa", "Buffer de programas (PXA)", "código compilado dos programas", C_TEAL, 780, 140, 330, 50)

m.v("z-user", "Sessão de usuário · criada no logon (até 6 sessões ABAP por padrão)", Z_SAP, 40, 240, 740, 520, zone=True)
m.card("u-sap", "SAP Memory", "SET PARAMETER ID / GET PARAMETER ID · compartilhada por todas as sessões ABAP do usuário", C_WHITE, 60, 290, 700, 50)

m.v("f-s1", "Sessão ABAP 1 · sessão principal (uma janela)", F_NONE, 60, 370, 700, 220)
m.card("a1-mem", "ABAP Memory", "EXPORT … TO MEMORY ID / IMPORT … FROM MEMORY ID · vale para a sequência de chamadas", C_WHITE, 80, 410, 660, 50)
m.card("a1-i1", "Sessão interna 1", "programa A<br/>dados e objetos próprios", C_WHITE, 80, 490, 160, 80)
m.card("a1-i2", "Sessão interna 2", "programa B<br/>SUBMIT … AND RETURN", C_WHITE, 330, 490, 160, 80)
m.card("a1-i3", "Sessão interna 3", "programa C<br/>CALL TRANSACTION", C_WHITE, 580, 490, 160, 80)

m.v("f-s2", "Sessão ABAP 2 · outra janela do mesmo usuário", F_NONE, 60, 620, 700, 120)
m.card("a2-mem", "ABAP Memory", "área própria desta sessão", C_WHITE, 80, 670, 320, 50)
m.card("a2-i1", "Sessão interna 1", "programa em execução", C_WHITE, 420, 670, 320, 50)

m.v("z-wp", "Work process", Z_SAP, 890, 240, 240, 520, zone=True)
m.v("wp-note", "A cada passo de diálogo o contexto do usuário é carregado no work process livre e liberado ao final.", NOTE, 910, 280, 200, 60)
m.card("wp-roll", "Roll area", "parte inicial do contexto", C_WHITE, 910, 350, 200, 60)
m.card("wp-em", "Extended Memory (EM)", "maior parte do contexto,<br/>mapeada no work process", C_WHITE, 910, 450, 200, 70)
m.card("wp-heap", "Heap · memória privada", "quando a EM se esgota:<br/>modo PRIV, sem troca de usuário", C_INDIGO, 910, 560, 200, 70)
m.v("wp-order", "Ordem de alocação em um work process de diálogo (simplificada): roll area → Extended Memory → heap.", NOTE, 910, 650, 200, 90)

m.icon("ic-user", "user sap", 740, 250, size=24)
m.icon("ic-wp", "settings sap", 1090, 250, size=24)
m.icon("ic-shm", "documents sap", 1090, 110, size=24)
m.e("e-12", "a1-i1", "a1-i2", out="r", inn="l")
m.e("e-23", "a1-i2", "a1-i3", out="r", inn="l")
m.e("e-ctx", "z-user", "z-wp", out="r", inn="l", extra="startArrow=blockThin;startSize=6;startFill=1;")
m.e("e-r-em", "wp-roll", "wp-em")
m.e("e-em-h", "wp-em", "wp-heap")
m.pill("pl-12", "SUBMIT", 250, 520, w=70)
m.pill("pl-23", "CALL", 500, 520, w=70)
m.pill("pl-ctx", "ROLL-IN / OUT", 790, 490, w=90)
m.save(f"{OUT}/as-abap-sessoes-memoria.drawio")

# ---------------------------------------------------------------- Diagrama 3
C_GREEN = CARD + "strokeColor=#188918;fillColor=#F5FAE5;"
LEG = BASE + "fontSize=11;align=left;verticalAlign=middle;spacingLeft=10;strokeColor=#475E75;fillColor=#FFFFFF;fontColor=#556B82;"
w = Diagram("SAP LUW")
w.v("title", "SAP LUW: da primeira tela ao COMMIT WORK", TITLE, 40, 20, 1000, 40)
w.v("sub", "Vários passos de diálogo, cada um com sua LUW de banco, formam uma única unidade lógica de trabalho da aplicação", SUB, 40, 60, 1090, 30)

w.v("z-luw", "SAP LUW · alterações agrupadas e confirmadas juntas: tudo ou nada", Z_SAP, 40, 100, 1090, 340, zone=True)
w.card("c-lock", "Bloqueio SAP · Enqueue Server", "pedido no início, mantido entre os passos de diálogo e liberado só ao fim da atualização", C_TEAL, 60, 150, 1050, 50)
w.v("f-dia", "Work process de diálogo · sessão do usuário", F_NONE + "align=right;spacingRight=10;", 60, 240, 780, 180)
w.card("s1", "Passo de diálogo 1", "lê os dados e bloqueia o registro<br/>CALL FUNCTION 'ENQUEUE_…'", C_WHITE, 80, 290, 220, 100)
w.card("s2", "Passo de diálogo 2", "valida e registra as gravações<br/>CALL FUNCTION … IN UPDATE TASK", C_WHITE, 340, 290, 220, 100)
w.card("s3", "Passo de diálogo 3", "encerra a SAP LUW<br/>COMMIT WORK", C_WHITE, 600, 290, 220, 100)
w.card("u1", "Work process de atualização", "os módulos de update registrados<br/>executam as gravações<br/>em uma única LUW de banco", C_INDIGO, 880, 290, 220, 100)

w.v("z-db", "Banco de dados · uma LUW de banco por passo", Z_SAP, 40, 470, 1090, 150, zone=True)
w.card("d1", "LUW de banco 1", "só leituras<br/>termina em commit implícito", C_WHITE, 80, 520, 220, 80)
w.card("d2", "LUW de banco 2", "só leituras<br/>termina em commit implícito", C_WHITE, 340, 520, 220, 80)
w.card("d3", "LUW de banco 3", "nenhuma gravação da aplicação<br/>termina com o COMMIT WORK", C_WHITE, 600, 520, 220, 80)
w.card("d4", "LUW de banco da atualização", "todas as gravações juntas<br/>COMMIT ou ROLLBACK", C_GREEN, 880, 520, 220, 80)

w.zone = "1"
w.v("legend", "<b>Legenda</b><br/>Seta: sequência no tempo ou chamada<br/>Cada passo de diálogo ocupa um work process e fecha uma LUW de banco<br/>ROLLBACK WORK antes do COMMIT WORK descarta os registros e encerra a SAP LUW", LEG, 40, 650, 530, 90)
w.v("cloud", "<b>ABAP Cloud e RAP · SAP LUW controlada</b><br/>Fase de modificação: alterações ficam no buffer transacional<br/>Fase de save: COMMIT ENTITIES grava tudo em uma LUW de banco<br/>CL_ABAP_TX marca as fases; gravar fora da fase de save gera erro de runtime", LEG, 600, 650, 530, 90)

w.icon("ic-lock", "locked sap", 1090, 110, size=24)
w.icon("ic-db", "documents sap", 1090, 480, size=24)
w.icon("ic-cloud", "cloud sap", 496, 8, size=24, parent="cloud")
w.e("e-12", "s1", "s2", out="r", inn="l")
w.e("e-23", "s2", "s3", out="r", inn="l")
w.e("e-3u", "s3", "u1", out="r", inn="l")
w.e("e-enq", "s1", "c-lock", out="t", in_at=(0, 1), in_dx=130)
w.e("e-deq", "u1", "c-lock", out="t", in_at=(0, 1), in_dx=930)
w.e("e-d1", "s1", "d1")
w.e("e-d2", "s2", "d2")
w.e("e-d3", "s3", "d3")
w.e("e-d4", "u1", "d4")
w.pill("pl-enq", "ENQUEUE", 150, 210, w=80)
w.pill("pl-deq", "DEQUEUE", 950, 230, w=80)
w.pill("pl-c1", "COMMIT IMPLÍCITO", 130, 440, w=120)
w.pill("pl-c2", "COMMIT IMPLÍCITO", 390, 440, w=120)
w.pill("pl-c3", "COMMIT WORK", 660, 440, w=100)
w.pill("pl-c4", "DB COMMIT", 950, 440, w=80)
w.save(f"{OUT}/sap-luw.drawio")
print("ok")
