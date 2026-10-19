import "./ProductCell.css";

/** Célula "Produto" das tabelas: miniatura (decorativa) + nome + código. */
export default function ProductCell({ nome, codigo, imagem }) {
  return (
    <div className="celula-produto">
      {imagem ? (
        <img className="celula-produto__miniatura" src={imagem} alt="" />
      ) : (
        <span className="celula-produto__miniatura" aria-hidden="true" />
      )}
      <span className="celula-produto__nome">
        {nome}
        {codigo && <span className="celula-produto__codigo">{codigo}</span>}
      </span>
    </div>
  );
}
