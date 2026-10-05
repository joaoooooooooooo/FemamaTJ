import { useEffect } from "react";
import data from "../data/survey-results.json";
// @ts-expect-error The questionnaire is shared with the existing JSX form.
import { questionnaireQuestions } from "../features/questionnaire/hooks/useQuestionnaireForm";
import "./Analytics.css";

type Count = { label: string; count: number };
const counts: Record<string, Count[]> = data.counts;
const percent = (value: number) => `${(value / data.total * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
const date = (value: string) => value.split("-").reverse().join("/");
const fields = ["Adjuvante neoadjuvante", "Recidiva", "Metastase", "Tratamento previne", "Jornada unica", "Opcoes todos estagios", "Conhecer opcoes"];
const ages = ["Entre 18 e 30 anos", "Entre 31 e 40 anos", "Entre 40 e 50 anos", "Entre 50 e 60 anos", ">60 anos", "Sem resposta"];

function Breakdown({ field, title, wide = false }: { field: string; title: string; wide?: boolean }) {
  const values = field === "Idade" ? [...counts[field]].sort((a, b) => ages.indexOf(a.label) - ages.indexOf(b.label)) : counts[field];
  return <article className={`card${wide ? " wide" : ""}`}><h3>{title}</h3>{values.map(value => <div className="row" key={value.label}>
    <div className="label"><span>{value.label}</span><b>{value.count} · {percent(value.count)}</b></div>
    <div className="track" aria-hidden="true"><div className="fill" style={{ width: `${value.count / data.total * 100}%` }} /></div>
  </div>)}</article>;
}

export default function AnalyticsPage() {
  useEffect(() => {
    const previous = document.title;
    document.title = "FEMAMA · Resultados da pesquisa 2026";
    return () => { document.title = previous; };
  }, []);
  const peak = Math.max(...data.days.map(day => day.count));
  const gap = counts[fields[0]].find(value => value.label === "Não")?.count ?? 0;
  const messageCount = data.total - (counts["Flower text"].find(value => value.label === "Sem resposta")?.count ?? 0);
  const period = `${date(data.days[0].label)} — ${date(data.days.at(-1)!.label)}`;
  return <div className="survey-analytics"><main>
    <nav aria-label="Navegação"><a href="/admin">← Administração</a><a href="/">Abrir pesquisa</a></nav>
    <header><div><div className="brand">FEMAMA / 2026</div><h1>Respostas que contam uma história</h1><p>Resultados da pesquisa · {period}</p></div><button onClick={() => window.print()}>Imprimir / salvar PDF</button></header>
    <section className="stats" aria-label="Resumo">
      <div className="stat"><p>Respostas recebidas</p><strong>{data.total}</strong><small>Todos os envios do arquivo</small></div>
      <div className="stat"><p>Dias com participação</p><strong>{data.days.length}</strong><small>{period}</small></div>
      <div className="stat"><p>Perfis representados</p><strong>{counts.Perfil.filter(value => value.label !== "Sem resposta").length}</strong><small>Pacientes, profissionais e comunidade</small></div>
    </section>
    <h2>Participação ao longo dos dias</h2><div className="card timeline">{data.days.map(day => <div className="day" key={day.label}><span className="muted">{date(day.label)}</span><strong>{day.count} respostas</strong><div className="track" aria-hidden="true"><div className="fill" style={{ width: `${day.count / peak * 100}%` }} /></div><p className="muted">{percent(day.count)} do total</p></div>)}</div>
    <h2>Quem participou</h2><p>Distribuição de todas as respostas por perfil, faixa etária e região.</p>
    <section className="grid" aria-label="Perfil dos participantes"><Breakdown field="Perfil" title="Perfil dos participantes" /><Breakdown field="Idade" title="Faixa etária" /><Breakdown field="Regiao" title="Região informada" wide /></section>
    <h2>Conhecimento e percepção</h2><p>Respostas autodeclaradas às sete perguntas do formulário.</p>
    <div className="note">Maior oportunidade de informação: {gap} participantes ({percent(gap)}) responderam “Não” à pergunta sobre a diferença entre tratamento adjuvante e neoadjuvante.</div>
    <section className="grid" aria-label="Respostas por pergunta">{fields.map((field, index) => {
      const values = [...counts[field]].sort((a, b) => ["Sim", "Não", "Sem resposta"].indexOf(a.label) - ["Sim", "Não", "Sem resposta"].indexOf(b.label));
      const color = (label: string) => label === "Sim" ? 0 : label === "Não" ? 1 : 2;
      return <article className="card question" key={field}><p className="muted">PERGUNTA {String(index + 1).padStart(2, "0")}</p><h3>{questionnaireQuestions[index + 3].question}</h3>
        <div className="stack" aria-hidden="true">{values.map(value => <div key={value.label} className={`segment-${color(value.label)}`} style={{ width: `${value.count / data.total * 100}%` }} />)}</div>
        <div className="legend">{values.map(value => <span key={value.label}><i aria-hidden="true" className={`dot segment-${color(value.label)}`} />{value.label}: {value.count} ({percent(value.count)})</span>)}</div>
      </article>;
    })}</section>
    <h2>Mensagens deixadas nas flores</h2><p>Textos enviados no formulário, agrupados quando idênticos.</p>
    <div className="card"><span>{messageCount} mensagens enviadas</span><details><summary>Ver todas as mensagens</summary><table><thead><tr><th scope="col">Mensagem</th><th scope="col">Respostas</th></tr></thead><tbody>{counts["Flower text"].map(value => <tr key={value.label}><td>{value.label}</td><td>{value.count}</td></tr>)}</tbody></table></details></div>
    <h2>Contexto dos acessos</h2><p>Cidade e país são metadados do arquivo exportado; a região acima foi informada no questionário.</p>
    <section className="grid" aria-label="Contexto dos acessos"><Breakdown field="City" title="Cidade registrada" /><Breakdown field="Country" title="País registrado" /><Breakdown field="Device" title="Dispositivo" /><Breakdown field="Browser" title="Navegador" /></section>
    <footer>Fonte: femama-tj2026-17912262426966.csv. Cada envio conta como uma resposta; não há deduplicação por pessoa. Percentuais calculados sobre os {data.total} envios e arredondados a uma casa decimal. Campos vazios aparecem como “Sem resposta”.<br />Este relatório é um retrato do arquivo exportado e não é atualizado automaticamente. IDs, dados técnicos de desenho e imagens das flores foram excluídos. Nenhum identificador individual está incluído nesta página.</footer>
  </main></div>;
}
