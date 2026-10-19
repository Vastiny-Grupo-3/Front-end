/** Cartão de seção das Configurações: título, subtítulo e ação no cabeçalho. */
export default function SectionCard({ id, titulo, subtitulo, acao, perigo = false, children }) {
  return (
    <section className={`secao ${perigo ? "secao--perigo" : ""}`.trim()} aria-labelledby={id}>
      <div className="secao__cabecalho">
        <div className="secao__titulos">
          <h2 id={id} className="secao__titulo">
            {titulo}
          </h2>
          {subtitulo && <p className="secao__subtitulo">{subtitulo}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}
